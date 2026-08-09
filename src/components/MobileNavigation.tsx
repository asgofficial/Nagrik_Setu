'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { Home, FileText, AlertCircle, Map, User } from 'lucide-react';

export default function MobileNavigation() {
  const pathname = usePathname() || '/';
  const { language } = useApp();
  const t = translations[language];

  const tabs = [
    { href: '/', label: t.home, icon: Home },
    { href: '/benefits', label: 'Benefits', icon: FileText },
    { href: '/report', label: 'Report', icon: AlertCircle, isAction: true },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/dashboard', label: 'Activity', icon: User }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-900 px-2 py-1.5 z-[999] shadow-lg flex items-center justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

        if (tab.isAction) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center -mt-6 bg-primary text-white p-3.5 rounded-full shadow-md border-4 border-stone-50 dark:border-stone-900 transition hover:scale-105 active:scale-95"
              aria-label="Report a Civic Issue"
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition ${
              isActive
                ? 'text-primary font-bold'
                : 'text-stone-500 dark:text-stone-500'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
