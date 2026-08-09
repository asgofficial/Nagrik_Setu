'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { localization } from '../utils/translations';
import AccessibilitySettings from './AccessibilityMenu';
import Logo from './Logo';
import { Bell, Shield, User, Globe, Check, AlertCircle, FileText, LogIn, LogOut, UserCog } from 'lucide-react';

export default function AppNavbar() {
  const pathname = usePathname() || '/';
  const {
    language,
    setLanguage,
    activeUser,
    notifications,
    clearNotifications,
    isLiveGoiSync,
    toggleLiveGoiSync
  } = useApp();

  const { user, role, signOut } = useAuth();

  const t = localization[language];

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'scheme':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'grievance':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'cluster':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-stone-500" />;
    }
  };

  const navLinks = [
    { href: '/', label: t.home },
    { href: '/benefits', label: t.benefits },
    { href: '/report', label: t.report },
    { href: '/map', label: t.map },
    { href: '/civic-health', label: 'Civic Health' },
    { href: '/about', label: t.about }
  ];

  // Determine display name for auth user
  const authUserName = user?.user_metadata?.name || user?.email?.split('@')[0] || null;
  const isOfficer = user && (role === 'officer' || role === 'admin' || user.user_metadata?.role === 'officer');
  const initials = authUserName ? authUserName.slice(0, 2).toUpperCase() : null;

  return (
    <header className="sticky top-0 z-[1000] w-full bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-900 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Logo size="md" />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map(link => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition ${
                      isActive
                        ? 'bg-orange-50 text-primary dark:bg-orange-950/50 dark:text-orange-300 font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live GOI Data Sync Toggle Pill */}
            <button
              onClick={toggleLiveGoiSync}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition cursor-pointer ${
                isLiveGoiSync
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-100'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800'
              }`}
              title={`Live Government of India Real-Time Data Sync (${isLiveGoiSync ? 'Active • 100% Synced' : 'Disabled • Cached'})`}
            >
              <span className="relative flex h-2 w-2">
                {isLiveGoiSync && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveGoiSync ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
              </span>
              <span>🇮🇳 {isLiveGoiSync ? 'Live GOI Data' : 'Cached Data'}</span>
            </button>
            
            {/* Language Selector */}
            <div className="relative group hidden md:flex items-center gap-1 text-stone-600 dark:text-stone-400">
              <Globe className="h-4 w-4" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-sm font-semibold pr-4 py-1 cursor-pointer focus:outline-hidden text-stone-700 dark:text-stone-300 hover:text-primary transition"
                aria-label="Select Language"
              >
                <option value="en" className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200">EN</option>
                <option value="bn" className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200">বাংলা</option>
                <option value="hi" className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200">हिंदी</option>
              </select>
            </div>

            {/* Accessibility Menu */}
            <AccessibilitySettings />

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 transition relative"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-danger text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-stone-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-[9999] overflow-hidden">
                  <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Recent Activity</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-3 hover:bg-stone-50 dark:hover:bg-stone-900/40 transition">
                          <div className="flex gap-2.5">
                            <div className="mt-0.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg shrink-0">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">{notif.title}</p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-stone-400 dark:text-stone-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 text-center">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-stone-500 hover:text-stone-800 font-semibold inline-block"
                    >
                      View All in Activity
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Auth User Button - Authenticated */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800 cursor-pointer group"
                  aria-label="User menu"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ring-2 ring-offset-1 transition ${
                    isOfficer
                      ? 'bg-orange-600 ring-orange-300 dark:ring-orange-800'
                      : 'bg-stone-700 ring-stone-300 dark:ring-stone-700'
                  }`}>
                    {initials}
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight">
                      {authUserName}
                    </span>
                    <span className={`text-[10px] font-semibold capitalize ${isOfficer ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400'}`}>
                      {isOfficer ? '🛡 Officer' : 'Citizen'}
                    </span>
                  </div>
                </button>

                {/* User dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-[9999] overflow-hidden">
                    <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{authUserName}</p>
                      <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
                      {isOfficer && (
                        <span className="inline-block mt-1 rounded px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-[9px] font-bold uppercase">
                          Officer Account
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      {isOfficer ? (
                        <>
                          <Link
                            href="/authority"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                          >
                            <Shield className="h-3.5 w-3.5 text-orange-500" />
                            Officer Portal
                          </Link>
                          <Link
                            href="/authority/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                          >
                            <UserCog className="h-3.5 w-3.5 text-stone-400" />
                            My Profile
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                          >
                            <User className="h-3.5 w-3.5 text-stone-400" />
                            My Dashboard
                          </Link>
                          <Link
                            href="/report"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-stone-400" />
                            Report Issue
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border-t border-stone-100 dark:border-stone-800 mt-1"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In button - not logged in */
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
