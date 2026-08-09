'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NAGRIK_LANGUAGES = [
  { text: 'Nagrik', lang: 'English' },
  { text: 'नागरिक', lang: 'Hindi' },
  { text: 'নাগরিক', lang: 'Bengali' },
];

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const [langIndex, setLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % NAGRIK_LANGUAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = NAGRIK_LANGUAGES[langIndex];

  const badgeTextSize = 
    size === 'sm' 
      ? 'text-[11px] sm:text-xs px-2.5 py-0.5 min-w-[58px]' 
      : size === 'lg' 
      ? 'text-sm sm:text-base px-3.5 py-1 min-w-[76px]' 
      : 'text-xs sm:text-sm px-3 py-0.5 min-w-[66px]';

  const setuTextSize = 
    size === 'sm' 
      ? 'text-lg' 
      : size === 'lg' 
      ? 'text-2xl sm:text-3xl' 
      : 'text-xl sm:text-2xl';

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-1.5 select-none transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`} 
      id="logo-nav"
      aria-label="Nagrik Setu Home"
    >
      <span className={`bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white rounded-lg font-black inline-flex items-center justify-center tracking-tight shadow-xs overflow-hidden relative ${badgeTextSize}`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={current.text}
            title={current.lang}
            initial={{ opacity: 0, y: 7, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -7, scale: 0.9 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="inline-block"
          >
            {current.text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className={`${setuTextSize} font-extrabold tracking-tight text-stone-900 dark:text-white`}>
        Setu
      </span>
    </Link>
  );
}


