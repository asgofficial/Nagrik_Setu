'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { translations } from '../../utils/translations';
import { GrievanceCategory } from '../../types';
import VoiceInput from '../../components/VoiceInput';
import LiveCameraGeotag from '../../components/LiveCameraGeotag';
import { geocodingService } from '../../services/geocodingService';
import { Sparkles, AlertTriangle, Shield, CheckCircle2, MapPin, Camera, RefreshCw, Volume2, ArrowRight } from 'lucide-react';

export default function ReportIssue() {
  const { reportIssue, language, userGpsLocation, refreshGpsLocation } = useApp();
  const t = translations[language] || translations.en;

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GrievanceCategory>('Electricity');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);

  // Auto-fill GPS location from user session / login detection
  useEffect(() => {
    if (userGpsLocation && userGpsLocation.latitude && userGpsLocation.longitude) {
      setLatitude(userGpsLocation.latitude);
      setLongitude(userGpsLocation.longitude);
      setLocationName(userGpsLocation.displayName);
      setLandmark(userGpsLocation.locality || `Lat: ${userGpsLocation.latitude.toFixed(4)}, Lng: ${userGpsLocation.longitude.toFixed(4)}`);
    }
  }, [userGpsLocation]);

  // Submission states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [joinedCluster, setJoinedCluster] = useState<string | null>(null);

  // Dynamic AI Preview states
  const [aiPreview, setAiPreview] = useState<{
    category: GrievanceCategory;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    authority: string;
    nearbySimilar: number;
    potentialCluster: boolean;
  } | null>(null);

  // Run AI analysis preview based on description changes (mock/deterministic engine + Gemini integration)
  useEffect(() => {
    if (description.trim().length < 15) {
      setAiPreview(null);
      return;
    }

    const runLocalClassifier = () => {
      const lower = description.toLowerCase();
      let detectedCat: GrievanceCategory = 'Electricity';
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
      let authority = 'Municipal Electrical Department';

      if (lower.includes('water') || lower.includes('pipe') || lower.includes('leak') || lower.includes('drain')) {
        detectedCat = 'Water';
        authority = 'Water Supply and Sewerage Board';
      } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('dump') || lower.includes('dustbin')) {
        detectedCat = 'Waste';
        authority = 'Solid Waste Management Department';
      } else if (lower.includes('road') || lower.includes('pothole') || lower.includes('pavement')) {
        detectedCat = 'Road';
        authority = 'Roads & Public Works Department (PWD)';
      } else if (lower.includes(' streetlight') || lower.includes('dark') || lower.includes('bulb') || lower.includes('lamp')) {
        detectedCat = 'Electricity';
        authority = 'Municipal Electrical Department';
      }

      if (lower.includes('danger') || lower.includes('rupture') || lower.includes('accident') || lower.includes('blackout') || lower.includes('unsafe')) {
        priority = 'HIGH';
      }
      if (lower.includes('bribe') || lower.includes('corruption') || lower.includes('harass')) {
        priority = 'CRITICAL';
        detectedCat = 'Corruption';
        authority = 'Municipal Administrative Oversight & Vigilance Cell';
      }

      setAiPreview({
        category: detectedCat,
        priority,
        authority,
        nearbySimilar: 0,
        potentialCluster: false
      });
      setCategory(detectedCat);
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error('API route failed');
        const data = await response.json();
        
        setAiPreview({
          category: data.category as GrievanceCategory,
          priority: data.priority as any,
          authority: data.authority,
          nearbySimilar: 0,
          potentialCluster: false
        });
        setCategory(data.category as GrievanceCategory);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          runLocalClassifier();
        }
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [description]);

  const handleVoiceInput = (text: string) => {
    setDescription(text);
  };

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!position || !position.coords) {
          setIsLocating(false);
          return;
        }
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        const geocoded = await geocodingService.reverseGeocode(lat, lng);
        if (geocoded) {
          setLocationName(geocoded.displayName);
          setLandmark(geocoded.locality);
        } else {
          setLandmark(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        alert('Could not retrieve your location. Please select your location manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (latitude === null || longitude === null) {
      alert('Please detect or select your location before submitting.');
      handleDetectLocation();
      return;
    }

    // Trigger context action
    const newG = reportIssue({
      title: description.split('.')[0].slice(0, 50) + (description.length > 50 ? '...' : ''),
      description,
      category,
      latitude,
      longitude,
      landmark,
      isAnonymous,
      evidence
    });

    setCreatedId(newG.id);
    setJoinedCluster(newG.clusterId || null);
    setIsSubmitted(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      let speech = `Report submitted successfully as ticket ${newG.id}.`;
      const u = new SpeechSynthesisUtterance(speech);
      window.speechSynthesis.speak(u);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-stone-850 dark:text-stone-100 flex-1 flex flex-col justify-center items-center">
        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>

        <h2 className="text-2xl font-black">Report Submitted Successfully</h2>
        <p className="text-sm font-semibold text-stone-500 mt-2">
          Complaint ID: <span className="text-stone-900 dark:text-white font-mono font-bold bg-stone-150 dark:bg-stone-800 px-2 py-0.5 rounded">{createdId}</span>
        </p>

        {joinedCluster ? (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-600 text-white text-xs text-center max-w-md border-2 border-orange-400 shadow-2xl space-y-4">
            <h4 className="font-extrabold text-[10px] text-orange-200 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Civic Cluster Intelligence
            </h4>
            
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-purple-300">14</span>
                <span className="text-[9px] text-purple-400 uppercase font-mono">Existing Reports</span>
              </div>
              <span className="text-sm font-black text-amber-400 select-none">+</span>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-emerald-400">1</span>
                <span className="text-[9px] text-emerald-400 uppercase font-mono">Your Report</span>
              </div>
              <span className="text-sm font-black text-amber-400 select-none">=</span>
              <div className="flex flex-col items-center bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/25">
                <span className="text-2xl font-black text-amber-300">15</span>
                <span className="text-[9px] text-amber-300 uppercase font-mono">Citizens</span>
              </div>
            </div>
            
            <h3 className="font-black text-base text-amber-300 tracking-wider uppercase">
              ONE COMMUNITY ISSUE
            </h3>
            
            <p className="leading-relaxed text-purple-100 mt-1">
              Instead of creating another isolated ticket, Nagriksetu connected your report to an existing community problem.
            </p>
          </div>
        ) : (
          <p className="text-xs text-stone-500 mt-4 max-w-sm">
            Your grievance has been classified and dispatched to the corresponding department. Track SLA status via your Activity feed.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
          <Link
            href={`/grievances/${createdId}`}
            className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition text-xs shadow-md text-center flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Track Complaint Timeline</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/map"
            className="flex-1 bg-white hover:bg-stone-50 border text-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-300 font-bold py-3 px-6 rounded-xl transition text-xs text-center border-stone-200 dark:border-stone-800"
          >
            View on Map
          </Link>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full">
      
      {/* Page Title */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.reportPageTitle}</h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">{t.reportPageSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column Form fields */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* Description Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-stone-400">Describe the Issue</label>
              <VoiceInput
                onTranscript={handleVoiceInput}
                demoText="The streetlights on College Road have not been working for several days and the road becomes unsafe at night."
                placeholder="Click to dictate complaint..."
              />
            </div>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden min-h-[120px] text-stone-950 dark:text-stone-50"
              placeholder="e.g. Water leak, broken lamp post, potholes, sanitary issues..."
              required
            />
          </div>

          {/* Category Override selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-stone-400">Category Override (If AI mismatches)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="Electricity">Lighting / Electrical Infrastructure</option>
              <option value="Water">Water Leaking & Supply</option>
              <option value="Waste">Garbage Dumping & Solid Waste</option>
              <option value="Sanitation">Sanitation & Drainage</option>
              <option value="Road">Road Potholes & Infrastructure</option>
              <option value="Public Safety">Public Safety & Nuisance</option>
              <option value="Harassment">Safety / Harassment</option>
              <option value="Corruption">Malpractice / Bribe Demand</option>
              <option value="Other">Other Category</option>
            </select>
          </div>

          {/* Location picker coordinates */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-stone-400">Location Details</label>
              {latitude && longitude && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  <MapPin className="h-3 w-3" />
                  <span>GPS Auto-Detected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude ?? ''}
                  onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude ?? ''}
                  onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 font-bold block uppercase">Landmark (Optional)</span>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near College Square gate"
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Anonymous check */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 flex items-start gap-3 transition">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4.5 w-4.5 text-primary rounded mt-0.5"
            />
            <div>
              <label htmlFor="isAnonymous" className="text-sm font-bold block select-none">Anonymous Submission</label>
              <span className="text-[10px] text-stone-400 leading-relaxed block mt-0.5">
                If checked, your name will not be shown in the public community activity feed, protecting your identity.
              </span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!description.trim()}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md transition disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 shrink-0 text-sm cursor-pointer"
          >
            Analyse & Submit Report
          </button>

        </div>

        {/* Right Column: AI classification & metadata */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Live Preview */}
          {aiPreview ? (
            <div className="bg-white dark:bg-stone-900 border-2 border-primary rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                AI Dispatch Analysis
              </h3>

              <div className="space-y-4 text-xs">
                
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 font-medium">Issue Classified:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{aiPreview.category}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 font-medium">Priority Score:</span>
                  <span className={`font-bold uppercase ${
                    aiPreview.priority === 'HIGH' || aiPreview.priority === 'CRITICAL' ? 'text-amber-600' : 'text-stone-600'
                  }`}>{aiPreview.priority}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 font-medium">Routing Department:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{aiPreview.authority}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-400 font-medium">Nearby Duplicates:</span>
                  <span className={`font-bold ${aiPreview.nearbySimilar > 0 ? 'text-purple-600' : 'text-stone-600'}`}>
                    {aiPreview.nearbySimilar} complaints
                  </span>
                </div>

                {aiPreview.potentialCluster && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl text-[10px] text-purple-700 dark:text-purple-300 leading-relaxed">
                    🚨 **Duplicate prevention check:** Clustered report warning! There are {aiPreview.nearbySimilar} complaints in Ward 12 near your coordinates. Your report will merge with the active cluster to build community impact.
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-stone-100 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-800 p-8 rounded-2xl text-center text-xs text-stone-400">
              Type at least 15 characters of description to compile AI classification preview.
            </div>
          )}

          {/* Live Camera Evidence Capture with Auto Geotagging */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Live Photographic Evidence</span>
                </h3>
                <span className="text-[10px] bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200 dark:border-orange-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Live Cam Only
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed mt-1">
                Take a verified live photo through your device camera. Real-time GPS coordinates and timestamps are embedded automatically.
              </p>
            </div>
            
            <LiveCameraGeotag
              capturedEvidence={evidence}
              onCapture={(imageDataUrl, locData) => {
                setEvidence([imageDataUrl]);
                if (locData.lat && locData.lng) {
                  setLatitude(locData.lat);
                  setLongitude(locData.lng);
                  if (locData.landmark) setLandmark(locData.landmark);
                  if (locData.displayName) setLocationName(locData.displayName);
                }
              }}
              onRemove={() => setEvidence([])}
              currentLatitude={latitude}
              currentLongitude={longitude}
              currentLandmark={landmark}
              onLocationUpdate={(lat, lng, lm, disp) => {
                setLatitude(lat);
                setLongitude(lng);
                if (lm) setLandmark(lm);
                if (disp) setLocationName(disp);
              }}
            />
          </div>

          {/* Privacy Minimization notice */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 bg-stone-50 dark:bg-stone-900/50 text-[11px] text-stone-400 leading-relaxed flex items-start gap-2">
            <Shield className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
            <span>**Data Minimization Policy:** We only publish public-safe descriptions. No PII (names, phone numbers, precise billing cards) is stored or displayed in the activity logs.</span>
          </div>

        </div>

      </form>

    </div>
  );
}
