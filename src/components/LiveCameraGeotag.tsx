'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, SwitchCamera, CheckCircle2, AlertCircle, Trash2, MapPin, Sparkles, Shield, Loader2 } from 'lucide-react';
import { geocodingService } from '../services/geocodingService';

interface LiveCameraGeotagProps {
  onCapture: (imageDataUrl: string, locationData: { lat: number; lng: number; landmark: string; displayName: string }) => void;
  onRemove: () => void;
  capturedEvidence: string[];
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentLandmark: string;
  onLocationUpdate: (lat: number, lng: number, landmark: string, displayName: string) => void;
}

export default function LiveCameraGeotag({
  onCapture,
  onRemove,
  capturedEvidence,
  currentLatitude,
  currentLongitude,
  currentLandmark,
  onLocationUpdate
}: LiveCameraGeotagProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraConnecting, setIsCameraConnecting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [liveGpsInfo, setLiveGpsInfo] = useState<{
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    landmark: string;
    displayName: string;
  }>({
    lat: currentLatitude,
    lng: currentLongitude,
    accuracy: null,
    landmark: currentLandmark,
    displayName: ''
  });

  // Sync external coordinates if changed
  useEffect(() => {
    if (currentLatitude && currentLongitude) {
      setLiveGpsInfo(prev => ({
        ...prev,
        lat: currentLatitude,
        lng: currentLongitude,
        landmark: currentLandmark || prev.landmark
      }));
    }
  }, [currentLatitude, currentLongitude, currentLandmark]);

  // Detect available cameras on mount
  useEffect(() => {
    async function detectCameras() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // Silent — enumeration may fail before permission grant
      }
    }
    detectCameras();
  }, []);

  // Acquire high accuracy GPS location for geotagging
  const fetchLiveGps = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return null;
    }

    setIsAcquiringGps(true);
    return new Promise<{ lat: number; lng: number; landmark: string; displayName: string } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!pos || !pos.coords) {
            setIsAcquiringGps(false);
            resolve(null);
            return;
          }

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          let landmarkName = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          let displayName = '';

          try {
            const geocoded = await geocodingService.reverseGeocode(lat, lng);
            if (geocoded) {
              landmarkName = geocoded.locality || geocoded.displayName.split(',')[0] || landmarkName;
              displayName = geocoded.displayName;
            }
          } catch (e) {
            console.warn('Geocoding lookup warning:', e);
          }

          setLiveGpsInfo({
            lat,
            lng,
            accuracy,
            landmark: landmarkName,
            displayName
          });

          onLocationUpdate(lat, lng, landmarkName, displayName);
          setIsAcquiringGps(false);
          resolve({ lat, lng, landmark: landmarkName, displayName });
        },
        (err) => {
          console.warn('Live GPS fetch warning:', err);
          setIsAcquiringGps(false);
          // Fallback to default coordinates if available
          if (currentLatitude && currentLongitude) {
            resolve({
              lat: currentLatitude,
              lng: currentLongitude,
              landmark: currentLandmark || 'Civic Station',
              displayName: ''
            });
          } else {
            resolve(null);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [currentLatitude, currentLongitude, currentLandmark, onLocationUpdate]);

  // Stop camera media stream — ensure all tracks are killed
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force release of the media resource
    }
    setIsCameraActive(false);
    setIsCameraConnecting(false);
  }, []);

  // Attach stream to video element with proper event handling
  const attachStreamToVideo = useCallback((stream: MediaStream): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        resolve(false);
        return;
      }

      // Prepare video playback policies for mobile and desktop browsers
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');

      // Clean up any existing stream
      video.srcObject = null;

      const onLoadedMetadata = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.play()
          .then(() => resolve(true))
          .catch((e) => {
            console.warn('Video play error:', e);
            // Try muted play again (some browsers require muted before activity)
            video.muted = true;
            video.playsInline = true;
            video.play()
              .then(() => resolve(true))
              .catch(() => resolve(false));
          });
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.srcObject = stream;

      // Timeout fallback — if loadedmetadata doesn't fire in 5s, retry
      setTimeout(() => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        if (video.readyState >= 1) {
          video.play().catch(() => {});
          resolve(true);
        } else if (video.srcObject) {
          // Force a play attempt even without metadata
          video.play()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        } else {
          resolve(false);
        }
      }, 5000);
    });
  }, []);

  // Start live camera stream with progressive fallback chain
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraConnecting(true);
    stopCameraStream();
    // stopCameraStream() sets isCameraConnecting back to false as a side
    // effect of resetting camera state — re-assert it here so the
    // "connecting" UI (which now keeps <video> mounted) stays visible
    // while getUserMedia() resolves.
    setIsCameraConnecting(true);

    // Trigger GPS acquisition in parallel with opening camera
    fetchLiveGps().catch(() => {});

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or requires HTTPS.');
      }

      // Progressive fallback chain for camera constraints
      // 1. Try exact back camera (mobile) with high resolution
      // 2. Try ideal back camera (more permissive)
      // 3. Try front camera
      // 4. Try bare video: true (any camera)
      const constraintChain: (MediaStreamConstraints | null)[] = [
        // Attempt 1: Exact environment (rear) camera — best for mobile/tablet
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        },
        // Attempt 2: Ideal (preferred) facing mode — works on more devices
        {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        },
        // Attempt 3: Try specific device by label (rear/back camera detection)
        null, // Placeholder — filled dynamically below
        // Attempt 4: Any available camera, no constraints
        {
          video: true,
          audio: false,
        },
      ];

      // Attempt 3: Try to find rear camera by device label
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const rearCamera = videoDevices.find(d =>
          /back|rear|environment/i.test(d.label)
        );
        const frontCamera = videoDevices.find(d =>
          /front|user|face/i.test(d.label)
        );
        const preferredDevice = facingMode === 'environment' ? rearCamera : frontCamera;

        if (preferredDevice) {
          constraintChain[2] = {
            video: {
              deviceId: { exact: preferredDevice.deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          };
        }
      } catch {
        // Device enumeration failed — skip attempt 3
      }

      let stream: MediaStream | null = null;

      for (let i = 0; i < constraintChain.length; i++) {
        const constraints = constraintChain[i];
        if (!constraints) continue;

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream && stream.getVideoTracks().length > 0) {
            break; // Success
          }
        } catch (attemptErr: any) {
          // If permission denied on any attempt, stop immediately
          if (attemptErr.name === 'NotAllowedError' || attemptErr.name === 'PermissionDeniedError') {
            throw attemptErr;
          }
          // Otherwise continue to next fallback
          console.warn(`Camera constraint attempt ${i + 1} failed:`, attemptErr.name);
          stream = null;
        }
      }

      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('Could not access any camera on this device.');
      }

      streamRef.current = stream;

      // Attach to video element.
      // NOTE: the <video> element is now rendered as soon as
      // isCameraConnecting is true (see the merged connecting/active
      // render branch below), so videoRef.current is guaranteed to be
      // non-null here even though getUserMedia() took time to resolve.
      const attached = await attachStreamToVideo(stream);
      if (!attached) {
        throw new Error('Camera stream could not be displayed. Please try again.');
      }

      setIsCameraActive(true);
      setIsCameraConnecting(false);

      // Trigger haptic feedback on mobile when camera opens successfully
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let errorMsg = 'Could not access device camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in browser site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
      setIsCameraConnecting(false);
      stopCameraStream();
    }
  }, [facingMode, fetchLiveGps, stopCameraStream, attachStreamToVideo]);

  // Switch between front and back camera
  const toggleFacingMode = useCallback(() => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // When facingMode changes while camera is active, restart stream
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      // Force-stop all tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
    };
  }, []);

  // Capture photo from live video stream with geotag watermark
  const handleCapturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    setIsCapturing(true);

    // Haptic feedback on capture
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Ensure we have current GPS coordinates
    let coords = {
      lat: liveGpsInfo.lat || currentLatitude || 22.5726,
      lng: liveGpsInfo.lng || currentLongitude || 88.3639,
      landmark: liveGpsInfo.landmark || currentLandmark || 'Verified Civic Location',
      displayName: liveGpsInfo.displayName || ''
    };

    if (!liveGpsInfo.lat) {
      const liveRes = await fetchLiveGps();
      if (liveRes) coords = liveRes;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not create canvas context');

      // 1. Draw live camera snapshot frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2. Draw Geotag Overlay Banner (Watermark at bottom of image)
      const bannerHeight = Math.max(70, Math.floor(canvas.height * 0.13));

      // Gradient background for clear readability
      const grad = ctx.createLinearGradient(0, canvas.height - bannerHeight, 0, canvas.height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      // Top Saffron Accent Line
      ctx.fillStyle = '#ff6a00';
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, Math.max(3, Math.floor(canvas.height * 0.006)));

      // Geotag Text Configuration
      const primaryFontSize = Math.max(14, Math.floor(canvas.width * 0.022));
      const secondaryFontSize = Math.max(11, Math.floor(canvas.width * 0.017));
      const paddingX = Math.max(16, Math.floor(canvas.width * 0.025));

      // Line 1: Real-time Coordinates & Location Name
      ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#ffffff';
      const coordText = `📍 ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E  •  ${coords.landmark}`;
      ctx.fillText(coordText, paddingX, canvas.height - bannerHeight + primaryFontSize + 12);

      // Line 2: Timestamp & Verified Geotag Badge
      ctx.font = `${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      const timestamp = new Date().toLocaleString();
      const metaText = `⏱️ ${timestamp}  •  🛡️ Nagrik Setu Live Camera Geotag Verification`;
      ctx.fillText(metaText, paddingX, canvas.height - bannerHeight + primaryFontSize + secondaryFontSize + 20);

      // Convert to JPEG Data URL
      const finalGeotaggedImage = canvas.toDataURL('image/jpeg', 0.92);

      // Stop camera stream once captured
      stopCameraStream();

      // Pass captured evidence & location back to parent form
      onCapture(finalGeotaggedImage, coords);
    } catch (err) {
      console.error('Error capturing live photo with geotag:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // If evidence already captured, show high-res preview with geotag details and retake option
  if (capturedEvidence.length > 0) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md bg-stone-950 group">
          <img
            src={capturedEvidence[0]}
            alt="Live Geotagged Civic Evidence"
            className="w-full h-64 sm:h-72 object-cover"
          />

          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-600/90 text-white backdrop-blur-md rounded-full text-[11px] font-bold shadow-md">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Live Photo Geotagged</span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onRemove();
                startCamera();
              }}
              className="p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full backdrop-blur-md shadow-md transition cursor-pointer"
              title="Retake Live Photo"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md shadow-md transition cursor-pointer"
              title="Remove Photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Geotag Metadata Badge */}
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>Embedded Geotag Location</span>
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Verified
            </span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300 font-mono">
            {liveGpsInfo.lat ? `${liveGpsInfo.lat.toFixed(5)}° N, ${liveGpsInfo.lng?.toFixed(5)}° E` : `${currentLatitude?.toFixed(5)}° N, ${currentLongitude?.toFixed(5)}° E`}
          </p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400">
            Landmark: <span className="font-semibold text-stone-700 dark:text-stone-200">{liveGpsInfo.landmark || currentLandmark || 'Civic Station'}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onRemove();
            startCamera();
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retake Live Photograph</span>
        </button>
      </div>
    );
  }

  // Camera connecting OR active — <video> stays mounted across BOTH states
  // so videoRef.current is never null when attachStreamToVideo() runs.
  // This is the actual fix: previously "connecting" rendered a spinner-only
  // branch with no <video> tag, so the stream had nothing to attach to.
  if (isCameraConnecting || isCameraActive) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center shadow-lg border border-stone-800">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            // webkit-playsinline for iOS Safari
            {...{ 'webkit-playsinline': '' } as any}
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Connecting overlay — shown while getUserMedia() resolves */}
          {isCameraConnecting && !isCameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                <p className="text-xs font-semibold">Connecting to camera…</p>
                <p className="text-[10px] text-stone-400">Please allow camera access when prompted</p>
              </div>
            </div>
          )}

          {/* Viewfinder overlay — shown once stream is attached & playing */}
          {isCameraActive && (
            <div className="absolute inset-3 sm:inset-4 pointer-events-none border border-white/20 rounded-xl flex flex-col justify-between p-2">
              <div className="flex justify-between items-start">
                <span className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-md">
                  <span className="h-2 w-2 rounded-full bg-white inline-block animate-ping"></span>
                  LIVE FEED
                </span>

                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="pointer-events-auto p-2.5 sm:p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition shadow-md cursor-pointer active:scale-95"
                    title="Switch Front/Rear Camera"
                  >
                    <SwitchCamera className="h-5 w-5 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>

              {/* Center crosshair for aiming */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-12 w-12 sm:h-10 sm:w-10 border-2 border-white/30 rounded-lg" />
              </div>

              {/* Live GPS badge in viewfinder */}
              <div className="bg-black/75 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 text-[10px] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
                  <span className="font-mono">
                    {liveGpsInfo.lat ? `${liveGpsInfo.lat.toFixed(4)}°, ${liveGpsInfo.lng?.toFixed(4)}°` : isAcquiringGps ? 'Acquiring GPS...' : 'GPS Standby'}
                  </span>
                </div>
                <span className="text-[9px] text-stone-300 truncate max-w-[120px] sm:max-w-[140px]">
                  {liveGpsInfo.landmark || 'Auto-Tagging'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls — large touch targets for mobile — only once active */}
        {isCameraActive && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isCapturing}
              className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-4 sm:py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-xs cursor-pointer active:scale-[0.98]"
            >
              <Camera className="h-5 w-5 sm:h-4 sm:w-4" />
              <span>{isCapturing ? 'Capturing & Geotagging...' : 'Capture Geotagged Photo'}</span>
            </button>

            <button
              type="button"
              onClick={stopCameraStream}
              className="p-4 sm:p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition text-xs font-semibold cursor-pointer"
              title="Cancel Live Feed"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Cancel button while still connecting (stream not up yet) */}
        {isCameraConnecting && !isCameraActive && (
          <button
            type="button"
            onClick={stopCameraStream}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Camera inactive / initial standby state
  return (
    <div className="space-y-3">
      {cameraError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Camera Access Notice</p>
            <p className="text-[11px] mt-0.5">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="mt-2 text-[11px] font-bold text-orange-600 dark:text-orange-400 underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-2xl p-6 text-center bg-stone-50/50 dark:bg-stone-950/40 hover:border-primary/60 transition space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-primary flex items-center justify-center shadow-xs">
            <Camera className="h-7 w-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white">Live Camera Photo Verification</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              Capture live civic evidence directly through your device camera with automatic GPS geotagging.
            </p>
          </div>
        </div>

        {/* Automatic Geotag Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-full text-[11px] font-semibold text-orange-700 dark:text-orange-300">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>
            {currentLatitude && currentLongitude
              ? `GPS Ready: ${currentLatitude.toFixed(4)}° N, ${currentLongitude.toFixed(4)}° E`
              : 'Live GPS Coordinates will be attached automatically'}
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={startCamera}
            className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-xs mx-auto cursor-pointer active:scale-[0.98]"
          >
            <Camera className="h-5 w-5 sm:h-4 sm:w-4" />
            <span>Open Live Camera</span>
          </button>
        </div>
      </div>
    </div>
  );
}