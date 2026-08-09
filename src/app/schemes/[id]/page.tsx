'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { getSchemeById, getDocumentById } from '../../../services/schemeService';
import { translations } from '../../../utils/translations';
import { Sparkles, ArrowLeft, CheckCircle2, XCircle, Info, Landmark, Calendar, FileText, ChevronRight, HelpCircle, Check, Loader2 } from 'lucide-react';

interface SchemeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SchemeDetailPage({ params }: SchemeDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const { citizenProfile, language } = useApp();
  const scheme = getSchemeById(id);

  const [isSaved, setIsSaved] = useState(false);
  const [appState, setAppState] = useState<'none' | 'preparing' | 'applied' | 'approved'>('none');
  const [activeDocHowTo, setActiveDocHowTo] = useState<string | null>(null);

  if (!scheme) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold">Scheme Not Found</h2>
        <p className="text-xs text-stone-500 mt-2">The requested scheme code does not exist in our seeded database.</p>
        <Link href="/benefits" className="text-primary hover:underline mt-4 inline-block text-sm">
          Return to Benefits
        </Link>
      </div>
    );
  }

  // Determine doc statuses
  const requiredDocs = scheme.requiredDocuments.map(docId => {
    const detail = getDocumentById(docId);
    const isAvailable = citizenProfile.documentsAvailable.includes(docId);
    return {
      id: docId,
      name: detail?.name || docId.replace('_', ' '),
      description: detail?.description || '',
      howToObtain: detail?.howToObtain || 'Contact local administrative office.',
      isAvailable
    };
  });

  const missingDocsCount = requiredDocs.filter(d => !d.isAvailable).length;
  const readiness = Math.round(((requiredDocs.length - missingDocsCount) / requiredDocs.length) * 100);

  const handlePrepare = () => {
    setAppState('preparing');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Starting application preparation. Generating checklist for " + scheme.name);
      window.speechSynthesis.speak(u);
    }
  };

  const handleSubmitSimulate = () => {
    setAppState('applied');
    setTimeout(() => {
      setAppState('approved');
      // Chime synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("Congratulations! Your simulated application for " + scheme.name + " has been approved in demo mode!");
        window.speechSynthesis.speak(u);
      }
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full">
      
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-850 dark:hover:text-stone-200 text-xs font-bold mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Results
      </button>

      {/* Header Profile Section */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Landmark className="h-3.5 w-3.5" />
            {scheme.governmentLevel} Government
          </span>
          <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2.5 py-1 rounded-md">
            {scheme.category}
          </span>
          {scheme.deadline && (
            <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Deadline: {scheme.deadline}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-tight">
          {scheme.name}
        </h1>

        <p className="text-xs text-stone-400 font-medium mt-1 leading-relaxed">
          Department: {scheme.department}
        </p>

        <p className="text-sm text-stone-600 dark:text-stone-400 mt-4 leading-relaxed">
          {scheme.description}
        </p>

        {/* Benefits summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
          <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-150 dark:border-stone-850">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Estimated Payout</span>
            <span className="text-base font-extrabold text-stone-800 dark:text-white mt-1 block">{scheme.benefit}</span>
          </div>
          <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-150 dark:border-stone-850">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Est. Annual Value (Demo)</span>
            <span className="text-base font-extrabold text-emerald-600 mt-1 block">₹{scheme.estimatedAnnualValue.toLocaleString()}/year</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`px-5 py-3 text-xs font-bold rounded-xl border transition ${
              isSaved
                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-600 dark:bg-emerald-950/20'
                : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
            }`}
          >
            {isSaved ? 'Scheme Saved ✓' : 'Save Scheme'}
          </button>
          
          {appState === 'none' && (
            <button
              onClick={handlePrepare}
              className="px-6 py-3 text-xs font-bold rounded-xl bg-primary hover:bg-blue-600 text-white shadow-xs transition cursor-pointer"
            >
              Prepare My Application
            </button>
          )}

          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 text-stone-600 dark:text-stone-400 text-center transition"
          >
            Official Government Portal ↗
          </a>
        </div>

      </div>

      {/* Main Grid: Checklist & Application Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Documentation Readiness Checklist */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">Required Documents</h3>
                <p className="text-xs text-stone-500">Documentation checklist matching your profile</p>
              </div>
              <span className="text-xs font-bold text-primary bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded">
                Readiness: {readiness}%
              </span>
            </div>

            <div className="space-y-4">
              {requiredDocs.map(doc => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-xl border transition ${
                    doc.isAvailable
                      ? 'border-emerald-100 bg-emerald-50/10 dark:border-emerald-950/30'
                      : 'border-red-100 bg-red-50/10 dark:border-red-950/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2.5 items-start">
                      <div className="mt-0.5 shrink-0">
                        {doc.isAvailable ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4.5 w-4.5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{doc.name}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">{doc.description}</p>
                      </div>
                    </div>

                    {!doc.isAvailable && (
                      <button
                        onClick={() => setActiveDocHowTo(activeDocHowTo === doc.id ? null : doc.id)}
                        className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="h-3 w-3" />
                        <span>Get Instructions</span>
                      </button>
                    )}
                  </div>

                  {/* Instruction Dropdown */}
                  {activeDocHowTo === doc.id && (
                    <div className="mt-3 p-3 bg-white dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-lg text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                      <p className="font-bold text-stone-800 dark:text-stone-200 mb-1">How to obtain:</p>
                      <p>{doc.howToObtain}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer advisory */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-950 border rounded-xl text-[10px] text-stone-400 leading-relaxed mt-6 flex items-start gap-2">
              <Info className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
              <span>Eligibility shown by Nagrik Setu is advisory guidance based on your profile checklist. Final eligibility and approvals are decided solely by official government offices.</span>
            </div>

          </div>

        </div>

        {/* Right Column: Step-by-Step Guideline & Preparation */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step list card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-4">Application Guidelines</h3>

            <div className="space-y-4">
              {scheme.applicationProcess.map((stepText, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-850 text-stone-500 font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {stepText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Preparation Box */}
          {appState !== 'none' && (
            <div className="bg-white dark:bg-stone-900 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 shadow-md relative overflow-hidden" id="prepare">
              {/* Top gradient border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <h3 className="font-bold text-base text-stone-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                Preparation Wizard (Demo)
              </h3>
              
              {appState === 'preparing' && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Ready to submit! Documents have been parsed successfully. Click below to submit this application in.
                  </p>

                  <div className="p-3 bg-stone-50 dark:bg-stone-950 border rounded-xl space-y-2">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-stone-400">Application File:</span>
                      <span className="text-stone-700 dark:text-stone-300">Amit_Das_Lakshmir_Bhandar.pdf</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-stone-400">Attached Docs:</span>
                      <span className="text-emerald-600">Aadhaar, Bank, Caste ✓</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitSimulate}
                    className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Submit Simulated Application
                  </button>
                </div>
              )}

              {appState === 'applied' && (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-stone-500">Transmitting encrypted file pack to Block Office...</p>
                </div>
              )}

              {appState === 'approved' && (
                <div className="space-y-4 pt-2 text-center flex flex-col items-center">
                  <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-600">Application Approved!</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Your demo application has been processed by the virtual block officer. Credits will be initialized soon.
                  </p>
                  <Link
                    href="/dashboard"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 mt-2"
                  >
                    <span>View in My Activity dashboard</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
