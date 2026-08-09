'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Grievance, CivicCluster, GrievanceStatus, GrievanceCategory, GrievanceSeverity } from '@/types';
import { DEPARTMENTS } from '@/services/grievanceService';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Users,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Send,
  Upload,
  Image as ImageIcon,
  Building2,
  AlertCircle,
  Lock,
  ChevronRight,
  ChevronDown,
  UserCheck,
  FileCheck,
  UserCog,
  MapPin,
  MessageSquare,
  ArrowUpDown
} from 'lucide-react';

// ─── Location group type ────────────────────────────────────────────────────
interface LocationGroup {
  key: string;
  landmark: string;
  lat: number;
  lng: number;
  grievances: Grievance[];
}

// ─── Haversine distance (meters) between two GPS points ─────────────────────
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Severity ordering for serial display ───────────────────────────────────
const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function AuthorityPortal() {
  const { user, role, isLoading: authLoading } = useAuth();
  const { grievances, clusters, updateStatus, addOfficerNote, updateSeverity, refreshGrievances } = useApp();

  // Selected state
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grievances' | 'locations' | 'clusters'>('grievances');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Case Action Form States
  const [resolutionNote, setResolutionNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Municipal Rapid Response Unit 1');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Officer Note / Feedback form
  const [officerNote, setOfficerNote] = useState('');
  const [severityOverride, setSeverityOverride] = useState<GrievanceSeverity | ''>('');

  // Location groups expand state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Preselect first available items when loaded
  useEffect(() => {
    if (grievances.length > 0 && !selectedGrievanceId) {
      setSelectedGrievanceId(grievances[0].id);
    }
    if (clusters.length > 0 && !selectedClusterId) {
      setSelectedClusterId(clusters[0].id);
    }
  }, [grievances, clusters, selectedGrievanceId, selectedClusterId]);

  // Derived filtered grievances
  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.landmark && g.landmark.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || g.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'OPEN') matchesStatus = g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED';
    if (statusFilter === 'WORK_STARTED') matchesStatus = g.status === 'WORK_STARTED';
    if (statusFilter === 'RESOLVED') matchesStatus = g.status === 'AUTHORITY_RESOLVED';
    if (statusFilter === 'SLA_BREACH') matchesStatus = g.isEscalated || (new Date(g.slaDeadline) < new Date() && g.status !== 'CLOSED');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ── Location-based grouping ────────────────────────────────────────────────
  const locationGroups: LocationGroup[] = useMemo(() => {
    const groups: LocationGroup[] = [];
    const assigned = new Set<string>();

    // Sort by severity first for consistent grouping
    const sorted = [...filteredGrievances].sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
    );

    for (const g of sorted) {
      if (assigned.has(g.id)) continue;

      // Try to find an existing group within 200m
      let matched = false;
      for (const group of groups) {
        const dist = haversineMeters(g.latitude, g.longitude, group.lat, group.lng);
        if (dist <= 200 || (g.landmark && g.landmark.trim() !== '' && g.landmark === group.landmark)) {
          group.grievances.push(g);
          assigned.add(g.id);
          matched = true;
          break;
        }
      }

      if (!matched) {
        groups.push({
          key: `loc-${g.id}`,
          landmark: g.landmark || `Lat: ${g.latitude.toFixed(4)}, Lng: ${g.longitude.toFixed(4)}`,
          lat: g.latitude,
          lng: g.longitude,
          grievances: [g]
        });
        assigned.add(g.id);
      }
    }

    // Sort each group internally by severity then date
    for (const group of groups) {
      group.grievances.sort((a, b) => {
        const sevDiff = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Sort groups by total issue count descending
    groups.sort((a, b) => b.grievances.length - a.grievances.length);

    return groups;
  }, [filteredGrievances]);

  const selectedGrievance = grievances.find((g) => g.id === selectedGrievanceId) || filteredGrievances[0];
  const selectedCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

  // Calculated Metrics
  const totalOpen = grievances.filter((g) => g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED').length;
  const criticalCount = grievances.filter((g) => g.severity === 'CRITICAL' && g.status !== 'CLOSED').length;
  const slaBreachCount = grievances.filter((g) => g.isEscalated || (new Date(g.slaDeadline) < new Date() && g.status !== 'CLOSED')).length;
  const totalResolved = grievances.filter((g) => g.status === 'CITIZEN_VERIFIED' || g.status === 'CLOSED').length;
  const resolutionPercentage = grievances.length > 0 ? Math.round((totalResolved / grievances.length) * 100) : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAssignTeam = (gId: string) => {
    setIsUpdating(true);
    setActionSuccessMsg('');
    setTimeout(() => {
      const officerName = user?.user_metadata?.name || user?.email || 'Officer';
      updateStatus(
        gId,
        'WORK_STARTED',
        `Assigned team: ${selectedTeam}. Maintenance unit dispatched to site.`,
        officerName
      );
      setIsUpdating(false);
      setActionSuccessMsg(`Assigned to ${selectedTeam} successfully.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }, 800);
  };

  const handleMarkResolved = (gId: string) => {
    if (!resolutionNote.trim()) {
      alert('Please provide a resolution note summarizing work done.');
      return;
    }

    setIsUpdating(true);
    setActionSuccessMsg('');
    setTimeout(() => {
      const officerName = user?.user_metadata?.name || user?.email || 'Officer';
      const proofPhoto = evidenceUrl.trim() || 'https://images.unsplash.com/photo-1509024640748-024a72d0c518?w=800&q=80';
      
      updateStatus(
        gId,
        'AUTHORITY_RESOLVED',
        resolutionNote,
        officerName,
        proofPhoto
      );
      
      setIsUpdating(false);
      setResolutionNote('');
      setEvidenceUrl('');
      setActionSuccessMsg('Marked as Resolved. Citizen verification request sent!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }, 1000);
  };

  const handleAddOfficerNote = (gId: string) => {
    if (!officerNote.trim()) return;
    const officerName = user?.user_metadata?.name || user?.email || 'Officer';
    addOfficerNote(gId, officerNote, officerName);
    setOfficerNote('');
    setActionSuccessMsg('Officer note added successfully.');
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleSeverityOverride = (gId: string) => {
    if (!severityOverride) return;
    const officerName = user?.user_metadata?.name || user?.email || 'Officer';
    updateSeverity(gId, severityOverride as GrievanceSeverity, officerName);
    setSeverityOverride('');
    setActionSuccessMsg(`Severity updated to ${severityOverride}.`);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const handleBulkAssign = (groupGrievances: Grievance[]) => {
    setIsUpdating(true);
    const officerName = user?.user_metadata?.name || user?.email || 'Officer';
    setTimeout(() => {
      groupGrievances.forEach(g => {
        if (g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED' && g.status !== 'AUTHORITY_RESOLVED') {
          updateStatus(g.id, 'WORK_STARTED', `Bulk assigned: ${selectedTeam}. Dispatched to location group.`, officerName);
        }
      });
      setIsUpdating(false);
      setActionSuccessMsg(`Assigned ${groupGrievances.length} issues to ${selectedTeam}.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }, 800);
  };

  const handleRecalculateClusters = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/clusters/recalculate', { method: 'POST' });
      if (res.ok) {
        refreshGrievances();
      }
    } catch (e) {
      console.error('Failed to recalculate clusters', e);
    } finally {
      setIsRecalculating(false);
    }
  };

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Auth Guard ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isOfficerOrAdmin = user && (role === 'officer' || role === 'admin' || user.user_metadata?.role === 'officer');

  if (!user || !isOfficerOrAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/80"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">
            Officer Portal Access Control
          </h2>
          <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
            The Administrative Portal is restricted to authorized municipal officers and clearance teams. 
            Please sign in with an Officer account or register using your Officer Clearance Code.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/auth/login?returnUrl=/authority"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-hidden"
            >
              Log in as Officer
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Register Officer Account
            </Link>
          </div>

          <div className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
            Demo Registration Code: <code className="font-mono font-bold text-orange-600 dark:text-orange-400">NAGRIK_SETU_2026</code>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Severity badge helper ─────────────────────────────────────────────────
  const getSeverityBadge = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300';
    if (severity === 'HIGH') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'CITIZEN_VERIFIED' || status === 'CLOSED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
    if (status === 'AUTHORITY_RESOLVED') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 text-stone-900 dark:text-stone-50 space-y-8">
      
      {/* Portal Header */}
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 dark:border-stone-800 md:flex-row md:items-center md:justify-between text-left">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-extrabold tracking-tight">
              Administrative Officer Portal
            </h1>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Municipal Oversight & Case Dispatch Cell
          </p>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
            <span className="font-bold text-orange-600 dark:text-orange-400">{user.user_metadata?.name || user.email}</span>
            {user.user_metadata?.designation && <span> · {user.user_metadata.designation}</span>}
            {user.user_metadata?.department && <span> · {user.user_metadata.department}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/authority/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <UserCog className="h-4 w-4 text-orange-500" />
            My Profile
          </Link>

          <button
            onClick={handleRecalculateClusters}
            disabled={isRecalculating}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-purple-600 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate AI Clusters'}
          </button>
        </div>
      </div>

      {/* Real-time Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Open Cases</p>
          <p className="mt-1 text-3xl font-black text-stone-900 dark:text-white">{totalOpen}</p>
          <span className="mt-1 block text-[10px] text-stone-500">Require departmental action</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Critical Priority</p>
          <p className="mt-1 text-3xl font-black text-red-600 dark:text-red-500">{criticalCount}</p>
          <span className="mt-1 block text-[10px] text-red-500 font-semibold">Immediate safety risk</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">SLA Breaches</p>
          <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-500">{slaBreachCount}</p>
          <span className="mt-1 block text-[10px] text-amber-600 font-bold">Overdue / Escalated</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Resolution Rate</p>
          <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-500">{resolutionPercentage}%</p>
          <span className="mt-1 block text-[10px] text-stone-500">Citizen verified closed</span>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Location Hotspots</p>
          <p className="mt-1 text-3xl font-black text-purple-600 dark:text-purple-400">{locationGroups.filter(g => g.grievances.length > 1).length}</p>
          <span className="mt-1 block text-[10px] text-stone-500">Multi-issue locations</span>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={() => setActiveTab('grievances')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === 'grievances'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          Smart Cases Queue ({filteredGrievances.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === 'locations'
              ? 'border-purple-600 text-purple-600 font-extrabold'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Location Groups ({locationGroups.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('clusters')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === 'clusters'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          Active Civic Clusters ({clusters.length})
        </button>
      </div>

      {/* Main Grid: Left Queue vs Right Action Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: List & Filters */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* ═══════ GRIEVANCES TAB ═══════ */}
          {activeTab === 'grievances' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative col-span-1 sm:col-span-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, title..."
                    className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-800 dark:bg-stone-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-800 dark:bg-stone-900 text-stone-700 dark:text-stone-300"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Cases</option>
                  <option value="WORK_STARTED">Work In Progress</option>
                  <option value="RESOLVED">Awaiting Citizen Verification</option>
                  <option value="SLA_BREACH">SLA Breaches / Escalated</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-800 dark:bg-stone-900 text-stone-700 dark:text-stone-300"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Road">Road</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Waste">Waste</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Corruption">Corruption</option>
                  <option value="Harassment">Harassment</option>
                </select>
              </div>

              {/* Grievance Card List */}
              {filteredGrievances.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-800">
                  No grievances found matching criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGrievances.map((g) => {
                    const isSelected = g.id === selectedGrievance?.id;

                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrievanceId(g.id)}
                        className={`w-full text-left p-4 rounded-xl border transition shadow-xs cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white dark:bg-stone-900 border-orange-500 ring-2 ring-orange-500/20'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span className="font-mono text-stone-400">{g.id}</span>
                            <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityBadge(g.severity)}`}>
                              {g.severity}
                            </span>
                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded">
                              {g.category}
                            </span>
                          </div>

                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${getStatusBadge(g.status)}`}>
                            {g.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-50 mt-2.5 leading-snug">
                          {g.title}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                          <span>Landmark: {g.landmark || 'Not specified'}</span>
                          <span className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                            <Users className="h-3.5 w-3.5 text-stone-400" />
                            {g.citizenConfirmations} Affected
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════ LOCATION GROUPS TAB ═══════ */}
          {activeTab === 'locations' && (
            <div className="space-y-3">
              {locationGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-800">
                  No location groups available.
                </div>
              ) : (
                locationGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.key);
                  const openCount = group.grievances.filter(g => g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED').length;
                  const hasCritical = group.grievances.some(g => g.severity === 'CRITICAL');

                  return (
                    <div key={group.key} className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 shadow-xs overflow-hidden">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroupExpand(group.key)}
                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            hasCritical ? 'bg-red-100 dark:bg-red-950/50' : 'bg-purple-100 dark:bg-purple-950/50'
                          }`}>
                            <MapPin className={`h-5 w-5 ${hasCritical ? 'text-red-600' : 'text-purple-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-50 leading-snug">
                              📍 {group.landmark}
                            </h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                              {group.grievances.length} issue{group.grievances.length > 1 ? 's' : ''} · {openCount} open
                              {hasCritical && <span className="text-red-500 font-bold ml-1">⚠ CRITICAL</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {group.grievances.length > 1 && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-extrabold">
                              HOTSPOT
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-stone-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-stone-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Issues */}
                      {isExpanded && (
                        <div className="border-t border-stone-100 dark:border-stone-800">
                          <div className="divide-y divide-stone-100 dark:divide-stone-800">
                            {group.grievances.map((g, idx) => (
                              <button
                                key={g.id}
                                onClick={() => {
                                  setSelectedGrievanceId(g.id);
                                  setActiveTab('grievances');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition flex items-center gap-3 cursor-pointer"
                              >
                                {/* Serial Number */}
                                <span className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-black text-stone-500 shrink-0">
                                  {idx + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-[10px] text-stone-400">{g.id}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getSeverityBadge(g.severity)}`}>
                                      {g.severity}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-1.5 py-0.5 rounded text-[9px]">
                                      {g.category}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusBadge(g.status)}`}>
                                      {g.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-1 truncate">{g.title}</p>
                                </div>

                                <ChevronRight className="h-4 w-4 text-stone-300 shrink-0" />
                              </button>
                            ))}
                          </div>

                          {/* Bulk Assign Button */}
                          {openCount > 0 && (
                            <div className="p-3 bg-stone-50 dark:bg-stone-950/50 border-t border-stone-100 dark:border-stone-800">
                              <button
                                onClick={() => handleBulkAssign(group.grievances)}
                                disabled={isUpdating}
                                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Send className="h-4 w-4" />
                                Assign All {openCount} Issues to Team
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═══════ CLUSTERS TAB ═══════ */}
          {activeTab === 'clusters' && (
            <div className="space-y-3">
              {clusters.map((c) => {
                const isSelected = c.id === selectedCluster?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClusterId(c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition shadow-xs cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-stone-900 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 rounded text-[10px] font-extrabold uppercase">
                        AI Cluster Zone
                      </span>
                      <span className="text-[11px] font-bold text-stone-500">{c.reportsCount} Grouped Reports</span>
                    </div>

                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-50 mt-2.5 leading-snug">
                      {c.title}
                    </h3>
                    
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">{c.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                      <span>Affected Radius: {c.radiusMeters}m</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-stone-400" />
                        {c.citizenConfirmations} Confirmations
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* ═══════ RIGHT COLUMN: Case Resolution & Dispatch Workspace ═══════ */}
        <div className="lg:col-span-5 space-y-6">
          
          {(activeTab === 'grievances' || activeTab === 'locations') && selectedGrievance && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left space-y-5">
              
              <div className="border-b border-stone-200 pb-4 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Case Action Panel</span>
                  <span className="font-mono text-xs text-stone-400">{selectedGrievance.id}</span>
                </div>
                <h3 className="mt-1 font-bold text-base text-stone-900 dark:text-white leading-snug">
                  {selectedGrievance.title}
                </h3>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                <p><strong>Description:</strong> &quot;{selectedGrievance.description}&quot;</p>
                <p><strong>Current Status:</strong> <span className="font-bold text-orange-600 dark:text-orange-400 capitalize">{selectedGrievance.status.replace('_', ' ').toLowerCase()}</span></p>
                {selectedGrievance.landmark && <p><strong>Landmark:</strong> {selectedGrievance.landmark}</p>}
                <p><strong>SLA Deadline:</strong> {new Date(selectedGrievance.slaDeadline).toLocaleString()}</p>
              </div>

              {/* ── Officer Real-Time Feedback Section ──────────────────────── */}
              <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  Officer Real-Time Feedback
                </span>

                {/* Add Officer Note */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Add Progress Note (visible to citizen)</label>
                  <textarea
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="e.g. 'Team dispatched, expected to reach site by 2PM. Electrical transformer replacement in progress.'"
                    className="min-h-[60px] w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950 text-stone-900 dark:text-stone-50"
                  />
                  <button
                    onClick={() => handleAddOfficerNote(selectedGrievance.id)}
                    disabled={!officerNote.trim()}
                    className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Post Officer Note
                  </button>
                </div>

                {/* Severity Override */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      <ArrowUpDown className="h-3 w-3 inline mr-1 text-amber-500" />
                      Override Priority
                    </label>
                    <select
                      value={severityOverride}
                      onChange={(e) => setSeverityOverride(e.target.value as GrievanceSeverity | '')}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950 text-stone-700 dark:text-stone-300"
                    >
                      <option value="">Current: {selectedGrievance.severity}</option>
                      <option value="CRITICAL">🔴 CRITICAL</option>
                      <option value="HIGH">🟠 HIGH</option>
                      <option value="MEDIUM">🟡 MEDIUM</option>
                      <option value="LOW">🟢 LOW</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleSeverityOverride(selectedGrievance.id)}
                    disabled={!severityOverride}
                    className="mt-5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Status Action Workflow */}
              <div className="space-y-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Departmental Action Workflow</span>
                
                {selectedGrievance.status === 'REPORTED' || selectedGrievance.status === 'AI_CLASSIFIED' || selectedGrievance.status === 'ASSIGNED' ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Select Dispatch Team</label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950 dark:text-stone-50"
                      >
                        <option value="Municipal Electrical Repair Team 3">Municipal Electrical Repair Team 3</option>
                        <option value="Solid Waste Rapid Clearance Crew">Solid Waste Rapid Clearance Crew</option>
                        <option value="Water Supply Board Emergency Team">Water Supply Board Emergency Team</option>
                        <option value="PWD Asphalt & Road Filling Crew">PWD Asphalt & Road Filling Crew</option>
                        <option value="Vigilance Audit & Inspection Cell">Vigilance Audit & Inspection Cell</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleAssignTeam(selectedGrievance.id)}
                      disabled={isUpdating}
                      className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-orange-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Dispatch Team & Start Work
                    </button>
                  </div>
                ) : selectedGrievance.status === 'WORK_STARTED' || selectedGrievance.status === 'RESOLUTION_DISPUTED' ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Resolution Summary Note</label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Describe exact repair actions taken (e.g. Replaced faulty transformer fuse and verified electrical line safety)."
                        className="min-h-[80px] w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950 text-stone-900 dark:text-stone-50"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Proof of Work Photo URL (Optional)</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                        <input
                          type="url"
                          value={evidenceUrl}
                          onChange={(e) => setEvidenceUrl(e.target.value)}
                          placeholder="https://... (photo URL)"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950 text-stone-900 dark:text-stone-50"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMarkResolved(selectedGrievance.id)}
                      disabled={isUpdating || !resolutionNote.trim()}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark Resolved (Send Citizen Verification Request)
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950">
                    <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
                    Case status is <strong className="text-stone-800 dark:text-stone-200">{selectedGrievance.status.replace('_', ' ')}</strong>. Awaiting citizen verification input.
                  </div>
                )}
              </div>

              {/* Case History Timeline */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Case History Log</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedGrievance.timeline.map((item, idx) => {
                    const isOfficerEntry = item.updatedBy.startsWith('🛡');
                    return (
                      <div key={idx} className={`rounded-lg p-2.5 text-[11px] ${
                        isOfficerEntry
                          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-200'
                          : 'bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400'
                      }`}>
                        <div className="flex justify-between font-bold text-stone-900 dark:text-stone-200">
                          <span className="flex items-center gap-1.5">
                            {isOfficerEntry && <Shield className="h-3 w-3 text-blue-500" />}
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-stone-400">{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-1">{item.note}</p>
                        <p className="mt-0.5 text-[9px] text-stone-400">By: {item.updatedBy}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'clusters' && selectedCluster && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 text-left space-y-5">
              
              <div className="border-b border-stone-200 pb-4 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Cluster Action Workspace</span>
                <h3 className="mt-1 font-bold text-base text-stone-900 dark:text-white leading-snug">
                  {selectedCluster.title}
                </h3>
              </div>

              {/* AI Recommendation Box */}
              <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/60 p-4 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200 space-y-2">
                <h4 className="font-bold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI Clustering Diagnostic
                </h4>
                <p className="leading-relaxed">
                  &quot;Multiple citizen reports indicate a probable common infrastructure root cause. Dispatching a single field crew to the primary Ward hub resolves all linked reports simultaneously.&quot;
                </p>
              </div>

              {/* Cluster Dispatch Button */}
              <button
                onClick={() => {
                  const officerName = user?.user_metadata?.name || user?.email || 'Officer';
                  grievances.forEach((g) => {
                    if (g.clusterId === selectedCluster.id) {
                      updateStatus(g.id, 'WORK_STARTED', 'Dispatched unified cluster infrastructure repair crew.', officerName);
                    }
                  });
                  setActionSuccessMsg(`Dispatched unified repair crew for ${selectedCluster.title}!`);
                  setTimeout(() => setActionSuccessMsg(''), 4000);
                }}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-purple-700 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Assign Unified Cluster Repair Team
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}