'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, Type, Accessibility, Volume2, HelpCircle, X, Sun, Moon } from 'lucide-react';

export default function AccessibilitySettings() {
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    themeMode,
    setThemeMode,
    language
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [readAloud, setReadAloud] = useState(false);

  const toggleReadAloud = () => {
    setReadAloud(!readAloud);
    if (!readAloud) {
      // Simulate reading page
      const utterance = new SpeechSynthesisUtterance("Accessibility settings panel opened. You can adjust text size, enable high contrast, or toggle motion filters.");
      if (language === 'hi') utterance.text = "एक्सेसिबिलिटी सेटिंग्स पैनल खुला है। आप टेक्स्ट आकार बदल सकते हैं, हाई कंट्रास्ट चालू कर सकते हैं।";
      if (language === 'bn') utterance.text = "অ্যাক্সেসিবিলিটি সেটিংস প্যানেল খোলা হয়েছে। আপনি টেক্সটের আকার পরিবর্তন করতে পারেন বা হাই কনট্রাস্ট সক্রিয় করতে পারেন।";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition"
        title="Accessibility Settings"
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
      >
        <Accessibility className="h-4.5 w-4.5" />
        <span className="hidden sm:inline">Accessibility</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 p-4 text-stone-800 dark:text-stone-100">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-primary" />
              Accessibility Options
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition text-stone-500 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Theme Mode Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5" /> Theme Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['bright', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`py-2 text-sm rounded-xl border transition-all duration-200 ${
                      themeMode === mode
                        ? 'bg-primary text-white border-transparent shadow-lg'
                        : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-primary/50'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {mode === 'bright' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {mode === 'bright' ? 'Bright' : 'Dark'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Size Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Text Size
              </label>
              <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
                {(['normal', 'large', 'xl'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`py-1 text-xs font-medium rounded capitalize transition ${
                      textSize === size
                        ? 'bg-white dark:bg-stone-950 text-primary shadow-xs font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-800'
                    }`}
                  >
                    {size === 'xl' ? 'Extra Large' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-stone-500" />
                High Contrast Mode
              </span>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  highContrast ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={highContrast}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reduce Motion Toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="h-4 w-4 text-stone-500" />
                Reduce Animations
              </span>
              <button
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  reduceMotion ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={reduceMotion}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    reduceMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Read Aloud Assistance */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-stone-500" />
                Screen Reader Assist
              </span>
              <button
                onClick={toggleReadAloud}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  readAloud ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={readAloud}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    readAloud ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-start gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-500 mb-0.5">Keyboard Friendly</p>
                <p>Use <kbd className="px-1 bg-stone-100 dark:bg-stone-800 border rounded text-[9px]">Tab</kbd> to navigate, and <kbd className="px-1 bg-stone-100 dark:bg-stone-800 border rounded text-[9px]">Enter</kbd> to trigger actions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
