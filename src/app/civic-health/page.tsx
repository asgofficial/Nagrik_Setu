'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getScoreExplanation } from '../../services/civicHealthService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { translations } from '../../utils/translations';
import { Shield, Sparkles, AlertTriangle, BarChart3, HelpCircle, ArrowRight, Activity, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

export default function CivicHealthPage() {
  const { wards, language } = useApp();
  const t = translations[language];

  const [activeWardId, setActiveWardId] = useState<string>('ward-12');
  const [showFormula, setShowFormula] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Recharts needs browser mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeWard = wards.find(w => w.id === activeWardId) || wards[0];
  const factors = getScoreExplanation(activeWard.healthScore);

  // 1. Data format for Recharts Bar Chart (avg resolution days per ward)
  const barData = wards.map(w => ({
    name: w.name.split(' ')[1] || w.name,
    'Resolution Days': w.contributingFactors.avgResolutionDays,
    score: w.healthScore
  }));

  // 2. Data format for Recharts Pie Chart (complaints by category in active ward)
  const pieData = [
    { name: 'Waste Management', value: activeWard.contributingFactors.wasteComplaints, color: '#10b981' },
    { name: 'Water Leakage', value: activeWard.contributingFactors.waterComplaints, color: '#3b82f6' },
    { name: 'Road Infrastructure', value: activeWard.contributingFactors.roadComplaints, color: '#78716c' },
    { name: 'Electrical/Lighting', value: activeWardId === 'ward-12' ? 15 : activeWardId === 'ward-8' ? 5 : 2, color: '#f59e0b' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full space-y-8">
      
      {/* Page Header */}
      <div className="mb-6 border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Civic Health Indicator Index</h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Aggregated geospatial metrics assessing municipal performance Wards</p>
        </div>
        
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 px-4.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
        >
          <HelpCircle className="h-4.5 w-4.5 text-primary" />
          <span>How is this calculated?</span>
        </button>
      </div>

      {/* Dynamic Formula calculation breakdown */}
      {showFormula && (
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-primary/40 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            Explainable Civic Health Score Algorithm
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            The Civic Health Score is a normalized index from **0 to 100** computed dynamically based on the following weighted indicators. Lower scores indicate severe municipal deprivation requiring administrative intervention.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {factors.map(f => (
              <div key={f.factor} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-150 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase">{f.factor.split(' ')[0]}</span>
                  <span className="text-xs font-black text-primary">{f.weight}</span>
                </div>
                <h4 className="font-bold text-xs text-stone-850 dark:text-stone-200">{f.factor}</h4>
                <p className="text-[10px] text-stone-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-stone-400 border-t pt-3 flex justify-between">
            <span>{"Formula: \\(Score = 100 - (\\text{Volume Penalty} \\times 0.3) - (\\text{SLA delay} \\times 0.25) + (\\text{Verification Bonus} \\times 0.25)\\)"}</span>
            <span>Estimated Ward Metrics</span>
          </div>
        </div>
      )}

      {/* Main Ward Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {wards.map(ward => {
          const isActive = ward.id === activeWardId;
          
          let healthColor = 'text-emerald-500 border-emerald-200';
          if (ward.healthScore < 50) healthColor = 'text-red-500 border-red-200';
          else if (ward.healthScore < 70) healthColor = 'text-amber-500 border-amber-200';

          return (
            <button
              key={ward.id}
              onClick={() => setActiveWardId(ward.id)}
              className={`p-5 rounded-2xl border text-left transition shadow-xs flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-stone-900 border-primary ring-2 ring-blue-100 dark:ring-blue-950/30'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/50'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[10px] font-bold text-stone-400 uppercase">{ward.borough}</span>
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${healthColor}`}>
                  {ward.status}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-stone-850 dark:text-white mt-4 truncate max-w-full">
                {ward.name}
              </h3>

              <div className="flex justify-between items-baseline mt-4 w-full border-t border-stone-100 dark:border-stone-800 pt-3">
                <span className="text-[10px] text-stone-400 font-semibold">Health Score:</span>
                <span className="text-2xl font-black">{ward.healthScore}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Analysis of Active Ward */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Contributing indicators & list */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-4 flex justify-between items-center">
              <span>{activeWard.name} Status Matrix</span>
              <span className="text-xs font-semibold text-stone-400">{activeWard.borough}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-150">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Open Complaints</span>
                <span className="text-xl font-extrabold mt-1 block">{activeWard.contributingFactors.openComplaints}</span>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-150">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Avg Resolution Time</span>
                <span className="text-xl font-extrabold mt-1 block">{activeWard.contributingFactors.avgResolutionDays} Days</span>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-150 col-span-2">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-stone-400 uppercase text-[10px] tracking-wider">Citizen Verification Rate</span>
                  <span className="text-emerald-600">{activeWard.contributingFactors.citizenVerificationRate}% confirmed</span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-emerald-500 h-full" style={{ width: `${activeWard.contributingFactors.citizenVerificationRate}%` }} />
                </div>
              </div>
            </div>

            {/* Warn box if health is low */}
            {activeWard.healthScore < 50 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-150 rounded-xl mt-6 flex items-start gap-2.5 text-red-800 dark:text-red-300">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Administrative Alert: SLA Breach Risk</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    This Ward has an average resolution delay of **{activeWard.contributingFactors.avgResolutionDays} days**, triggering automated system escalations to the Zone Deputy Commissioner.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Charts & visual indicators */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs flex flex-col min-h-[300px]">
            <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-4">
              Complaint Categories in {activeWard.name.split(' ')[1]}
            </h3>
            
            <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
              {isClient ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Complaints`, 'Volume']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 w-44 rounded-full border border-dashed flex items-center justify-center text-[10px] text-stone-400">
                  Loading Chart...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row comparative resolution speeds */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-base text-stone-900 dark:text-white border-b pb-4 mb-4">
          Comparative Average Resolution Speed (Days)
        </h3>

        <div className="w-full min-h-[250px] flex items-center justify-center pt-4">
          {isClient ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} Days`, 'Average SLA']} />
                <Bar dataKey="Resolution Days" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.score < 50 ? '#ef4444' : entry.score < 70 ? '#f59e0b' : '#2563eb'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-stone-400">Loading charts...</div>
          )}
        </div>
      </div>

    </div>
  );
}
