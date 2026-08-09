'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Grievance, CivicCluster, Ward, Notification, CitizenProfile, GrievanceStatus, StatusUpdate, UserGpsLocation } from '../types';
import { getSchemes, calculateEligibility, getDocuments } from '../services/schemeService';
import { createGrievance as createGrievanceService, addConfirmation as addConfirmationService, updateGrievanceStatus as updateGrievanceStatusService, verifyResolution as verifyResolutionService } from '../services/grievanceService';
import { geocodingService } from '../services/geocodingService';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

// Blank citizen profile — user fills in via benefits wizard
const blankProfile: CitizenProfile = {
  age: 0,
  gender: 'prefer-not-to-say',
  state: '',
  district: '',
  urbanRural: 'urban',
  incomeRange: '0-1.5L',
  occupation: '',
  isStudent: false,
  isFarmer: false,
  isSeniorCitizen: false,
  hasDisability: false,
  isWidowOrSingleParent: false,
  housingCondition: 'pucca',
  documentsAvailable: [],
  existingBenefits: []
};

function inferWardMetadata(text: string): { id: string; name: string; borough: string } | null {
  const normalized = text.toLowerCase();
  if (/bow\s?bazar|bowbazar/.test(normalized)) {
    return { id: 'ward-8', name: 'Ward 8 (Bowbazar)', borough: 'Borough II' };
  }
  if (/mg\s?road|machhua|block market|market/.test(normalized)) {
    return { id: 'ward-10', name: 'Ward 10 (MG Road / Machhua)', borough: 'Borough II' };
  }
  if (/college\s?road|college\s?square|college/i.test(normalized)) {
    return { id: 'ward-12', name: 'Ward 12 (College Street / Square)', borough: 'Borough IV' };
  }
  if (/salt\s?lake|ultadanga|sector\s?1/.test(normalized)) {
    return { id: 'ward-15', name: 'Ward 15 (Salt Lake Sector 1 / Ultadanga)', borough: 'Borough V' };
  }
  return null;
}

function estimateResolutionHours(grievance: Grievance): number {
  const reportedAt = new Date(grievance.createdAt).getTime();
  const resolvedEvent = grievance.timeline?.find((entry) => ['AUTHORITY_RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED'].includes(entry.status));
  const referenceTime = resolvedEvent ? new Date(resolvedEvent.updatedAt).getTime() : Date.now();
  return Math.max(0, (referenceTime - reportedAt) / (1000 * 60 * 60));
}

function wardStatusFromScore(score: number): Ward['status'] {
  if (score >= 80) return 'Healthy';
  if (score >= 65) return 'Moderate';
  if (score >= 45) return 'Needs Attention';
  return 'Critical';
}

function normalizeWardId(key: string, index: number): string {
  if (key.startsWith('ward-')) return key;
  return `ward-${100 + index}`;
}

function computeWardSummaries(grievances: Grievance[], clusters: CivicCluster[]): Ward[] {
  if (!grievances || grievances.length === 0) return [];

  const groups = new Map<string, {
    id: string;
    name: string;
    borough: string;
    latSum: number;
    lngSum: number;
    count: number;
    grievances: Grievance[];
    clusterCount: number;
    clusterReports: number;
    clusterPenalty: number;
    sampleLocation: string;
  }>();

  grievances.forEach((grievance) => {
    const searchText = `${grievance.landmark || ''} ${grievance.title || ''} ${grievance.description || ''}`;
    const inferred = inferWardMetadata(searchText);
    const coordinateKey = `${Math.round((grievance.latitude || 0) * 1000)}_${Math.round((grievance.longitude || 0) * 1000)}`;
    const groupKey = inferred?.id ?? `grid-${coordinateKey}`;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.latSum += grievance.latitude || 0;
      existing.lngSum += grievance.longitude || 0;
      existing.count += 1;
      existing.grievances.push(grievance);
      return;
    }

    groups.set(groupKey, {
      id: inferred?.id ?? groupKey,
      name: inferred?.name ?? '',
      borough: inferred?.borough ?? 'Local Area',
      latSum: grievance.latitude || 0,
      lngSum: grievance.longitude || 0,
      count: 1,
      grievances: [grievance],
      clusterCount: 0,
      clusterReports: 0,
      clusterPenalty: 0,
      sampleLocation: grievance.landmark || grievance.title || 'Local Area'
    });
  });

  clusters.forEach((cluster) => {
    const searchText = `${cluster.title || ''} ${cluster.description || ''}`;
    const inferred = inferWardMetadata(searchText);
    const coordinateKey = `${Math.round((cluster.latitude || 0) * 1000)}_${Math.round((cluster.longitude || 0) * 1000)}`;
    const groupKey = inferred?.id ?? `grid-${coordinateKey}`;

    const clusterPenaltyValue = cluster.severity === 'CRITICAL'
      ? 4
      : cluster.severity === 'HIGH'
      ? 2.5
      : cluster.severity === 'MEDIUM'
      ? 1.5
      : 1;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.latSum += cluster.latitude || 0;
      existing.lngSum += cluster.longitude || 0;
      existing.clusterCount += 1;
      existing.clusterReports += cluster.reportsCount || 0;
      existing.clusterPenalty += clusterPenaltyValue * Math.min((cluster.reportsCount || 0) / 10, 3);
      return;
    }

    groups.set(groupKey, {
      id: inferred?.id ?? groupKey,
      name: inferred?.name ?? '',
      borough: inferred?.borough ?? 'Local Area',
      latSum: cluster.latitude || 0,
      lngSum: cluster.longitude || 0,
      count: 0,
      grievances: [],
      clusterCount: 1,
      clusterReports: cluster.reportsCount || 0,
      clusterPenalty: clusterPenaltyValue * Math.min((cluster.reportsCount || 0) / 10, 3),
      sampleLocation: cluster.title || cluster.description || 'Local Area'
    });
  });

  const wards = Array.from(groups.values()).map((group, index) => {
    const complaints = group.grievances;
    const totalComplaints = complaints.length;
    const openComplaints = complaints.filter((g) => !['CITIZEN_VERIFIED', 'CLOSED', 'AUTHORITY_RESOLVED'].includes(g.status)).length;
    const wasteComplaints = complaints.filter((g) => g.category === 'Waste' || g.category === 'Sanitation').length;
    const waterComplaints = complaints.filter((g) => g.category === 'Water').length;
    const roadComplaints = complaints.filter((g) => g.category === 'Road' || g.category === 'Transport').length;
    const electricityComplaints = complaints.filter((g) => g.category === 'Electricity').length;
    const otherComplaints = complaints.filter((g) => !['Waste', 'Sanitation', 'Water', 'Road', 'Transport', 'Electricity'].includes(g.category)).length;
    const totalConfirmations = complaints.reduce((sum, g) => sum + (g.citizenConfirmations || 0), 0);
    const avgResolutionHours = totalComplaints === 0 ? 0 : complaints.reduce((sum, g) => sum + estimateResolutionHours(g), 0) / totalComplaints;
    const averageResolutionDays = Math.round((avgResolutionHours / 24) * 10) / 10;
    const citizenVerificationRate = totalComplaints === 0
      ? 100
      : Math.min(100, Math.round((totalConfirmations / totalComplaints) * 100));
    const severityPenalty = totalComplaints === 0 ? 0 : complaints.reduce((penalty, g) => {
      if (g.severity === 'CRITICAL') return penalty + 4;
      if (g.severity === 'HIGH') return penalty + 2.5;
      if (g.severity === 'MEDIUM') return penalty + 1.5;
      return penalty + 1;
    }, 0);
    const clusterPenalty = Math.min(20, group.clusterPenalty * 2);
    const rawScore = 100
      - Math.min(35, severityPenalty * 2)
      - Math.min(25, openComplaints * 3)
      - Math.min(25, averageResolutionDays * 2.5)
      - clusterPenalty
      + (totalComplaints === 0 ? 15 : Math.min(25, citizenVerificationRate * 0.3));

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const computedId = group.id.startsWith('ward-') ? group.id : `ward-${index + 1}`;
    const fallbackName = group.name || `${group.sampleLocation} (Local Area)`;

    return {
      id: computedId,
      name: fallbackName,
      borough: group.borough,
      healthScore: score,
      status: wardStatusFromScore(score),
      latitude: group.latSum / Math.max(1, group.count + group.clusterCount),
      longitude: group.lngSum / Math.max(1, group.count + group.clusterCount),
      contributingFactors: {
        openComplaints,
        wasteComplaints,
        waterComplaints,
        roadComplaints,
        electricityComplaints,
        otherComplaints,
        associatedClusters: group.clusterCount,
        avgResolutionDays: averageResolutionDays,
        citizenVerificationRate
      }
    } as Ward;
  });

  return wards.sort((a, b) => b.healthScore - a.healthScore);
}

interface AppContextType {
  language: 'en' | 'bn' | 'hi';
  setLanguage: (lang: 'en' | 'bn' | 'hi') => void;
  textSize: 'normal' | 'large' | 'xl';
  setTextSize: (size: 'normal' | 'large' | 'xl') => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  themeMode: 'bright' | 'dark';
  setThemeMode: (mode: 'bright' | 'dark') => void;

  // Real-Time Government of India Data Sync
  isLiveGoiSync: boolean;
  toggleLiveGoiSync: () => void;
  liveGoiLastSynced: string;

  // User Management — derived from AuthContext
  activeUser: User;
  switchRole: (role: 'citizen' | 'authority') => void;

  // App Data State
  grievances: Grievance[];
  clusters: CivicCluster[];
  wards: Ward[];
  notifications: Notification[];

  // Actions
  reportIssue: (data: {
    title: string;
    description: string;
    category: any;
    latitude: number;
    longitude: number;
    landmark?: string;
    isAnonymous: boolean;
    evidence: string[];
  }) => Grievance;
  confirmAffected: (id: string) => void;
  updateStatus: (id: string, status: any, note: string, updatedBy: string, evidenceUrl?: string) => void;
  addOfficerNote: (id: string, note: string, officerName: string) => void;
  updateSeverity: (id: string, newSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', officerName: string) => void;
  verifyComplaintResolution: (id: string, isSatisfied: boolean, note: string) => void;
  clearNotifications: () => void;
  refreshGrievances: () => void;

  // GPS Location State & Actions (Auto-fetches on user login)
  userGpsLocation: UserGpsLocation | null;
  refreshGpsLocation: () => Promise<UserGpsLocation | null>;
  isGpsLocating: boolean;

  // Active Citizen Profile (for welfare gap detector)
  citizenProfile: CitizenProfile;
  updateCitizenProfile: (profile: CitizenProfile) => void;

  // Tour & Demo Mode
  isDemoMode: boolean;
  currentTourStep: number;
  isTourActive: boolean;
  startTour: () => void;
  nextTourStep: () => void;
  endTour: () => void;
  setTourStep: (step: number) => void;
  resetDemo: () => void;
  loadDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, role: authRole } = useAuth();

  // Localization & Accessibility states
  const [language, setLanguage] = useState<'en' | 'bn' | 'hi'>('en');
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'bright' | 'dark'>('bright');

  // Real-Time Government of India Data Sync State
  const [isLiveGoiSync, setIsLiveGoiSync] = useState(true);
  const [liveGoiLastSynced, setLiveGoiLastSynced] = useState<string>(() => new Date().toISOString());

  const toggleLiveGoiSync = useCallback(() => {
    setIsLiveGoiSync(prev => {
      const nextState = !prev;
      if (nextState) {
        setLiveGoiLastSynced(new Date().toISOString());
      }
      return nextState;
    });
  }, []);

  // Demo mode flag — only true when explicitly activated from /demo page
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Demo role override — only used when isDemoMode is true
  const [demoRole, setDemoRole] = useState<'citizen' | 'authority'>('citizen');

  // Tour & Demo Mode state
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentTourStep(1);
  }, []);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep(prev => prev + 1);
  }, []);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentTourStep(0);
  }, []);

  const setTourStep = useCallback((step: number) => {
    setCurrentTourStep(step);
  }, []);

  const resetDemo = useCallback(() => {
    setIsDemoMode(false);
    setIsTourActive(false);
    setCurrentTourStep(0);
  }, []);

  const loadDemoData = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  // Derive activeUser from AuthContext (real auth user) or demo mode
  const activeUser: User = useMemo(() => isDemoMode
    ? {
        id: demoRole === 'citizen' ? 'demo-citizen' : 'demo-officer',
        name: demoRole === 'citizen' ? 'Demo Citizen' : 'Demo Officer',
        role: demoRole,
      }
    : {
        id: authUser?.id || 'guest',
        name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'Guest',
        role: (authRole === 'officer' || authRole === 'admin') ? 'authority' : 'citizen',
      }, [isDemoMode, demoRole, authUser, authRole]);

  // App Data
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [clusters, setClusters] = useState<CivicCluster[]>([]);
  const wards = useMemo(() => computeWardSummaries(grievances, clusters), [grievances, clusters]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Citizen profile for benefit check
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(blankProfile);
  const [isInitialized, setIsInitialized] = useState(false);

  // GPS Location state
  const [userGpsLocation, setUserGpsLocation] = useState<UserGpsLocation | null>(null);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);

  // Auto-fetch GPS when user is authenticated or logs in
  const refreshGpsLocation = useCallback(async (): Promise<UserGpsLocation | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const fallback: UserGpsLocation = {
        latitude: 22.5726,
        longitude: 88.3639,
        displayName: 'Kolkata, West Bengal, India',
        locality: 'Kolkata Central',
        district: 'Kolkata',
        state: 'West Bengal',
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMessage: 'Geolocation is not supported by your browser.'
      };
      setUserGpsLocation(fallback);
      return fallback;
    }

    setIsGpsLocating(true);
    setUserGpsLocation(prev => prev ? { ...prev, status: 'locating' } : null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!position || !position.coords) {
            setIsGpsLocating(false);
            const errLoc: UserGpsLocation = {
              latitude: 22.5726,
              longitude: 88.3639,
              displayName: 'Default Location (Kolkata)',
              locality: 'Kolkata Central',
              district: 'Kolkata',
              state: 'West Bengal',
              timestamp: new Date().toISOString(),
              status: 'error'
            };
            setUserGpsLocation(errLoc);
            return resolve(errLoc);
          }
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let locData: UserGpsLocation = {
            latitude: lat,
            longitude: lng,
            displayName: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
            locality: 'Current Location',
            district: 'Local Area',
            state: '',
            timestamp: new Date().toISOString(),
            status: 'success'
          };

          try {
            const geocoded = await geocodingService.reverseGeocode(lat, lng);
            if (geocoded) {
              locData = {
                latitude: lat,
                longitude: lng,
                displayName: geocoded.displayName,
                locality: geocoded.locality,
                district: geocoded.district,
                state: geocoded.state,
                postcode: geocoded.postcode,
                timestamp: new Date().toISOString(),
                status: 'success'
              };
            }
          } catch (e) {
            console.warn('[GPS] Reverse geocoding lookup failed:', e);
          }

          setUserGpsLocation(locData);
          setIsGpsLocating(false);

          // Persist GPS in localStorage
          try {
            localStorage.setItem('nagriksetu_user_gps', JSON.stringify(locData));
            if (authUser?.id) {
              localStorage.setItem(`nagriksetu_user_gps_${authUser.id}`, JSON.stringify(locData));
            }
          } catch (e) {}

          // Update citizen profile state/district if empty
          if (locData.state || locData.district) {
            setCitizenProfile(prev => ({
              ...prev,
              state: prev.state || locData.state,
              district: prev.district || locData.district
            }));
          }

          // Push GPS notification to feed
          const gpsNotif: Notification = {
            id: `notif-gps-${Date.now()}`,
            userId: authUser?.id || 'guest',
            title: '📍 GPS Location Active',
            message: `Location active: ${locData.locality}${locData.district ? ', ' + locData.district : ''} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            type: 'system',
            referenceId: 'gps',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prev => [gpsNotif, ...prev.filter(n => n.referenceId !== 'gps')]);

          resolve(locData);
        },
        (error) => {
          console.warn('[GPS] Position fetch error or permission denied:', error.message);
          setIsGpsLocating(false);
          const errLoc: UserGpsLocation = {
            latitude: 22.5726,
            longitude: 88.3639,
            displayName: 'Default Location (Kolkata)',
            locality: 'Kolkata Central',
            district: 'Kolkata',
            state: 'West Bengal',
            timestamp: new Date().toISOString(),
            status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
            errorMessage: error.message
          };
          setUserGpsLocation(errLoc);
          resolve(errLoc);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }, [authUser]);

  // Load real data from Supabase when user is authenticated
  const loadRealData = useCallback(async () => {
    if (!authUser) {
      // Not logged in — clear data
      setGrievances([]);
      setClusters([]);
      setNotifications([]);
      setCitizenProfile(blankProfile);
      return;
    }

    try {
      const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (isSupabaseConfigured) {
        // Fetch user's grievances from Supabase
        const { data: dbGrievances, error: gError } = await supabase
          .from('grievances')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: dbClusters, error: cError } = await supabase
          .from('clusters')
          .select('*');

        if (!gError && dbGrievances && dbGrievances.length > 0) {
          const mappedGrievances = dbGrievances.map((g: any) => ({
            id: g.id,
            title: g.title,
            description: g.description,
            category: g.category,
            severity: g.severity || 'HIGH',
            latitude: g.latitude,
            longitude: g.longitude,
            landmark: g.landmark,
            createdAt: g.created_at || g.createdAt,
            status: g.status,
            isAnonymous: g.is_anonymous !== undefined ? g.is_anonymous : g.isAnonymous,
            assignedTeam: g.assigned_team || g.assignedTeam,
            resolutionNote: g.resolution_note || g.resolutionNote,
            timeline: g.timeline || [],
            citizenConfirmations: g.citizen_confirmations !== undefined ? g.citizen_confirmations : (g.citizenConfirmations || 0),
            slaDeadline: g.sla_deadline || g.slaDeadline,
            isEscalated: g.is_escalated !== undefined ? g.is_escalated : (g.isEscalated || false),
            escalatedTo: g.escalated_to || g.escalatedTo,
            evidence: g.evidence || [],
            reporterId: g.reporter_id || g.reporterId || authUser.id
          }));
          setGrievances(mappedGrievances as Grievance[]);
        } else {
          // No grievances in database — start empty
          setGrievances([]);
        }

        if (!cError && dbClusters && dbClusters.length > 0) {
          const mappedClusters = dbClusters.map((c: any) => ({
            id: c.id,
            title: c.name || c.title || 'Cluster',
            category: c.category,
            latitude: c.latitude,
            longitude: c.longitude,
            radiusMeters: c.radius_meters !== undefined ? c.radius_meters : (c.radiusMeters || c.affected_radius || 220),
            confidence: c.confidence,
            reportsCount: c.reports_count !== undefined ? c.reports_count : (c.reportsCount || c.report_ids?.length || 0),
            citizenConfirmations: c.citizen_confirmations !== undefined ? c.citizen_confirmations : (c.citizenConfirmations || 0),
            severity: c.severity || 'HIGH',
            status: c.status,
            createdAt: c.created_at || c.createdAt || new Date().toISOString(),
            lastReportedAt: c.last_reported_at || c.lastReportedAt || new Date().toISOString(),
            authorityId: c.authority_id || c.authorityId || 'dept-electrical',
            description: c.description || 'Civic cluster detected by NagrikSetu intelligence.'
          }));
          setClusters(mappedClusters as CivicCluster[]);
        } else {
          setClusters([]);
        }
      } else {
        // Supabase not configured — start with an empty state rather than
        // silently substituting old seeded/mock data.
        console.warn('[AppContext] Supabase is not configured. Grievances and clusters will start empty.');
        setGrievances([]);
        setClusters([]);
      }

      // Load profile from localStorage (per user)
      const storedProfile = localStorage.getItem(`nagriksetu_profile_${authUser.id}`);
      setCitizenProfile(storedProfile ? JSON.parse(storedProfile) : blankProfile);

      // Load notifications from localStorage (per user)
      const storedNotifications = localStorage.getItem(`nagriksetu_notifications_${authUser.id}`);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);

    } catch (e) {
      console.error("Failed to load data from Supabase, starting with empty state", e);
      setGrievances([]);
      setClusters([]);
    }
  }, [authUser]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load accessibility settings from localStorage
    const storedLang = localStorage.getItem('nagriksetu_language') as any;
    if (storedLang) setLanguage(storedLang);

    const storedText = localStorage.getItem('nagriksetu_textSize') as any;
    if (storedText) setTextSize(storedText);

    setHighContrast(localStorage.getItem('nagriksetu_highContrast') === 'true');
    setReduceMotion(localStorage.getItem('nagriksetu_reduceMotion') === 'true');

    const storedTheme = localStorage.getItem('nagriksetu_themeMode') as 'bright' | 'dark' | null;
    if (storedTheme === 'dark' || storedTheme === 'bright') {
      setThemeMode(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark');
    }

    // Also check old keys for migration
    if (!storedLang) {
      const oldLang = localStorage.getItem('jansetu_language') as any;
      if (oldLang) {
        setLanguage(oldLang);
        localStorage.setItem('nagriksetu_language', oldLang);
        localStorage.removeItem('jansetu_language');
      }
    }

    setIsInitialized(true);
  }, []);

  // Load real data whenever auth user changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    loadRealData();
  }, [authUser?.id, isInitialized, loadRealData]);

  // Auto-fetch GPS whenever any user logs in or auth state changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    if (authUser) {
      refreshGpsLocation();
    } else {
      const stored = localStorage.getItem('nagriksetu_user_gps');
      if (stored) {
        try {
          setUserGpsLocation(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [authUser?.id, isInitialized, refreshGpsLocation]);

  // Persist notifications per user
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    if (authUser) {
      localStorage.setItem(`nagriksetu_notifications_${authUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, isInitialized, authUser]);

  // Persist citizen profile per user
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    if (authUser) {
      localStorage.setItem(`nagriksetu_profile_${authUser.id}`, JSON.stringify(citizenProfile));
    }
  }, [citizenProfile, isInitialized, authUser]);

  // Sync settings with body classes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xl', 'high-contrast', 'reduce-motion', 'bright', 'dark');
    body.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xl', 'high-contrast', 'reduce-motion', 'bright', 'dark');

    root.classList.add(`text-scale-${textSize}`);
    body.classList.add(`text-scale-${textSize}`);
    localStorage.setItem('nagriksetu_textSize', textSize);

    if (highContrast) {
      root.classList.add('high-contrast');
      body.classList.add('high-contrast');
    }
    localStorage.setItem('nagriksetu_highContrast', String(highContrast));

    if (reduceMotion) {
      root.classList.add('reduce-motion');
      body.classList.add('reduce-motion');
    }
    localStorage.setItem('nagriksetu_reduceMotion', String(reduceMotion));

    root.classList.add(themeMode);
    body.classList.add(themeMode);
    localStorage.setItem('nagriksetu_themeMode', themeMode);

    localStorage.setItem('nagriksetu_language', language);
  }, [language, textSize, highContrast, reduceMotion, themeMode]);

  const switchRole = useCallback((role: 'citizen' | 'authority') => {
    setDemoRole(role);
  }, []);

  // Actions
  const reportIssue = (data: {
    title: string;
    description: string;
    category: any;
    latitude: number;
    longitude: number;
    landmark?: string;
    isAnonymous: boolean;
    evidence: string[];
  }) => {
    const newId = `CT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();
    const reporterName = data.isAnonymous ? 'Anonymous Citizen' : activeUser.name;

    // Build timeline for new grievance
    const timeline: StatusUpdate[] = [
      { status: 'REPORTED', note: data.description, updatedAt: createdAt, updatedBy: reporterName },
      { status: 'AI_CLASSIFIED', note: `AI classified as ${data.category}. Severity: HIGH. Route: Municipal ${data.category} Department.`, updatedAt: new Date(Date.now() + 1000).toISOString(), updatedBy: 'AI System' }
    ];

    const newGrievance: Grievance = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: 'HIGH',
      latitude: data.latitude,
      longitude: data.longitude,
      landmark: data.landmark || '',
      createdAt,
      status: 'AI_CLASSIFIED',
      isAnonymous: data.isAnonymous,
      authorityId: `dept-${String(data.category).toLowerCase().replace(/\s+/g, '-')}`,
      reporterId: activeUser.id,
      evidence: data.evidence,
      timeline,
      citizenConfirmations: 0,
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isEscalated: false
    };

    // Update local state
    setGrievances(prev => [newGrievance, ...prev]);

    // Sync to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabase.from('grievances').insert({
        id: newId,
        title: data.title,
        description: data.description,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        landmark: data.landmark || '',
        is_anonymous: data.isAnonymous,
        evidence: data.evidence,
        status: 'AI_CLASSIFIED',
        timeline: timeline,
        reporter_id: activeUser.id,
        assigned_team: null,
        resolution_note: null
      }).then(({ error }: { error: any }) => {
        if (error) console.error("Error inserting grievance into Supabase:", error);
      });
    }

    // Push notification
    const newNotif: Notification = {
      id: `notif-submit-${Date.now()}`,
      userId: activeUser.id,
      title: 'Grievance Registered',
      message: `Your grievance ${newGrievance.id} has been classified by AI.`,
      type: 'grievance',
      referenceId: newGrievance.id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newGrievance;
  };

  const confirmAffected = (id: string) => {
    // Increment confirmations in grievances list
    setGrievances(prev => prev.map(g => {
      if (g.id === id || g.clusterId === id) {
        return {
          ...g,
          citizenConfirmations: g.citizenConfirmations + 1,
          timeline: [...g.timeline, {
            status: g.status,
            note: 'Another citizen confirmed this issue by clicking "I\'m Affected Too".',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Citizen Supporter'
          }]
        };
      }
      return g;
    }));

    // Update clusters confirmations
    setClusters(prev => prev.map(c => {
      if (c.id === id || c.id === grievances.find(g => g.id === id)?.clusterId) {
        return { ...c, citizenConfirmations: c.citizenConfirmations + 1 };
      }
      return c;
    }));
  };

  const updateStatus = (
    id: string,
    status: any,
    note: string,
    updatedBy: string,
    evidenceUrl?: string
  ) => {
    setGrievances(prev => prev.map(g => {
      const isTarget = g.id === id || (g.clusterId === id && id.startsWith('cluster-'));
      if (isTarget) {
        const updatedTimeline = [...g.timeline, {
          status,
          note,
          updatedAt: new Date().toISOString(),
          updatedBy,
          evidenceUrl
        }];
        return { ...g, status, timeline: updatedTimeline };
      }
      return g;
    }));

    // Update cluster overall status
    if (id.startsWith('cluster-')) {
      setClusters(prev => prev.map(c => {
        if (c.id === id) return { ...c, status };
        return c;
      }));
    } else {
      const grievance = grievances.find(g => g.id === id);
      if (grievance?.clusterId) {
        const clusterId = grievance.clusterId;
        setClusters(prev => prev.map(c => {
          if (c.id === clusterId) return { ...c, status };
          return c;
        }));
      }
    }

    // Sync status change to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      if (id.startsWith('cluster-')) {
        supabase.from('grievances').update({
          status,
          assigned_team: status === 'WORK_STARTED' || status === 'ASSIGNED' ? updatedBy : null,
          resolution_note: status === 'AUTHORITY_RESOLVED' ? note : null
        }).eq('clusterId', id).then(({ error }: { error: any }) => {
          if (error) console.error("Error updating cluster grievances in Supabase:", error);
        });
      } else {
        const target = grievances.find(g => g.id === id);
        if (target) {
          const updatedTimeline = [...target.timeline, {
            status,
            note,
            updatedAt: new Date().toISOString(),
            updatedBy,
            evidenceUrl
          }];
          supabase.from('grievances').update({
            status,
            assigned_team: status === 'WORK_STARTED' || status === 'ASSIGNED' ? updatedBy : null,
            resolution_note: status === 'AUTHORITY_RESOLVED' ? note : null,
            timeline: updatedTimeline
          }).eq('id', id).then(({ error }: { error: any }) => {
            if (error) console.error("Error updating grievance in Supabase:", error);
          });
        }
      }
    }

    // Add notification with real data
    const newNotif: Notification = {
      id: `notif-update-${Date.now()}`,
      userId: activeUser.id,
      title: 'Civic Issue Status Changed',
      message: `Grievance ${id} has been updated to ${String(status).replace('_', ' ')} by ${updatedBy}.`,
      type: 'grievance',
      referenceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Officer adds a note/feedback to a grievance timeline WITHOUT changing status
  const addOfficerNote = (id: string, note: string, officerName: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const entry: StatusUpdate = {
          status: g.status, // keep current status unchanged
          note: `[Officer Note] ${note}`,
          updatedAt: new Date().toISOString(),
          updatedBy: `🛡 ${officerName}`
        };
        return { ...g, timeline: [...g.timeline, entry] };
      }
      return g;
    }));

    const newNotif: Notification = {
      id: `notif-note-${Date.now()}`,
      userId: activeUser.id,
      title: 'Officer Feedback Added',
      message: `Officer ${officerName} added a note to case ${id}.`,
      type: 'grievance',
      referenceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Officer overrides the severity of a grievance
  const updateSeverity = (id: string, newSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', officerName: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const entry: StatusUpdate = {
          status: g.status,
          note: `[Severity Override] Priority changed from ${g.severity} to ${newSeverity} by officer.`,
          updatedAt: new Date().toISOString(),
          updatedBy: `🛡 ${officerName}`
        };
        return { ...g, severity: newSeverity, timeline: [...g.timeline, entry] };
      }
      return g;
    }));

    const newNotif: Notification = {
      id: `notif-severity-${Date.now()}`,
      userId: activeUser.id,
      title: 'Case Priority Updated',
      message: `Officer ${officerName} changed case ${id} severity to ${newSeverity}.`,
      type: 'grievance',
      referenceId: id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const verifyComplaintResolution = (id: string, isSatisfied: boolean, note: string) => {
    setGrievances(prev => prev.map(g => {
      if (g.id === id) {
        const timeline = [...g.timeline];

        if (isSatisfied) {
          timeline.push({
            status: 'CITIZEN_VERIFIED',
            note: `Citizen verified resolution: ${note}`,
            updatedAt: new Date().toISOString(),
            updatedBy: activeUser.name
          });
          timeline.push({
            status: 'CLOSED',
            note: 'Grievance ticket closed successfully upon confirmation.',
            updatedAt: new Date(Date.now() + 1000).toISOString(),
            updatedBy: 'AI System'
          });

          return { ...g, status: 'CLOSED' as GrievanceStatus, timeline };
        } else {
          // DISPUTED FLOW
          timeline.push({
            status: 'RESOLUTION_DISPUTED',
            note: `Resolution DISPUTED by citizen. Note: "${note}"`,
            updatedAt: new Date().toISOString(),
            updatedBy: activeUser.name
          });
          timeline.push({
            status: 'ASSIGNED',
            note: 'AUTOMATIC ESCALATION: Case reopened due to citizen dispute. Re-routed to Municipal Deputy Commissioner (Vigilance) with priority HIGH.',
            updatedAt: new Date(Date.now() + 1000).toISOString(),
            updatedBy: 'AI System'
          });

          return {
            ...g,
            status: 'RESOLUTION_DISPUTED' as GrievanceStatus,
            isEscalated: true,
            escalatedTo: 'Municipal Deputy Commissioner (Vigilance)',
            timeline
          };
        }
      }
      return g;
    }));

    // Sync cluster state
    const targetG = grievances.find(x => x.id === id);
    if (targetG?.clusterId) {
      setClusters(prev => prev.map(c => {
        if (c.id === targetG.clusterId) {
          return {
            ...c,
            status: isSatisfied ? ('CLOSED' as GrievanceStatus) : ('RESOLUTION_DISPUTED' as GrievanceStatus),
            severity: isSatisfied ? c.severity : 'CRITICAL'
          };
        }
        return c;
      }));
    }

    // Sync verification to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && targetG) {
      const timeline = [...targetG.timeline];
      let finalStatus = 'CLOSED';
      let isEscalated = false;

      if (isSatisfied) {
        timeline.push({
          status: 'CITIZEN_VERIFIED',
          note: `Citizen verified resolution: ${note}`,
          updatedAt: new Date().toISOString(),
          updatedBy: activeUser.name
        });
        timeline.push({
          status: 'CLOSED',
          note: 'Grievance ticket closed successfully upon confirmation.',
          updatedAt: new Date(Date.now() + 1000).toISOString(),
          updatedBy: 'AI System'
        });
      } else {
        finalStatus = 'RESOLUTION_DISPUTED';
        isEscalated = true;
        timeline.push({
          status: 'RESOLUTION_DISPUTED',
          note: `Resolution DISPUTED by citizen. Note: "${note}"`,
          updatedAt: new Date().toISOString(),
          updatedBy: activeUser.name
        });
        timeline.push({
          status: 'ASSIGNED',
          note: 'AUTOMATIC ESCALATION: Case reopened due to citizen dispute. Re-routed to Municipal Deputy Commissioner (Vigilance) with priority HIGH.',
          updatedAt: new Date(Date.now() + 1000).toISOString(),
          updatedBy: 'AI System'
        });
      }

      supabase.from('grievances').update({
        status: finalStatus,
        is_escalated: isEscalated,
        escalated_to: isEscalated ? 'Municipal Deputy Commissioner (Vigilance)' : null,
        timeline: timeline
      }).eq('id', id).then(({ error }: { error: any }) => {
        if (error) console.error("Error updating verification in Supabase:", error);
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateCitizenProfile = (profile: CitizenProfile) => {
    setCitizenProfile(profile);
  };

  const refreshGrievances = async () => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { data: dbGrievances } = await supabase.from('grievances').select('*').order('created_at', { ascending: false });
        if (dbGrievances && dbGrievances.length > 0) {
          const mapped = dbGrievances.map((g: any) => ({
            id: g.id,
            title: g.title,
            description: g.description,
            category: g.category,
            severity: g.severity || 'MEDIUM',
            latitude: g.latitude,
            longitude: g.longitude,
            landmark: g.landmark,
            createdAt: g.created_at || new Date().toISOString(),
            status: g.status || 'REPORTED',
            isAnonymous: g.is_anonymous || false,
            reporterId: g.reporter_id || activeUser.id,
            evidence: g.evidence || [],
            timeline: g.timeline || [],
            citizenConfirmations: g.citizen_confirmations || 0,
            slaDeadline: g.sla_deadline || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            isEscalated: g.is_escalated || false,
          }));
          setGrievances(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to refresh grievances', e);
    }
  };

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      textSize,
      setTextSize,
      highContrast,
      setHighContrast,
      reduceMotion,
      setReduceMotion,
      isLiveGoiSync,
      toggleLiveGoiSync,
      liveGoiLastSynced,
      activeUser,
      switchRole,
      grievances,
      clusters,
      wards,
      notifications,
      reportIssue,
      confirmAffected,
      updateStatus,
      addOfficerNote,
      updateSeverity,
      verifyComplaintResolution,
      clearNotifications,
      resetDemo,
      refreshGrievances,
      loadDemoData,
      citizenProfile,
      updateCitizenProfile,
      currentTourStep,
      isTourActive,
      isDemoMode,
      startTour,
      nextTourStep,
      endTour,
      setTourStep,
      userGpsLocation,
      refreshGpsLocation,
      isGpsLocating,
      themeMode,
      setThemeMode
    };
  }, [
    language,
    textSize,
    highContrast,
    reduceMotion,
    isLiveGoiSync,
    toggleLiveGoiSync,
    liveGoiLastSynced,
    activeUser,
    switchRole,
    grievances,
    clusters,
    wards,
    notifications,
    reportIssue,
    confirmAffected,
    updateStatus,
    addOfficerNote,
    updateSeverity,
    verifyComplaintResolution,
    clearNotifications,
    resetDemo,
    refreshGrievances,
    loadDemoData,
    citizenProfile,
    updateCitizenProfile,
    currentTourStep,
    isTourActive,
    isDemoMode,
    startTour,
    nextTourStep,
    endTour,
    setTourStep,
    userGpsLocation,
    refreshGpsLocation,
    isGpsLocating,
    themeMode,
    setThemeMode
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}