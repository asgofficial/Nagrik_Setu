'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Grievance, CivicCluster, Ward } from '../types';
import { escapeHtml } from '@/lib/sanitize';

interface CivicMapProps {
  grievances: Grievance[];
  clusters: CivicCluster[];
  wards: Ward[];
  onSelectGrievance?: (g: Grievance) => void;
  onSelectCluster?: (c: CivicCluster) => void;
  onSelectWard?: (w: Ward) => void;
  selectedGrievanceId?: string;
  selectedClusterId?: string;
  selectedWardId?: string;
  zoom?: number;
  center?: [number, number];
  userLocation?: [number, number] | null;
  userAccuracy?: number;
  interactive?: boolean;
  mapMode?: string;
}

export default function CivicMap({
  grievances,
  clusters,
  wards,
  onSelectGrievance,
  onSelectCluster,
  onSelectWard,
  selectedGrievanceId,
  selectedClusterId,
  selectedWardId,
  zoom = 14,
  center = [20.5937, 78.9629],
  userLocation,
  userAccuracy,
  interactive = true,
  mapMode = 'Issues'
}: CivicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Load Leaflet dynamically on mount (browser only)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Guard against React StrictMode double-invocation and hot reloads:
    // If the DOM node already has a _leaflet_id, Leaflet already owns it — skip.
    if ((mapContainerRef.current as any)._leaflet_id) return;
    // If we already stored an instance, skip.
    if (mapInstanceRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Re-check after async import flight in case component unmounted
      if ((mapContainerRef.current as any)._leaflet_id) return;
      if (mapInstanceRef.current) return;

      // Fix Leaflet default icon paths (webpack asset hashing breaks them)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialise map — wrap in try/catch so a race-condition double-init
      // from StrictMode does not crash the entire React tree.
      let map: any;
      try {
        map = L.map(mapContainerRef.current!, {
          zoomControl: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          boxZoom: interactive,
          dragging: interactive,
          touchZoom: interactive,
          // Disable Leaflet's CSS animation to avoid the
          // "Cannot read properties of undefined (reading 'location')" error
          // that fires when the map is destroyed mid-animation.
          fadeAnimation: false,
          markerZoomAnimation: false,
        }).setView(center, zoom);
      } catch (initErr) {
        // Already initialised (race condition) — do nothing.
        console.warn('[CivicMap] Map already initialised, skipping:', initErr);
        return;
      }

      // Use OpenStreetMap tiles — avoids CartoDB crypto fingerprinting warning
      // ("Crypto site not identified within timeout period") entirely.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // crossOrigin required for some browsers; keeps console clean.
        crossOrigin: 'anonymous',
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      if (isMounted) {
        setIsMapLoaded(true);
      }
    }).catch(err => console.error('[CivicMap] Error loading Leaflet:', err));

    return () => {
      isMounted = false;
      // Safely remove the map — guard against "already removed" state.
      const mapToRemove = mapInstanceRef.current;
      mapInstanceRef.current = null;
      layerGroupRef.current = null;

      if (mapToRemove) {
        try {
          // Defensive: stop known animation helpers if present (internal Leaflet fields)
          try {
            if (mapToRemove._panAnim && typeof mapToRemove._panAnim.stop === 'function') {
              mapToRemove._panAnim.stop();
            }
          } catch {}

          // Stop map animations if API exists
          if (typeof mapToRemove.stop === 'function') {
            try { mapToRemove.stop(); } catch {}
          }

          // Finally remove the map if remove exists
          if (typeof mapToRemove.remove === 'function') {
            try { mapToRemove.remove(); } catch {}
          }

          // Defensive: null known internal animation refs to avoid later access
          try {
            if (mapToRemove._panAnim) mapToRemove._panAnim = null;
            if (mapToRemove._flyToAnim) mapToRemove._flyToAnim = null;
            if (mapToRemove._fadeAnim) mapToRemove._fadeAnim = null;
          } catch {}

          // Remove leaflet id flag from container to avoid double-init on StrictMode
          try {
            if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
              try { delete (mapContainerRef.current as any)._leaflet_id; } catch {}
            }
          } catch {}
        } catch (removeErr) {
          // Swallow — map was already in a destroyed state.
          console.warn('[CivicMap] Map remove error (benign):', removeErr);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers and overlays when data or selections change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;

      // Safety check: map might have been destroyed between the async gap
      if (!map || !layerGroup) return;

      // Clear previous layers
      try {
        layerGroup.clearLayers();
      } catch {
        return;
      }

      // 0. Draw User Location Marker if available
      if (userLocation && userLocation[0] && userLocation[1]) {
        const userLat = userLocation[0];
        const userLng = userLocation[1];

        // Draw accuracy circle if provided (Requirement #5 & #14)
        if (userAccuracy && userAccuracy > 0) {
          const accCircle = L.circle([userLat, userLng], {
            radius: userAccuracy,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '4, 4'
          });
          accCircle.addTo(layerGroup);
        }

        const userMarkerIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div class="relative flex items-center justify-center">
            <div class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-xl items-center justify-center">
              <div class="h-2 w-2 rounded-full bg-white"></div>
            </div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const userMarker = L.marker([userLat, userLng], { icon: userMarkerIcon, zIndexOffset: 1500 });
        userMarker.bindTooltip('<b style="font-family: system-ui, sans-serif; text-transform: uppercase; tracking: 0.05em; font-size: 10px;">YOU ARE HERE</b>', { permanent: false, direction: 'top' });
        userMarker.addTo(layerGroup);
      }

      // 1. Draw Wards if coordinates exist in ward object
      wards.forEach(ward => {
        const wardLat = (ward as any).latitude;
        const wardLng = (ward as any).longitude;
        if (!wardLat || !wardLng) return;

        let color = '#10b981'; // Green (Healthy)
        if (ward.healthScore < 50) color = '#ef4444'; // Red (Critical)
        else if (ward.healthScore < 70) color = '#f59e0b'; // Amber

        const wardCircle = L.circle([wardLat, wardLng], {
          color,
          fillColor: color,
          fillOpacity: selectedWardId === ward.id ? 0.18 : 0.06,
          weight: selectedWardId === ward.id ? 3 : 1.5,
          dashArray: selectedWardId === ward.id ? '5, 5' : undefined,
          radius: 400
        });

        if (interactive) {
          wardCircle.on('click', () => { if (onSelectWard) onSelectWard(ward); });
          wardCircle.bindTooltip(
            `${escapeHtml(ward.name)}<br/>Health Score: <b>${escapeHtml(String(ward.healthScore))}/100</b>`,
            { permanent: false, direction: 'center' }
          );
        }
        wardCircle.addTo(layerGroup);
      });

      // 2. Draw Grievance Clusters
      clusters.forEach(cluster => {
        let color = '#3b82f6';
        if (cluster.category === 'Waste' || cluster.category === 'Sanitation') color = '#10b981';
        if (cluster.category === 'Road') color = '#78716c';
        if (cluster.severity === 'HIGH' || cluster.severity === 'CRITICAL') {
          color = '#f59e0b';
          if (cluster.status === 'RESOLUTION_DISPUTED') color = '#ef4444';
        }

        const clusterZone = L.circle([cluster.latitude, cluster.longitude], {
          color,
          fillColor: color,
          fillOpacity: selectedClusterId === cluster.id ? 0.3 : 0.15,
          weight: selectedClusterId === cluster.id ? 4 : 2,
          radius: cluster.radiusMeters
        });

        if (interactive) {
          clusterZone.on('click', () => { if (onSelectCluster) onSelectCluster(cluster); });
          clusterZone.bindTooltip(
            `<b>${escapeHtml(cluster.title)}</b><br/>${escapeHtml(String(cluster.reportsCount))} Reports Clustered`,
            { permanent: false, direction: 'top' }
          );
        }
        clusterZone.addTo(layerGroup);
      });

      // 3. Draw Individual Grievance Markers
      grievances.forEach(g => {
        let pinColor = 'bg-stone-500';
        if (mapMode === 'Severity') {
          if (g.severity === 'CRITICAL') pinColor = 'bg-red-600';
          else if (g.severity === 'HIGH') pinColor = 'bg-orange-500';
          else if (g.severity === 'MEDIUM') pinColor = 'bg-amber-500';
          else pinColor = 'bg-blue-500';
        } else if (mapMode === 'SLA') {
          const isBreached = g.isEscalated || (g.slaDeadline && new Date(g.slaDeadline).getTime() < Date.now());
          const isAtRisk = !isBreached && g.slaDeadline && new Date(g.slaDeadline).getTime() - Date.now() < 6 * 3600 * 1000 && new Date(g.slaDeadline).getTime() > Date.now();
          if (isBreached) pinColor = 'bg-red-600';
          else if (isAtRisk) pinColor = 'bg-amber-500';
          else pinColor = 'bg-emerald-500';
        } else {
          if (g.status === 'ASSIGNED') pinColor = 'bg-blue-500';
          if (g.status === 'WORK_STARTED') pinColor = 'bg-amber-500';
          if (g.status === 'AUTHORITY_RESOLVED') pinColor = 'bg-emerald-400';
          if (g.status === 'CITIZEN_VERIFIED' || g.status === 'CLOSED') pinColor = 'bg-emerald-600';
          if (g.status === 'RESOLUTION_DISPUTED') pinColor = 'bg-red-600';
        }

        let categoryEmoji = '📍';
        if (g.category === 'Electricity') categoryEmoji = '⚡';
        else if (g.category === 'Water') categoryEmoji = '💧';
        else if (g.category === 'Waste') categoryEmoji = '🗑️';
        else if (g.category === 'Sanitation') categoryEmoji = '🧹';
        else if (g.category === 'Road') categoryEmoji = '🛣️';
        else if (g.category === 'Public Safety' || g.category === 'Harassment') categoryEmoji = '🚨';
        else if (g.category === 'Corruption') categoryEmoji = '💼';

        const isSelected = selectedGrievanceId === g.id;
        const customMarkerIcon = L.divIcon({
          className: 'nagriksetu-civic-marker',
          html: `<div class="nagriksetu-pin flex items-center justify-center rounded-full ${pinColor} text-white font-extrabold transition-all border-2 border-white dark:border-stone-900 ${
            isSelected ? 'scale-125 ring-4 ring-orange-400 ring-offset-2 z-[2000]' : 'hover:scale-110'
          }" style="width:34px;height:34px;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,0.45);">${categoryEmoji}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker([g.latitude, g.longitude], {
          icon: customMarkerIcon,
          zIndexOffset: isSelected ? 2000 : 1000
        });

        if (interactive) {
          marker.on('click', () => { if (onSelectGrievance) onSelectGrievance(g); });
          marker.bindTooltip(
            `<b>${escapeHtml(g.id)}</b>: ${escapeHtml(g.title)}<br/>Status: <b>${escapeHtml(g.status.replace('_', ' '))}</b>`
          );
        }

        marker.addTo(layerGroup);
      });

      // Pan map if selected grievance or center changes
      try {
        if (selectedGrievanceId) {
          const selG = grievances.find(g => g.id === selectedGrievanceId);
          if (selG) map.setView([selG.latitude, selG.longitude], 16, { animate: false });
        } else if (selectedClusterId) {
          const selC = clusters.find(c => c.id === selectedClusterId);
          if (selC) map.setView([selC.latitude, selC.longitude], 15, { animate: false });
        } else if (center && center[0] && center[1]) {
          map.setView(center, zoom, { animate: false });
        }
      } catch {
        // Map was destroyed mid-render — swallow.
      }
    });

  }, [isMapLoaded, grievances, clusters, wards, selectedGrievanceId, selectedClusterId, selectedWardId, center, zoom, userLocation, userAccuracy, mapMode]);

  // Invalidate Leaflet map size on container resize / side panel toggle / window resize (Requirement #4 & #5)
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !mapContainerRef.current) return;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {}
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(mapContainerRef.current);
    if (mapContainerRef.current.parentElement) {
      resizeObserver.observe(mapContainerRef.current.parentElement);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isMapLoaded]);

  return (
    <div className="relative w-full h-full min-h-0 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-inner">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-0"
        aria-label="Civic Map"
        role="application"
      />
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-stone-100 dark:bg-stone-900 flex items-center justify-center z-[200]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Initializing GeoMap Layer...</p>
          </div>
        </div>
      )}
    </div>
  );
}
