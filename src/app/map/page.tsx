'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApp } from '../../context/AppContext';
import { Grievance, CivicCluster, Ward } from '../../types';
import { translations } from '../../utils/translations';
import { geocodingService, GeocodedLocation } from '../../services/geocodingService';
import {
  Shield,
  Sparkles,
  Filter,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Activity,
  Users,
  Clock,
  Navigation,
  Search,
  MapPin,
  RefreshCw,
  Layers,
  Sliders,
  Compass,
  FileText,
  X,
  AlertOctagon,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Zap,
  Target
} from 'lucide-react';

// Import CivicMap dynamically to prevent SSR compile crash
const CivicMap = dynamic(() => import('../../components/CivicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center min-h-[300px] border rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-stone-300 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-semibold">Loading Map Viewport...</p>
      </div>
    </div>
  )
});

// Helper for formatting age cleanly
function formatAge(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'Recently';
  }
}

// Calculate real distance if user location is available
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  if (d < 1) {
    return `${Math.round(d * 1000)} m away`;
  }
  return `${d.toFixed(1)} km away`;
}

// Calculate real priority score deterministically from backend data fields
function computePriorityScore(g: Grievance): number {
  let score = 0;
  if (g.severity === 'CRITICAL') score += 50;
  else if (g.severity === 'HIGH') score += 35;
  else if (g.severity === 'MEDIUM') score += 20;
  else score += 10;

  score += Math.min(30, (g.citizenConfirmations || 0) * 5);

  if (g.isEscalated) score += 20;
  if (g.status === 'RESOLUTION_DISPUTED') score += 25;

  if (g.slaDeadline && new Date(g.slaDeadline).getTime() < Date.now()) {
    score += 20;
  }

  return Math.min(100, score);
}

export default function MapPage() {
  const {
    grievances: allGrievances,
    clusters: allClusters,
    wards,
    activeUser,
    confirmAffected,
    language,
    userGpsLocation
  } = useApp();

  const t = translations[language] || translations.en;
  const isOfficer = activeUser.role === 'authority';

  // Geolocation & Location Choice state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | undefined>(undefined);
  const [localityName, setLocalityName] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(2);

  // Map View Modes
  const [mapMode, setMapMode] = useState<'Issues' | 'Clusters' | 'Severity' | 'SLA' | 'Civic Health' | 'Emerging Signals'>('Issues');

  // Officer Quick Filter
  const [officerFilter, setOfficerFilter] = useState<string>('All');

  // Manual search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Nearby PostGIS fetched data for citizens
  const [nearbyGrievances, setNearbyGrievances] = useState<Grievance[]>([]);
  const [nearbyClusters, setNearbyClusters] = useState<CivicCluster[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Selected Map element detail panels
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<CivicCluster | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Clear selections
  const clearSelection = () => {
    setSelectedGrievance(null);
    setSelectedCluster(null);
    setSelectedWard(null);
  };

  // Handle location search query
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await geocodingService.searchLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchedLocation = (loc: GeocodedLocation) => {
    setUserLocation([loc.latitude, loc.longitude]);
    setUserAccuracy(undefined);
    setLocalityName(loc.locality || loc.displayName.split(',')[0]);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Fetch nearby grievances via server-side PostGIS query
  const fetchNearbyData = useCallback(async () => {
    if (!userLocation) return;
    setIsLoadingNearby(true);
    try {
      const [lat, lng] = userLocation;
      const res = await fetch(
        `/api/grievances/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
      );
      if (res.ok) {
        const data = await res.json();
        setNearbyGrievances(data.grievances || []);
        setNearbyClusters(data.clusters || []);
      } else {
        setNearbyGrievances([]);
        setNearbyClusters([]);
      }
    } catch (err) {
      console.error('[MapPage] PostGIS nearby query failed:', err);
      setNearbyGrievances([]);
      setNearbyClusters([]);
    } finally {
      setIsLoadingNearby(false);
    }
  }, [userLocation, radiusKm]);

  // Sync user location from GPS context
  useEffect(() => {
    if (userGpsLocation && userGpsLocation.latitude && userGpsLocation.longitude) {
      setUserLocation([userGpsLocation.latitude, userGpsLocation.longitude]);
      setLocalityName(userGpsLocation.locality || userGpsLocation.displayName.split(',')[0]);
    }
  }, [userGpsLocation]);

  // Fetch PostGIS nearby data for citizens
  useEffect(() => {
    if (userLocation && !isOfficer) {
      fetchNearbyData();
    }
  }, [userLocation, radiusKm, fetchNearbyData, isOfficer]);

  // Base list of grievances depending on role
  const rawGrievances = isOfficer ? allGrievances : nearbyGrievances;
  const rawClusters = isOfficer ? allClusters : nearbyClusters;

  // Mode & Filter logic for grievances
  const displayGrievances = rawGrievances.filter(g => {
    if (mapMode === 'Emerging Signals') {
      const diffMs = Date.now() - new Date(g.createdAt).getTime();
      if (diffMs > 48 * 3600 * 1000) return false;
    }
    if (!isOfficer) return true;
    if (officerFilter === 'Critical') return g.severity === 'CRITICAL';
    if (officerFilter === 'High') return g.severity === 'HIGH';
    if (officerFilter === 'Medium') return g.severity === 'MEDIUM';
    if (officerFilter === 'Low') return g.severity === 'LOW';
    if (officerFilter === 'SLA At Risk') {
      return !g.isEscalated && g.slaDeadline && new Date(g.slaDeadline).getTime() - Date.now() < 6 * 3600 * 1000 && new Date(g.slaDeadline).getTime() > Date.now();
    }
    if (officerFilter === 'SLA Breached') {
      return g.isEscalated || (g.slaDeadline && new Date(g.slaDeadline).getTime() < Date.now());
    }
    if (officerFilter === 'Unassigned') return g.status === 'REPORTED' || g.status === 'AI_CLASSIFIED';
    if (officerFilter === 'Work Started') return g.status === 'WORK_STARTED';
    if (officerFilter === 'Resolved') return g.status === 'AUTHORITY_RESOLVED' || g.status === 'CITIZEN_VERIFIED' || g.status === 'CLOSED';
    if (officerFilter === 'Reopened') return g.status === 'RESOLUTION_DISPUTED';
    return true;
  });

  const displayClusters = rawClusters;

  // Real Officer Metrics & Attention counters
  const officerMetrics = {
    openCount: rawGrievances.filter(g => g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED').length,
    criticalCount: rawGrievances.filter(g => g.severity === 'CRITICAL').length,
    highCount: rawGrievances.filter(g => g.severity === 'HIGH').length,
    slaBreachedCount: rawGrievances.filter(g => g.isEscalated || (g.slaDeadline && new Date(g.slaDeadline).getTime() < Date.now())).length,
    unassignedCount: rawGrievances.filter(g => g.status === 'REPORTED' || g.status === 'AI_CLASSIFIED').length,
  };

  const handleSelectGrievance = (g: Grievance) => {
    clearSelection();
    setSelectedGrievance(g);
  };

  const handleSelectCluster = (c: CivicCluster) => {
    clearSelection();
    setSelectedCluster(c);
  };

  const handleSelectWard = (w: Ward) => {
    clearSelection();
    setSelectedWard(w);
  };

  const mapCenter: [number, number] = userLocation
    ? userLocation
    : displayGrievances.length > 0
    ? [displayGrievances[0].latitude, displayGrievances[0].longitude]
    : [20.5937, 78.9629];

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full text-stone-850 dark:text-stone-100 bg-stone-50 dark:bg-stone-950 overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 py-2.5 px-4 shrink-0 flex flex-wrap gap-3 items-center justify-between z-10 shadow-2xs">
        
        {/* Title & Dynamic Location Chip */}
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
              {isOfficer ? 'Officer Operational Map' : 'Problems Near You'}
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isOfficer ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
              }`}>
                {isOfficer ? 'Officer View' : 'Citizen View'}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Using location: <strong>{localityName || 'Detecting device GPS...'}</strong></span>
            </p>
          </div>
        </div>

        {/* Dynamic Controls: Modes & Quick Filters */}
        <div className="flex flex-wrap gap-2 text-xs items-center">
          
          {/* Contextual Issue Count Badge embedded into Map Controls (Requirement #6) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] font-bold text-stone-700 dark:text-stone-300">
            <Target className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span>
              {isOfficer
                ? `${displayGrievances.length} authorized issue${displayGrievances.length === 1 ? '' : 's'} in view`
                : `${displayGrievances.length} issue${displayGrievances.length === 1 ? '' : 's'} within ${radiusKm} km`}
            </span>
          </div>

          {/* Map Modes Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider px-1.5 hidden sm:inline">Mode:</span>
            {[
              { id: 'Issues', label: 'Issues', available: true },
              { id: 'Clusters', label: 'Clusters', available: displayClusters.length > 0 },
              { id: 'Severity', label: 'Severity', available: true },
              { id: 'SLA', label: 'SLA', available: isOfficer },
              { id: 'Civic Health', label: 'Civic Health', available: wards && wards.length > 0 },
              { id: 'Emerging Signals', label: 'Emerging', available: displayGrievances.length > 0 }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => m.available && setMapMode(m.id as any)}
                disabled={!m.available}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  mapMode === m.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : m.available
                    ? 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer'
                    : 'text-stone-400 dark:text-stone-600 cursor-not-allowed opacity-50'
                }`}
                title={m.available ? `Switch to ${m.label} map mode` : `No data available for ${m.label}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Officer Quick Filters */}
          {isOfficer && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-bold uppercase text-[9px] tracking-wider hidden md:inline">Filter:</span>
              <select
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
                className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-200 focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Issues ({rawGrievances.length})</option>
                <option value="Critical">Critical ({rawGrievances.filter(g => g.severity === 'CRITICAL').length})</option>
                <option value="High">High ({rawGrievances.filter(g => g.severity === 'HIGH').length})</option>
                <option value="Medium">Medium ({rawGrievances.filter(g => g.severity === 'MEDIUM').length})</option>
                <option value="Low">Low ({rawGrievances.filter(g => g.severity === 'LOW').length})</option>
                <option value="SLA At Risk">SLA At Risk</option>
                <option value="SLA Breached">SLA Breached ({officerMetrics.slaBreachedCount})</option>
                <option value="Unassigned">Unassigned ({officerMetrics.unassignedCount})</option>
                <option value="Work Started">Work Started</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
          )}

          {/* Citizen Radius Selector */}
          {!isOfficer && userLocation && (
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px]">
              <Compass className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span className="text-[9px] font-bold text-stone-400 uppercase mr-1">Radius:</span>
              {[1, 2, 3, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-1.5 py-0.5 rounded-md font-bold transition text-[10px] ${
                    radiusKm === r ? 'bg-orange-600 text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Officer Operational Metrics & Attention Bar */}
      {isOfficer && (
        <div className="bg-stone-900 text-white px-4 py-1.5 text-xs flex flex-wrap gap-4 items-center justify-between border-b border-stone-800 shrink-0">
          
          {/* Operational Numbers */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-extrabold uppercase tracking-wider text-[9px] text-stone-400">What Needs Attention?</span>
            <button
              onClick={() => setOfficerFilter('Critical')}
              className="flex items-center gap-1 font-bold hover:underline cursor-pointer text-red-400"
            >
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Critical: <span className="text-white font-extrabold">{officerMetrics.criticalCount}</span>
            </button>
            <button
              onClick={() => setOfficerFilter('High')}
              className="flex items-center gap-1 font-bold hover:underline cursor-pointer text-orange-400"
            >
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              High: <span className="text-white font-extrabold">{officerMetrics.highCount}</span>
            </button>
            <button
              onClick={() => setOfficerFilter('SLA Breached')}
              className="flex items-center gap-1 font-bold hover:underline cursor-pointer text-rose-400"
            >
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              SLA Breached: <span className="text-white font-extrabold">{officerMetrics.slaBreachedCount}</span>
            </button>
            <button
              onClick={() => setOfficerFilter('Unassigned')}
              className="flex items-center gap-1 font-bold hover:underline cursor-pointer text-blue-400"
            >
              <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              Unassigned: <span className="text-white font-extrabold">{officerMetrics.unassignedCount}</span>
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 text-[10px]">
            {officerMetrics.criticalCount === 0 && (
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                No critical issues currently detected.
              </span>
            )}
            <span className="flex items-center gap-1 font-bold text-emerald-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live operational data
            </span>
          </div>
        </div>
      )}

      {/* Main Map Content Area - Fills remaining viewport space without empty gaps below */}
      <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden flex">
        
        {/* Full Viewport Leaflet Map */}
        <div className="flex-1 min-h-0 h-full w-full relative">
          
          <CivicMap
            grievances={displayGrievances}
            clusters={displayClusters}
            wards={wards}
            onSelectGrievance={handleSelectGrievance}
            onSelectCluster={handleSelectCluster}
            onSelectWard={handleSelectWard}
            selectedGrievanceId={selectedGrievance?.id}
            selectedClusterId={selectedCluster?.id}
            selectedWardId={selectedWard?.id}
            zoom={userLocation ? 14 : 5}
            center={mapCenter}
            userLocation={userLocation}
            userAccuracy={userAccuracy}
            mapMode={mapMode}
          />

          {/* Multi-Axis Separated Legend Box (Requirement #9) */}
          <div className="absolute bottom-6 left-6 z-[400] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-xl text-[10px] space-y-3 max-w-xs pointer-events-auto">
            
            {/* SEVERITY LEGEND */}
            <div className="space-y-1">
              <p className="font-black uppercase tracking-wider text-stone-400 text-[9px]">SEVERITY</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-semibold">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>Critical</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>High</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Medium</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Low</span>
              </div>
            </div>

            {/* STATUS LEGEND */}
            <div className="border-t border-stone-150 dark:border-stone-800 pt-2 space-y-1">
              <p className="font-black uppercase tracking-wider text-stone-400 text-[9px]">STATUS</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-semibold">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-stone-400"></span>Reported</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Assigned</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Work Started</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Resolved</span>
              </div>
            </div>

            {/* SLA LEGEND */}
            <div className="border-t border-stone-150 dark:border-stone-800 pt-2 space-y-1">
              <p className="font-black uppercase tracking-wider text-stone-400 text-[9px]">SLA STATE</p>
              <div className="flex gap-4 font-semibold">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>At Risk</span>
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400"><span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>Breached</span>
              </div>
            </div>

          </div>

          {/* Intelligent Low-Data State Banner (Requirement #9) */}
          {displayGrievances.length === 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 rounded-2xl px-5 py-2 shadow-xl flex items-center gap-2.5 text-xs">
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="font-extrabold text-stone-800 dark:text-stone-200">1 active civic issue in your authorized area.</span>
            </div>
          )}

          {/* Mode No-Data State Banner (Requirement #10) */}
          {((mapMode === 'Clusters' && displayClusters.length === 0) ||
            (mapMode === 'Civic Health' && (!wards || wards.length === 0)) ||
            (mapMode === 'Emerging Signals' && displayGrievances.length === 0)) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 rounded-2xl px-5 py-2 shadow-xl flex items-center gap-2.5 text-xs">
              <Info className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="font-extrabold text-stone-800 dark:text-stone-200">No data available for {mapMode} mode in this area.</span>
            </div>
          )}

          {/* Honest Empty State for Citizens */}
          {!isOfficer && userLocation && !isLoadingNearby && displayGrievances.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 rounded-2xl px-6 py-3 shadow-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <p className="font-extrabold text-stone-800 dark:text-stone-100">No civic issues reported within {radiusKm}km</p>
                <p className="text-[10px] text-stone-400">Expand radius or report a problem if you notice one.</p>
              </div>
            </div>
          )}
        </div>

        {/* OFFICER & CITIZEN INTELLIGENCE SIDE PANEL / BOTTOM SHEET */}
        {(selectedGrievance || selectedCluster || selectedWard) && (
          <div className="absolute top-4 right-4 bottom-4 w-full max-w-sm md:w-96 bg-white/98 dark:bg-stone-900/98 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl z-[900] overflow-hidden flex flex-col justify-between p-5 text-xs leading-relaxed">
            
            {/* Header / Close */}
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white">
                  {selectedCluster ? 'CLUSTER INTELLIGENCE' : isOfficer ? 'OFFICER INTELLIGENCE PANEL' : 'CIVIC ISSUE DETAILS'}
                </span>
              </div>
              <button
                onClick={clearSelection}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* CASE 1: SELECTED GRIEVANCE */}
              {selectedGrievance && (
                <div className="space-y-4">
                  
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedGrievance.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                      selectedGrievance.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' :
                      selectedGrievance.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {selectedGrievance.severity} Severity
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {selectedGrievance.category}
                    </span>

                    <span className="text-[10px] text-stone-400 font-semibold ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatAge(selectedGrievance.createdAt)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-stone-400">{selectedGrievance.id}</span>
                      {userLocation && (
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          {calculateDistanceKm(userLocation[0], userLocation[1], selectedGrievance.latitude, selectedGrievance.longitude)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-white leading-snug">
                      {selectedGrievance.title}
                    </h3>
                    <p className="text-stone-600 dark:text-stone-300 text-xs mt-1.5 leading-relaxed">
                      {selectedGrievance.description}
                    </p>
                  </div>

                  {/* Real Operational Details Box */}
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-500 font-medium">Status:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400 capitalize">
                        {selectedGrievance.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-500 font-medium">Department:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {selectedGrievance.authorityId || 'Municipal Public Works'}
                      </span>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-500 font-medium">Public Location:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[170px]">
                        {selectedGrievance.landmark || localityName || 'Local Area'}
                      </span>
                    </div>

                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-500 font-medium">Community Confirmations:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {selectedGrievance.citizenConfirmations} Citizens Affected
                      </span>
                    </div>

                    {isOfficer && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-stone-500 font-medium">Evidence Count:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {selectedGrievance.evidence ? selectedGrievance.evidence.length : 0} Attached File(s)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* WHY THIS PRIORITY? OFFICER INTELLIGENCE SECTION (Requirement #3) */}
                  {isOfficer && (
                    <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          WHY THIS PRIORITY?
                        </h4>
                        <span className="bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 text-[10px] font-black px-2 py-0.5 rounded-md">
                          Score: {computePriorityScore(selectedGrievance)}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-amber-900 dark:text-amber-200 font-medium">
                        <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-stone-400 block text-[9px]">Severity Input</span>
                          <span className="font-bold">{selectedGrievance.severity}</span>
                        </div>
                        <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-stone-400 block text-[9px]">Community Impact</span>
                          <span className="font-bold">{selectedGrievance.citizenConfirmations} Citizens</span>
                        </div>
                        <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-stone-400 block text-[9px]">SLA Status</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {selectedGrievance.isEscalated ? 'Breached / Escalated' : 'Within SLA'}
                          </span>
                        </div>
                        <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-stone-400 block text-[9px]">Dispute State</span>
                          <span className="font-bold">
                            {selectedGrievance.status === 'RESOLUTION_DISPUTED' ? 'Citizen Disputed' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Citizen Evidence Photo if present */}
                  {selectedGrievance.evidence && selectedGrievance.evidence.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Attached Photographic Proof</span>
                      <img
                        src={selectedGrievance.evidence[0]}
                        alt="Evidence photograph"
                        className="h-28 w-full object-cover rounded-xl border border-stone-200 dark:border-stone-800"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    {!isOfficer && (
                      <button
                        onClick={() => confirmAffected(selectedGrievance.id)}
                        className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Users className="h-4 w-4" />
                        <span>I'm Affected Too</span>
                      </button>
                    )}
                    <Link
                      href={`/grievances/${selectedGrievance.id}`}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-center flex items-center justify-center gap-1 shadow-xs cursor-pointer text-xs"
                    >
                      <span>{isOfficer ? 'Manage Issue & Dispatch' : 'Track Activity Timeline'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                </div>
              )}

              {/* CASE 2: SELECTED CLUSTER */}
              {selectedCluster && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-extrabold uppercase">
                      Civic Cluster
                    </span>
                    <span className="text-[10px] text-stone-400 font-bold ml-auto">{selectedCluster.reportsCount} Reports Grouped</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-white leading-snug">
                      {selectedCluster.title}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-xs mt-1.5">
                      {selectedCluster.description}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-400">Affected Radius:</span>
                      <span className="font-bold">{selectedCluster.radiusMeters} Meters</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-stone-150 dark:border-stone-850">
                      <span className="text-stone-400">Active Reports:</span>
                      <span className="font-bold text-purple-600">{selectedCluster.reportsCount} Complaints</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-stone-400">Citizen Confirmations:</span>
                      <span className="font-bold text-emerald-600">{selectedCluster.citizenConfirmations} Citizens</span>
                    </div>
                  </div>

                  {/* WHY IS THIS A CLUSTER? (Requirement #4) */}
                  <div className="p-3.5 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-2xl space-y-2 text-xs">
                    <h4 className="font-black text-purple-900 dark:text-purple-300 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-purple-600" />
                      WHY IS THIS A CLUSTER?
                    </h4>
                    <div className="space-y-1 text-[10px] text-purple-900 dark:text-purple-200 font-medium">
                      <p>• <strong>Geographic Proximity:</strong> Multiple complaints within {selectedCluster.radiusMeters}m radius</p>
                      <p>• <strong>Category Similarity:</strong> Same {selectedCluster.category} infrastructure category</p>
                      <p>• <strong>Time Overlap:</strong> Reports submitted within overlapping operational timeframe</p>
                    </div>
                  </div>

                  <button
                    onClick={() => confirmAffected(selectedCluster.id)}
                    className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Users className="h-4 w-4" />
                    <span>Confirm I am Affected Too</span>
                  </button>
                </div>
              )}

              {/* CASE 3: SELECTED WARD */}
              {selectedWard && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-extrabold uppercase">
                      Ward Health Score
                    </span>
                    <span className="font-extrabold text-sm text-stone-900 dark:text-white">{selectedWard.healthScore}/100</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                    {selectedWard.name} ({selectedWard.borough})
                  </h3>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
