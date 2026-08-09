'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { localization } from '../utils/localization';
import Logo from './Logo';
import { Shield } from 'lucide-react';

export default function AppFooter() {
  const { language } = useApp();
  const t = localization[language];

  return (
    <footer className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-900 pt-12 pb-24 lg:pb-12 text-stone-600 dark:text-stone-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Desc */}
          <div className="md:col-span-2">
            <Logo className="mb-3" size="md" />
            <p className="max-w-sm text-stone-500 leading-relaxed">
              {t.footerDesc}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-white uppercase tracking-wider text-xs mb-3">Resources</h4>
            <div className="flex flex-col gap-2">
              <Link href="/benefits" className="hover:text-primary transition">{t.benefits}</Link>
              <Link href="/report" className="hover:text-primary transition">{t.report}</Link>
              <Link href="/map" className="hover:text-primary transition">{t.exploreMapCTA}</Link>
              <Link href="/civic-health" className="hover:text-primary transition">Civic Health Dashboard</Link>
            </div>
          </div>

          {/* Policies & Info */}
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-white uppercase tracking-wider text-xs mb-3">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="hover:text-primary transition">Privacy & Data Minimization</Link>
              <Link href="/about" className="hover:text-primary transition">About Nagrik Setu</Link>
              <Link href="/authority" className="hover:text-primary transition flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Administrative Panel
              </Link>
            </div>
          </div>

        </div>

        {/* Disclaimer Strip */}
        <div className="pt-8 border-t border-stone-100 dark:border-stone-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-400">
          <p>{t.footerNote}</p>
          <p>© {new Date().getFullYear()} Nagrik Setu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
