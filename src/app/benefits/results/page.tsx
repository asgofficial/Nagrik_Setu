'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { calculateEligibility, getSchemeById } from '../../../services/schemeService';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, Info, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function BenefitsResults() {
  const { citizenProfile } = useApp();
  
  // Calculate matches dynamically using the service based on profile state
  const matches = calculateEligibility(citizenProfile);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Calculate snapshot metrics
  const totalSchemes = matches.length;
  const highPriority = matches.filter(m => m.priority === 'high').length;
  const totalValue = matches.reduce((sum, m) => {
    const s = getSchemeById(m.schemeId);
    return sum + (s ? s.estimatedAnnualValue : 0);
  }, 0);
  const avgReadiness = totalSchemes > 0
    ? Math.round(matches.reduce((sum, m) => sum + m.applicationReadiness, 0) / totalSchemes)
    : 0;

  const toggleExplanation = (schemeId: string) => {
    setExpandedMatchId(prev => prev === schemeId ? null : schemeId);
  };

  if (totalSchemes === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-stone-850 dark:text-stone-100 flex-1 flex flex-col justify-center items-center">
        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-full mb-4">
          <HelpCircle className="h-12 w-12 text-stone-400" />
        </div>
        <h2 className="text-2xl font-bold">No Confident Matches Found</h2>
        <p className="text-sm text-stone-500 mt-2 max-w-sm">We couldn\'t identify any confident benefit matches based on the demographic inputs you provided.</p>
        <Link
          href="/benefits/check"
          className="mt-6 bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md"
        >
          Review Demo Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full">
      
      {/* Page Header */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Benefit Snapshot</h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Gap analysis results based on your profile inputs</p>
      </div>

      {/* Snapshot Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Potential Schemes</p>
          <p className="text-3xl font-black text-stone-900 dark:text-white mt-1">{totalSchemes}</p>
          <span className="text-[10px] font-semibold text-stone-400 block mt-2">Likely eligible matches</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">High-Priority Matches</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{highPriority}</p>
          <span className="text-[10px] font-semibold text-stone-400 block mt-2">Unclaimed high-value grants</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Est. Value (Demo)</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">₹{totalValue.toLocaleString()}<span className="text-xs font-normal">/yr</span></p>
          <span className="text-[10px] font-bold text-amber-500 block mt-2">Simulation estimate</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Application Readiness</p>
          <p className="text-3xl font-black text-stone-900 dark:text-white mt-1">{avgReadiness}%</p>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${avgReadiness}%` }} />
          </div>
        </div>

      </div>

      {/* Main Matching Schemes list */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white mb-4">Benefits You May Be Missing</h2>
        
        {matches.map(match => {
          const scheme = getSchemeById(match.schemeId);
          if (!scheme) return null;

          const isExpanded = expandedMatchId === scheme.id;
          const documentsReadyCount = scheme.requiredDocuments.length - match.missingDocuments.length;

          return (
            <div
              key={scheme.id}
              className={`bg-white dark:bg-stone-900 border rounded-2xl transition shadow-xs overflow-hidden ${
                match.priority === 'high'
                  ? 'border-blue-200 dark:border-blue-900 ring-1 ring-blue-100 dark:ring-blue-950/20'
                  : 'border-stone-200 dark:border-stone-850'
              }`}
            >
              <div className="p-6">
                
                {/* Badge Header Row */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded">
                      {scheme.governmentLevel} Govt
                    </span>
                    <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                      {scheme.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-400">Match confidence:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      match.confidence >= 80 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                    }`}>
                      {match.confidence}% match
                    </span>
                  </div>
                </div>

                {/* Scheme Name and Description */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 space-y-2 text-left">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-snug">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
                      {scheme.description}
                    </p>

                    {/* Department */}
                    <p className="text-[10px] text-stone-400 font-medium pt-1">
                      Department: {scheme.department}
                    </p>
                  </div>

                  {/* Benefit details card */}
                  <div className="lg:col-span-4 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-150 dark:border-stone-850 flex flex-col justify-between h-full min-h-[100px]">
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Estimated Benefit</span>
                      <span className="text-sm font-extrabold text-stone-800 dark:text-white mt-1 block">{scheme.benefit}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 mt-2 block">
                      Est. Value: ₹{scheme.estimatedAnnualValue.toLocaleString()}/year
                    </span>
                  </div>
                </div>

                {/* Documents & Progress section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-stone-100 dark:border-stone-800 pt-4 mt-6">
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-500">Application Readiness</span>
                      <span className="text-stone-800 dark:text-stone-200">{match.applicationReadiness}%</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full transition-all duration-500 ${
                          match.applicationReadiness >= 80 ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${match.applicationReadiness}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium block mt-1">
                      {documentsReadyCount} of {scheme.requiredDocuments.length} required documents available
                    </span>
                  </div>

                  {/* Documents count and missing ones */}
                  <div className="text-xs text-left">
                    <span className="font-bold text-stone-500 block mb-1">Documentation Check:</span>
                    {match.missingDocuments.length === 0 ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="h-4 w-4" /> All documents ready for application!
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing {match.missingDocuments.length} document{match.missingDocuments.length > 1 ? 's' : ''}:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {match.missingDocuments.map(docId => (
                            <span key={docId} className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded text-[9px] font-bold uppercase tracking-wider">
                              {docId.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Why do I match & View buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 gap-4">
                  
                  <button
                    onClick={() => toggleExplanation(scheme.id)}
                    className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Match Details' : 'Why do I match?'}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Link
                      href={`/schemes/${scheme.id}`}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition text-center flex-1 sm:flex-initial"
                    >
                      View Scheme Guidelines
                    </Link>
                    <Link
                      href={`/schemes/${scheme.id}#prepare`}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-blue-600 text-white shadow-xs transition text-center flex-1 sm:flex-initial"
                    >
                      Prepare Application
                    </Link>
                  </div>

                </div>

                {/* Explanations audit log */}
                {isExpanded && (
                  <div className="mt-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 space-y-3 text-xs text-stone-600 dark:text-stone-400">
                    <h4 className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      Why is this scheme recommended?
                    </h4>
                    
                    <ul className="space-y-2 text-left font-semibold text-[11px]">
                      {match.matchReason.map((reason, index) => {
                        const isMatch = reason.includes('✓');
                        return (
                          <li key={index} className={`flex items-start gap-1.5 ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <span className="text-sm select-none leading-none">{isMatch ? '✓' : '•'}</span>
                            <span>{reason.replace('✓', '').trim()}</span>
                          </li>
                        );
                      })}
                      {match.missingDocuments.map(docId => (
                        <li key={docId} className="flex items-start gap-1.5 text-amber-600 font-bold">
                          <span className="text-sm select-none leading-none">⚠</span>
                          <span>{docId.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} certificate still required</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="text-[10px] text-stone-400 pt-2.5 border-t border-stone-200/40 dark:border-stone-800 mt-3 leading-relaxed">
                      *AI Match Advisory: This is a {match.confidence}% match estimate based on your profile. Final check will be verified against official criteria.
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
