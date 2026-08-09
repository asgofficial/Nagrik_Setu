'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { localization } from '../utils/translations';
import { Sparkles, FileSearch, AlertCircle, Map, Shield, BarChart3, CheckCircle2, ArrowRight, UserCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

import { motion } from 'framer-motion';

export default function Home() {
  const { language } = useApp();
  const t = localization[language];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 civic-ambient-bg">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-100/40 dark:bg-amber-950/10 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/30 dark:bg-orange-950/10 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-900 text-xs font-bold text-orange-600 dark:text-orange-300 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Nagrik Setu • LIVING CIVIC INTELLIGENCE PLATFORM</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-tight"
              >
                {t.heroTitle1} <br className="hidden sm:inline"/>
                <span className="text-primary">{t.heroTitle2}</span> <br/>
                {t.heroTitle3} <br className="hidden sm:inline"/>
                <span className="text-primary">{t.heroTitle4}</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed"
              >
                {t.heroDescription}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 pt-4"
              >
                <Link
                  href="/benefits/check"
                  className="interactive-card card-sweep flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
                >
                  <FileSearch className="h-5 w-5" />
                  <span>{t.findBenefitsCTA}</span>
                </Link>
                <Link
                  href="/report"
                  className="interactive-card card-sweep flex items-center justify-center gap-2 bg-white dark:bg-stone-900 hover:bg-stone-100 border border-stone-200 dark:border-stone-850 text-stone-700 dark:text-stone-300 font-bold px-6 py-3.5 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer active:scale-98"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span>{t.reportIssueCTA}</span>
                </Link>
                <Link
                  href="/map"
                  className="flex items-center justify-center gap-2 text-stone-500 hover:text-stone-950 dark:hover:text-stone-100 font-semibold px-4 py-3.5 transition text-sm"
                >
                  <span>{t.exploreMapCTA}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Product Visualization */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-[420px] aspect-square rounded-3xl bg-gradient-to-tr from-stone-200 to-stone-100 dark:from-stone-900 dark:to-stone-850 p-4 border border-stone-200 dark:border-stone-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Visual Map Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] dark:bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* Floating Card 1: Benefit Opportunities */}
                <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-stone-150 dark:border-stone-800 self-start z-10 w-[75%] transform -rotate-2 hover:rotate-0 transition duration-300">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/80 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Nagrik Setu Welfare</p>
                      <p className="text-xs font-bold text-stone-850 dark:text-white">3 High-Priority Benefits Found</p>
                      <p className="text-[11px] text-emerald-600 font-extrabold mt-0.5">Est. Value: ₹36,000/year</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: Cluster Alert */}
                <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-stone-150 dark:border-stone-800 self-center z-10 w-[78%] transform rotate-1 hover:rotate-0 transition duration-300">
                  <div className="flex gap-2.5 items-center">
                    <div className="p-1.5 bg-purple-50 dark:bg-purple-950/80 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                      <Shield className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Cluster Detected</p>
                      <p className="text-xs font-bold text-stone-850 dark:text-white">15 Streetlight Complaints</p>
                      <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-purple-500 h-full w-[85%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3: Civic Health Score */}
                <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-stone-150 dark:border-stone-800 self-end z-10 w-[72%] transform -rotate-1 hover:rotate-0 transition duration-300">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Ward 12 Score</span>
                      <span className="text-xs font-bold text-stone-800 dark:text-white">Needs Attention</span>
                    </div>
                    <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-red-500 text-red-500 font-extrabold text-sm bg-red-50/50 dark:bg-red-950/20">
                      42
                    </div>
                  </div>
                </div>

                {/* Floating Card 4: Verified Badge */}
                <div className="absolute top-[35%] right-[5%] bg-emerald-500 text-white p-2 rounded-full shadow-lg z-20 flex items-center gap-1 text-[10px] font-bold transform rotate-6 border-2 border-white">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-white text-emerald-500" />
                  <span>Verified by Public ✓</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. LIVE IMPACT STRIP */}
      <section className="bg-white dark:bg-stone-900 border-y border-stone-200 dark:border-stone-850 py-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">12,480+</p>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t.citizensAssisted}</p>
            </div>

            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-primary">₹2.4 Cr</p>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t.potentialBenefits}</p>
            </div>

            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">3,842</p>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t.issuesReported}</p>
            </div>

            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">78%</p>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t.verifiedResolution}</p>
            </div>

          </div>

          <div className="flex justify-center items-center mt-6">
            <span className="inline-block px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-400 tracking-wide uppercase border">
              ⚠️ {t.demoData}
            </span>
          </div>

        </div>
      </section>

      {/* 3. HOW JANSETU WORKS */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">{t.howItWorks}</h2>
            <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-bold">Two pathways powered by CivicTwin Intelligence</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Welfare Journey Pathway */}
            <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-850 shadow-xs relative">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2 border-b pb-3">
                <FileSearch className="h-5 w-5 text-blue-600" />
                <span>{t.welfareJourney}</span>
              </h3>
              
              <div className="space-y-6 relative">
                {/* Timeline vertical bar */}
                <div className="absolute top-2 bottom-2 left-4 w-0.5 bg-blue-100 dark:bg-blue-900" />

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.wStep1}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Build a private, lightweight demographic profile. No Aadhaar number required.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.wStep2}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Local algorithms evaluate eligibility criteria guidelines dynamically.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.wStep3}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Discover missing benefits sorted by match confidence, deadline, and annual value.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">4</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.wStep4}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Check document checklist (Available / Missing) to evaluate readiness.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">5</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.wStep5}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Follow instructions, obtain missing certificates, and apply with ease.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Civic Journey Pathway */}
            <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-850 shadow-xs relative">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2 border-b pb-3">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <span>{t.civicJourney}</span>
              </h3>
              
              <div className="space-y-6 relative">
                {/* Timeline vertical bar */}
                <div className="absolute top-2 bottom-2 left-4 w-0.5 bg-purple-100 dark:bg-purple-900" />

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.cStep1}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Report local issues (like broken streetlights or leakages) in under 60 seconds.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.cStep2}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">AI engine classifies category, severity, and routes it to local departments.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.cStep3}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Overlapping complaints within 220m merge into active community clusters.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-xs">4</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.cStep4} / {t.cStep5}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Ticket assigned to repair crews; SLA response timers start ticking publicly.</p>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-xs">6</span>
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">{t.cStep6}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Resolutions remain open until citizens verify whether the problem is fixed.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BEFORE/AFTER STORY SECTION */}
      <section className="bg-white dark:bg-stone-900 border-y border-stone-200 dark:border-stone-850 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">A Paradigm Shift in Civic Tech</h2>
            <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-bold">Why Nagrik Setu differs from generic government portals</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left text-xs leading-relaxed">
            
            {/* Compare 1: Welfare */}
            <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-6">
              <h3 className="font-bold text-sm text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileSearch className="h-4.5 w-4.5" />
                Welfare Discovery Comparison
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/40 space-y-2">
                  <h4 className="font-bold text-red-700 dark:text-red-400">Traditional Welfare</h4>
                  <ul className="space-y-1.5 list-disc pl-3 text-stone-500">
                    <li>Must know the exact name of the scheme</li>
                    <li>Manually search dozens of departments</li>
                    <li>Hard to interpret complex legal rules</li>
                    <li>Difficult to identify document gaps</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Nagrik Setu Method</h4>
                  <ul className="space-y-1.5 list-disc pl-3 text-stone-700 dark:text-stone-300">
                    <li>Describe profile details or speak via voice</li>
                    <li>Relevant benefits automatically discovered</li>
                    <li>Eligibility matches clearly explained</li>
                    <li>Checklists target only missing documents</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compare 2: Grievance */}
            <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-6">
              <h3 className="font-bold text-sm text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5" />
                Grievance Redressal Comparison
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/40 space-y-2">
                  <h4 className="font-bold text-red-700 dark:text-red-400">Traditional Portals</h4>
                  <ul className="space-y-1.5 list-disc pl-3 text-stone-500">
                    <li>15 citizens file 15 separate spam tickets</li>
                    <li>Duplicate investigations delay dispatch</li>
                    <li>Work closed without public confirmation</li>
                    <li>No local neighborhood health analysis</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Nagrik Setu Method</h4>
                  <ul className="space-y-1.5 list-disc pl-3 text-stone-700 dark:text-stone-300">
                    <li>15 citizens group into 1 civic cluster</li>
                    <li>AI groups community evidence together</li>
                    <li>Government resolutions verified by users</li>
                    <li>Ward health analytics guide budget plans</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. LANDING PAGE DIFFERENTIATION CARDS */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {t.notAnotherPortal}
            </h2>
            <p className="text-stone-500 mt-2 text-sm">Nagrik Setu transforms standard public complaints and eligibility checks into actionable, community-verified results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-4 hover:border-blue-300 transition duration-300 text-left">
              <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
                <FileSearch className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">{t.feature1Title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t.feature1Desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-4 hover:border-blue-300 transition duration-300 text-left">
              <div className="h-10 w-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">{t.feature2Title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t.feature2Desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-4 hover:border-blue-300 transition duration-300 text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">{t.feature3Title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t.feature3Desc}</p>
            </div>

          </div>

          {/* Wide Feature 4 */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-850 mt-8 hover:border-blue-300 transition duration-300 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-left">
            <div className="lg:col-span-2 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Geospatial Dashboard</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">{t.feature4Title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {t.feature4Desc} Nagrik Setu processes localized data arrays to compute Ward health indices, mapping trends, resolving response bottlenecks, and detecting structural corruption.
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Link
                href="/civic-health"
                className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-1.5 text-xs shadow-md cursor-pointer"
              >
                <span>Check Civic Health Wards</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 6. NARRATIVE BANNER SECTION */}
      <section className="bg-gradient-to-r from-amber-800 to-orange-600 text-white py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          
          <div className="text-center font-bold uppercase text-[11px] tracking-widest text-blue-200 flex justify-center items-center gap-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-400" />
            <span>COMMUNITY GOVERNANCE PARADIGM</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            “A complaint isn't resolved because a dashboard says so. <br className="hidden sm:inline"/>
            It's resolved when the <span className="text-amber-300">community</span> says the problem is fixed.”
          </h2>

          <div className="h-px bg-blue-700/60 w-36 mx-auto my-6" />

          <p className="text-lg sm:text-xl text-blue-100 font-medium">
            “Citizens shouldn't have to know the name of a scheme <br className="hidden sm:inline"/>
            to receive the benefits they deserve.”
          </p>

          <div className="pt-6">
            <Link
              href="/benefits/check"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-6 py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
