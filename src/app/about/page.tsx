'use client';

import React from 'react';
import { translations } from '../../utils/translations';
import { useApp } from '../../context/AppContext';
import { Sparkles, Milestone, ShieldCheck, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  const { language } = useApp();
  const t = translations[language];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-stone-850 dark:text-stone-100 flex-1 w-full space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">About Nagrik Setu</h1>
      </div>

      <div className="prose dark:prose-invert text-stone-600 dark:text-stone-400 space-y-6 text-sm leading-relaxed">
        
        <p className="text-base font-semibold text-stone-800 dark:text-stone-250">
          Nagrik Setu —meaning "Bridge to the Citizens"—is an intelligent civic-technology application designed to connect citizens to public welfare benefits and streamline municipal grievance resolution.
        </p>

        <div className="space-y-4">
          <h2 className="font-extrabold text-stone-900 dark:text-white text-base flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            Our Three Signature Innovations
          </h2>

          <ul className="space-y-3 list-disc pl-4">
            <li>
              <strong>AI Benefit Gap Detector:</strong> Builds a lightweight citizen profile to dynamically estimate qualifying welfare schemes, highlighting missing paperwork rather than forcing manual searches.
            </li>
            <li>
              <strong>Civic Cluster Intelligence:</strong> Groups duplicate municipal complaints (e.g. streetlights or leaking water lines) within a 220m radius into single, community-level signals for administrative action.
            </li>
            <li>
              <strong>Citizen-Verified Resolution:</strong> Locks resolution updates, preventing departments from marking cases resolved without local community verification and dispute escalations.
            </li>
          </ul>
        </div>

        <div className="p-5 bg-stone-100 dark:bg-stone-900 border rounded-2xl space-y-3 mt-6">
          <p className="text-xs">
            Nagrik Setu is a sandbox prototype designed to demonstrate dynamic eligibility reasoning and duplicate complaint clustering under simulated network environments. It does not interface directly with active government offices, and monetary values represented are advisory estimates.
          </p>
        </div>

      </div>

    </div>
  );
}
