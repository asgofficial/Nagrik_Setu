'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { getGrievanceById, DEPARTMENTS } from '../../../services/grievanceService';
import { translations } from '../../../utils/translations';
import { Sparkles, ArrowLeft, Check, X, Shield, Clock, Users, MapPin, AlertCircle, AlertTriangle, CheckCircle2, Send, Loader2 } from 'lucide-react';

interface GrievanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GrievanceDetailPage({ params }: GrievanceDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { grievances, verifyComplaintResolution, activeUser } = useApp();
  const grievance = grievances.find(g => g.id === id);

  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!grievance) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold">Grievance Report Not Found</h2>
        <p className="text-xs text-stone-500 mt-2">The requested complaint code does not exist in our database.</p>
        <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const dept = DEPARTMENTS.find(d => d.id === grievance.authorityId);

  // Workflow steps list to map timeline status
  const workflowSteps = [
    { key: 'REPORTED', label: 'Reported' },
    { key: 'AI_CLASSIFIED', label: 'AI Classified' },
    { key: 'VERIFIED', label: 'Verified' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'WORK_STARTED', label: 'Work Started' },
    { key: 'AUTHORITY_RESOLVED', label: 'Marked Resolved by Authority' },
    { key: 'CITIZEN_VERIFIED', label: 'Citizen Verified' },
    { key: 'CLOSED', label: 'Case Closed' }
  ];

  // Helper to determine step status
  const getStepStatus = (stepKey: string) => {
    const statusOrder = [
      'REPORTED',
      'AI_CLASSIFIED',
      'VERIFIED',
      'ASSIGNED',
      'WORK_STARTED',
      'AUTHORITY_RESOLVED',
      'CITIZEN_VERIFIED',
      'CLOSED'
    ];

    const currentIdx = statusOrder.indexOf(grievance.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (grievance.status === 'RESOLUTION_DISPUTED') {
      if (stepKey === 'CITIZEN_VERIFIED' || stepKey === 'CLOSED') return 'pending';
      return 'completed';
    }

    if (stepIdx === -1) return 'pending';
    if (stepIdx <= currentIdx) return 'completed';
    if (stepIdx === currentIdx + 1) return 'current';
    return 'pending';
  };

  const handleVerification = (isSatisfied: boolean) => {
    setIsSubmittingFeedback(true);
    
    // Simulate API delay
    setTimeout(() => {
      verifyComplaintResolution(grievance.id, isSatisfied, feedbackNote || (isSatisfied ? 'Resolved perfectly.' : 'The problem still exists. Lights are still dark.'));
      setIsSubmittingFeedback(false);
      setFeedbackSubmitted(true);
      setFeedbackNote('');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full space-y-8">
      
      {/* Back CTA */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-855 dark:hover:text-stone-200 text-xs font-bold mb-4 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* 1. OVERVIEW SUMMARY CARD */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs relative">
        {grievance.isEscalated && (
          <div className="absolute top-0 right-0 transform translate-x-0 -translate-y-2.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
            Escalated SLA Breach
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
          <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-1 rounded-md">
            ID: {grievance.id}
          </span>
          <span className={`px-2.5 py-1 rounded-md uppercase ${
            grievance.severity === 'HIGH' || grievance.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-stone-100 text-stone-500'
          }`}>
            {grievance.severity} Severity
          </span>
          <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-md">
            {grievance.category}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-tight">
          {grievance.title}
        </h1>

        <p className="text-xs text-stone-500 mt-4 leading-relaxed">
          {grievance.description}
        </p>

        {/* Why is this HIGH priority? (Explainability block) */}
        {grievance.category === 'Electricity' && grievance.severity === 'HIGH' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 space-y-2 text-left">
            <h4 className="font-extrabold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Why is this grievance HIGH priority?
            </h4>
            <ul className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 space-y-1 pl-1">
              <li className="flex items-center gap-1.5">• 15 related reports grouped in Ward 12</li>
              <li className="flex items-center gap-1.5">• Unresolved for multiple days (SLA threshold reached)</li>
              <li className="flex items-center gap-1.5">• Affects key public infrastructure (electrical grid)</li>
              <li className="flex items-center gap-1.5">• Nighttime citizen safety & street security implications</li>
              <li className="flex items-center gap-1.5">• 38 neighborhood citizen confirmations detected</li>
            </ul>
          </div>
        )}

        {/* Location & Department row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 text-xs">
          
          <div className="flex gap-2">
            <MapPin className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-400 font-bold block uppercase text-[9px] tracking-wider">Location Landmark</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block mt-0.5">{grievance.landmark || 'Ward 12 coordinates'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Shield className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-400 font-bold block uppercase text-[9px] tracking-wider">Routing Authority</span>
              <span className="font-semibold text-stone-850 dark:text-stone-200 block mt-0.5">{dept?.name || 'Local Municipal Board'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Users className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-stone-400 font-bold block uppercase text-[9px] tracking-wider">Citizens Affected</span>
              <span className="font-semibold text-stone-850 dark:text-stone-200 block mt-0.5">{grievance.citizenConfirmations} Confirmations</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. CITIZEN RESOLUTION VERIFICATION PANEL */}
      {grievance.status === 'AUTHORITY_RESOLVED' && (
        <div className="bg-white dark:bg-stone-900 border-3 border-amber-400 rounded-2xl p-6 shadow-xl relative overflow-hidden text-left space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest font-mono">Verification Request</p>
              <p className="text-xs font-bold text-stone-900 dark:text-white mt-1">The authority says this problem has been resolved.</p>
              <h3 className="font-black text-lg text-primary mt-2">Is the streetlight actually working now?</h3>
            </div>
          </div>

          {/* Officer comment details */}
          <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 rounded-xl space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            <p className="font-bold text-stone-850 dark:text-stone-250">Authority Resolution Note:</p>
            <p>"{grievance.timeline[grievance.timeline.length - 1]?.note}"</p>
            {grievance.timeline[grievance.timeline.length - 1]?.evidenceUrl && (
              <a
                href={grievance.timeline[grievance.timeline.length - 1].evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline font-bold mt-1.5 inline-block"
              >
                View Repair Photograph proof ↗
              </a>
            )}
          </div>

          {/* Feedback Notes input */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Verification Comment (Optional)</span>
            <input
              type="text"
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Lights are shining bright / No, it remains completely dark..."
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-250 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden text-stone-950 dark:text-stone-550"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleVerification(true)}
              disabled={isSubmittingFeedback}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Yes, it's fixed ✓</span>
            </button>
            <button
              onClick={() => handleVerification(false)}
              disabled={isSubmittingFeedback}
              className="flex-1 bg-white hover:bg-stone-50 border border-red-200 text-red-650 dark:bg-stone-900 dark:hover:bg-stone-850 dark:text-red-400 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              <span>No, the problem still exists</span>
            </button>
          </div>
        </div>
      )}

      {/* Case 3: Resolution disputed warning */}
      {grievance.status === 'RESOLUTION_DISPUTED' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-800 dark:text-red-300 rounded-2xl text-xs space-y-1.5 text-left">
          <h4 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5" />
            Resolution Disputed - Reopened & Escalated
          </h4>
          <p className="leading-relaxed">
            The citizen disputed the resolution claiming that the issue persists. Nagrik Setu has automatically reopened this ticket, escalated it to **{grievance.escalatedTo || 'Deputy Commissioner'}**, and reset the priority SLA countdown.
          </p>
        </div>
      )}

      {/* Case 4: Closed success banner */}
      {(grievance.status === 'CITIZEN_VERIFIED' || grievance.status === 'CLOSED') && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs space-y-1 flex items-start gap-3 text-left">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-700 dark:text-emerald-300">Case Verified and Closed</h4>
            <p className="mt-0.5 leading-relaxed">
              This grievance has been successfully resolved and closed. Citizen confirmation rate for this Ward has increased. Thank you for participating in community governance!
            </p>
          </div>
        </div>
      )}

      {/* 3. VERTICAL TIMELINE LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column Timeline chart */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs text-left">
          <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-6">Workflow Progress Timeline</h3>

          <div className="space-y-8 relative">
            {/* Timeline vertical bar */}
            <div className="absolute top-2 bottom-2 left-4.5 w-0.5 bg-stone-200 dark:bg-stone-800" />

            {workflowSteps.map((step, idx) => {
              const status = getStepStatus(step.key);
              
              // Custom colors based on status
              let dotColor = 'bg-stone-200 dark:bg-stone-800 text-stone-400';
              let lineAccent = '';

              if (status === 'completed') {
                dotColor = 'bg-emerald-500 text-white shadow-emerald-100 shadow-sm';
              } else if (status === 'current') {
                dotColor = 'bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950/50 animate-pulse';
                lineAccent = 'font-bold text-primary';
              }

              // Match corresponding timeline activity logs
              const relatedLog = grievance.timeline.find(log => log.status === step.key);

              return (
                <div key={step.key} className="flex gap-4 relative z-10">
                  
                  {/* Dot */}
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${dotColor}`}>
                    {status === 'completed' ? <Check className="h-4 w-4" /> : idx + 1}
                  </span>

                  {/* Log description info */}
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold text-stone-800 dark:text-stone-200 ${lineAccent}`}>
                      {step.label}
                    </h4>
                    
                    {relatedLog ? (
                      <div className="mt-1 space-y-1 text-[11px] text-stone-500">
                        <p className="leading-relaxed">"{relatedLog.note}"</p>
                        <div className="flex gap-3 text-[10px] text-stone-400 mt-1 font-medium">
                          <span>Updated by: {relatedLog.updatedBy}</span>
                          <span>•</span>
                          <span>{new Date(relatedLog.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400 mt-1 italic">Pending completion...</p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Public Safe Transparency Log */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs text-left">
            <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-4">Audit Logs</h3>
            <p className="text-[10px] text-stone-400 leading-relaxed mb-4">
              Nagrik Setu maintains a ledger history of all status changes for audit validation.
            </p>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {grievance.timeline.map((log, idx) => (
                <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-150 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold">
                    <span>{log.status.replace('_', ' ')}</span>
                    <span>{new Date(log.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed mt-1">"{log.note}"</p>
                  <p className="text-[9px] text-stone-400 mt-1">Source: {log.updatedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
