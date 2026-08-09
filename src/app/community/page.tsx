'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../utils/translations';
import { Shield, Bell, CheckCircle2, MessageSquare, AlertCircle, Share2, Eye, UserCheck, Flame, Star } from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'milestone' | 'status_change' | 'cluster_formed';
  title: string;
  description: string;
  timeLabel: string;
  category: string;
  confirmations: number;
  followers: number;
  isFollowed?: boolean;
  isConfirmed?: boolean;
}

export default function CommunityPage() {
  const { grievances, clusters, language } = useApp();
  const t = translations[language];

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});

  // Dynamically map real grievances & clusters to stream feed items
  const allFeedItems: FeedItem[] = [
    ...grievances.map(g => ({
      id: g.id,
      type: (g.status === 'AUTHORITY_RESOLVED' || g.status === 'CITIZEN_VERIFIED' ? 'milestone' : 'status_change') as 'milestone' | 'status_change',
      title: `${g.title} (${g.id})`,
      description: g.description,
      timeLabel: new Date(g.createdAt).toLocaleDateString() + ' ' + new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: g.createdAt,
      category: g.category,
      confirmations: g.citizenConfirmations || 1,
      followers: Math.floor((g.citizenConfirmations || 1) * 1.5),
      isFollowed: !!followedIds[g.id],
      isConfirmed: !!confirmedIds[g.id]
    })),
    ...clusters.map(c => ({
      id: c.id,
      type: 'cluster_formed' as const,
      title: `${c.title} — ${c.reportsCount} Reports Clustered`,
      description: c.description,
      timeLabel: new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: c.createdAt,
      category: c.category,
      confirmations: c.citizenConfirmations || c.reportsCount,
      followers: Math.floor(c.reportsCount * 2),
      isFollowed: !!followedIds[c.id],
      isConfirmed: !!confirmedIds[c.id]
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = selectedCategory === 'All'
    ? allFeedItems
    : allFeedItems.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleConfirm = (id: string) => {
    setConfirmedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFollow = (id: string) => {
    setFollowedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-stone-850 dark:text-stone-100 flex-1 w-full space-y-8">
      
      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Community Civic Stream</h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-bold">Public real-world activity updates verified by citizens</p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <span className="text-xs font-bold text-stone-400 uppercase mr-1">Category:</span>
        {['All', 'Electricity', 'Water', 'Waste', 'Road', 'Sanitation', 'Public Safety', 'Harassment', 'Corruption'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
              selectedCategory === cat
                ? 'bg-primary text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {cat} {cat !== 'All' ? `(${allFeedItems.filter(i => i.category.toLowerCase() === cat.toLowerCase()).length})` : `(${allFeedItems.length})`}
          </button>
        ))}
      </div>

      {/* Narrative info box */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2.5">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-stone-900 dark:text-white mb-0.5">Democratic Safety Enforcement</p>
          <p>This is a moderation-filtered bulletin. To prevent harassment, spam, and corruption profiling, **there are no user-generated open comment threads, likes, or dislikes.** Instead, support issues using official verification actions.</p>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="space-y-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 shadow-xs text-left relative overflow-hidden">
            
            {/* Left Category Accent Strip */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${
              item.category === 'Water' ? 'bg-blue-500' : item.category === 'Electricity' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

            <div className="flex justify-between items-center gap-4 text-[10px] text-stone-400 font-bold mb-3 pl-1">
              <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded uppercase">
                {item.category}
              </span>
              <span>{item.timeLabel}</span>
            </div>

            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white pl-1 leading-snug">
              {item.title}
            </h3>
            
            <p className="text-xs text-stone-500 dark:text-stone-400 pl-1 mt-2 leading-relaxed">
              {item.description}
            </p>

            {/* Counter badges */}
            <div className="flex gap-4 text-[10px] text-stone-400 font-semibold pl-1 mt-4">
              <span>{item.confirmations} Citizens Affected</span>
              <span>•</span>
              <span>{item.followers} Following updates</span>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-2 border-t border-stone-100 dark:border-stone-800 pt-4 mt-5 pl-1 text-xs">
              <button
                onClick={() => handleConfirm(item.id)}
                className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                  item.isConfirmed
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-600'
                    : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-700'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>{item.isConfirmed ? 'Confirmed ✓' : 'I\'m Affected Too'}</span>
              </button>

              <button
                onClick={() => handleFollow(item.id)}
                className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                  item.isFollowed
                    ? 'border-primary bg-blue-50/20 text-primary'
                    : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-700'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>{item.isFollowed ? 'Following Updates ✓' : 'Follow Updates'}</span>
              </button>

              <button
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-700 font-bold transition flex items-center gap-1 cursor-pointer ml-auto"
                onClick={() => {
                  if (typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href);
                  alert('Share link copied to clipboard!');
                }}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share Update</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
