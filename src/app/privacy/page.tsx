'use client';

import React from 'react';
import { Shield, EyeOff, Lock, Trash2, MapPin } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-stone-850 dark:text-stone-100 flex-1 w-full space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy by Design Policy</h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold font-mono">Core data governance & citizen protections on Nagrik Setu</p>
      </div>

      <div className="prose dark:prose-invert text-stone-600 dark:text-stone-400 space-y-6 text-sm leading-relaxed">
        
        <p className="text-base font-medium text-stone-800 dark:text-stone-200">
          Nagrik Setu was designed from the ground up to respect citizen privacy. Unlike traditional governmental portals that require heavy identity verification, we enforce a strict **Data Minimization Policy** to prevent surveillance and security compromises.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          
          <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-3">
            <Lock className="h-6 w-6 text-blue-600" />
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">No Sensitive Identifiers</h3>
            <p className="text-xs">
              Nagrik Setu **never asks for, stores, or verifies** actual Aadhaar numbers, PAN cards, bank passwords, or tax certificates. We only require you to declare whether a document is available to calculate readiness.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-3">
            <EyeOff className="h-6 w-6 text-purple-600" />
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">Full Reporter Anonymity</h3>
            <p className="text-xs">
              Citizens can toggle **Anonymous Reporting** for any grievance. When selected, the complaint is routed and visible on public maps, but your profile name is permanently masked from other community users.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-3">
            <MapPin className="h-6 w-6 text-amber-600" />
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">GPS Metadata Scrubbing</h3>
            <p className="text-xs">
              Any image evidence uploaded to support a complaint is programmatically processed to **strip all EXIF metadata**, including exact GPS coordinates, camera model, and timestamp.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl space-y-3">
            <Trash2 className="h-6 w-6 text-red-650" />
            <h3 className="font-bold text-stone-900 dark:text-white text-sm">Local Storage Encapsulation</h3>
            <p className="text-xs">
              All questionnaire settings, text sizes, and language parameters are **persisted locally in your browser sandbox**. We do not track or sell tracking parameters to third party agencies.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
