'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calculateEligibility, getSchemeById } from '../../services/schemeService';
import { translations } from '../../utils/translations';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Shield, ClipboardList, Map, Bell, Loader2, Lock } from 'lucide-react';

export default function DashboardPage() {
  const { citizenProfile, grievances, language } = useApp();
  const { user, role, isLoading } = useAuth();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'benefits' | 'grievances' | 'saved'>('benefits');

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Show auth required state
  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/80">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/50">
            <Lock className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">Sign in Required</h2>
          <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
            Please sign in to access your personal Nagrik Setu dashboard.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/auth/login?returnUrl=/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If officer/admin, redirect to authority portal
  if (role === 'officer' || role === 'admin') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/80">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/50">
            <Shield className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">You are an Officer</h2>
          <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
            As an officer, you have access to the Administrative Portal with advanced case management capabilities.
          </p>
          <Link
            href="/authority"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            Go to Officer Portal <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Get the real user's name from auth
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Citizen';
  const userId = user.id;

  // Compute values dynamically
  const matches = calculateEligibility(citizenProfile);
  // Filter grievances by the real logged-in user's ID OR the demo user ID for demo mode
  const myGrievances = grievances.filter(g => g.reporterId === userId);
  
  const totalValue = matches.reduce((sum, m) => {
    const s = getSchemeById(m.schemeId);
    return sum + (s ? s.estimatedAnnualValue : 0);
  }, 0);

  const resolvedCount = myGrievances.filter(g => g.status === 'CITIZEN_VERIFIED' || g.status === 'CLOSED').length;
  const activeAppPrep = matches.filter(m => m.applicationReadiness >= 75).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 text-stone-850 dark:text-stone-100 flex-1 w-full space-y-8">
      
      {/* 1. GREETING & METRICS SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{greeting}, {userName}</h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">
            Nagrik Setu Dashboard • {user.email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/benefits/check"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition"
          >
            Update Welfare Profile
          </Link>
          <Link
            href="/report"
            className="bg-white hover:bg-stone-50 border text-stone-750 dark:bg-stone-900 dark:hover:bg-stone-800 dark:text-stone-300 font-bold py-2.5 px-5 rounded-xl text-xs transition border-stone-250 dark:border-stone-800"
          >
            Report New Issue
          </Link>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Benefits Discovered</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">{matches.length}</p>
          <span className="text-[10px] font-semibold text-emerald-600 block mt-1.5">Est: ₹{totalValue.toLocaleString()}/year</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Applications Preparing</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{activeAppPrep}</p>
          <span className="text-[10px] font-semibold text-stone-400 block mt-1.5">&gt;75% Document Ready</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Civic Issues Reported</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">{myGrievances.length}</p>
          <span className="text-[10px] font-semibold text-stone-400 block mt-1.5">Your reported issues</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Resolved & Verified</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
          <span className="text-[10px] font-semibold text-stone-400 block mt-1.5">Closed tickets</span>
        </div>

      </div>

      {/* 2. TABS SELECTOR */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex gap-2">
        <button
          onClick={() => setActiveTab('benefits')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'benefits'
              ? 'border-orange-600 text-orange-600 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          Recommended Benefits ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('grievances')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'grievances'
              ? 'border-orange-600 text-orange-600 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          My Reported Issues ({myGrievances.length})
        </button>
      </div>

      {/* 3. DYNAMIC CONTENT RENDERING */}
      <div className="min-h-[300px]">
        
        {/* TAB 1: Benefits Recommended */}
        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.slice(0, 4).map(match => {
              const scheme = getSchemeById(match.schemeId);
              if (!scheme) return null;

              return (
                <div key={scheme.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-orange-300 transition text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        {scheme.category}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                        {match.confidence}% Match
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-white leading-snug">{scheme.name}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">{scheme.description}</p>
                    
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${match.applicationReadiness}%` }} />
                    </div>
                    <span className="text-[10px] text-stone-400 block font-medium">Readiness: {match.applicationReadiness}%</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-stone-100 dark:border-stone-800 pt-4 mt-5">
                    <span className="text-xs font-black text-stone-800 dark:text-stone-200">{scheme.benefit}</span>
                    <Link
                      href={`/schemes/${scheme.id}`}
                      className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>Prepare Application</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Reported Issues */}
        {activeTab === 'grievances' && (
          <div className="space-y-4">
            {myGrievances.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs space-y-4">
                <p>You have not filed any civic reports yet.</p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
                >
                  Report Your First Issue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              myGrievances.map(g => {
                // Color status badges
                let badgeStyle = 'bg-stone-50 text-stone-600 border';
                if (g.status === 'ASSIGNED') badgeStyle = 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/20';
                if (g.status === 'WORK_STARTED') badgeStyle = 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/20';
                if (g.status === 'AUTHORITY_RESOLVED') badgeStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 animate-pulse';
                if (g.status === 'CITIZEN_VERIFIED' || g.status === 'CLOSED') badgeStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
                if (g.status === 'RESOLUTION_DISPUTED') badgeStyle = 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20';

                return (
                  <div key={g.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-bold font-mono">{g.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${badgeStyle}`}>
                          {g.status.replace('_', ' ')}
                        </span>
                        {g.clusterId && (
                          <span className="bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-300 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase">
                            Clustered
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-white mt-1 leading-snug">{g.title}</h3>
                      <p className="text-[11px] text-stone-400">Landmark: {g.landmark || 'Not specified'} • Reported on: {new Date(g.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex gap-2 items-center self-end sm:self-center shrink-0">
                      {g.status === 'AUTHORITY_RESOLVED' && (
                        <span className="text-[10px] text-red-500 font-bold animate-pulse px-2 py-1 bg-red-50 rounded-md border mr-1">
                          Action Required: Verify Fix
                        </span>
                      )}
                      
                      <Link
                        href={`/grievances/${g.id}`}
                        className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Track Timeline</span>
                        <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
}
