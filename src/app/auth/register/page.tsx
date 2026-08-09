'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/translations';
import { getBrowserSupabase } from '@/lib/supabaseClient';
import { RegisterSchema } from '@/lib/validation';
import { z } from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEmailNotification } from '@/services/emailService';
import { AlertCircle, CheckCircle2, Loader2, User, ShieldCheck, Mail } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { language } = useApp();
  const t = translations[language] || translations.en;
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'citizen' as 'citizen' | 'officer',
    officerCode: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    
    try {
      // 1. Validate form schema
      RegisterSchema.parse(formData);
      setLoading(true);

      // 2. If officer, verify code
      if (formData.role === 'officer') {
        const res = await fetch('/api/auth/verify-officer-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: formData.officerCode }),
        });
        
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setAuthError(data.error || 'Invalid officer verification code');
          setLoading(false);
          return;
        }
      }

      // 3. Sign up with Supabase
      const { error } = await signUp(formData);

      if (error) {
        setAuthError(error.message);
        setLoading(false);
      } else {
        // Send EmailJS welcome notification in background
        sendEmailNotification({
          toEmail: formData.email,
          toName: formData.name,
          subject: `Welcome to Nagrik Setu, ${formData.name}!`,
          message: `Thank you for registering on Nagriksetu as a ${formData.role}. Your account is ready!`,
          formType: 'registration',
          details: {
            role: formData.role,
            phone: formData.phone
          }
        }).catch((err) => console.warn('Email notification warning:', err));

        setLoading(false);
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) newErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(newErrors);
      }
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendStatus('sending');
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });

      await sendEmailNotification({
        toEmail: formData.email,
        toName: formData.name || 'User',
        subject: `[Nagrik Setu] Email Verification Link Resent`,
        message: `Your email verification link has been resent. Please click the link to verify your Nagrik Setu account.`,
        formType: 'registration'
      });

      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white/60 p-8 text-center shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/60"
        >
          <Mail className="mx-auto mb-4 h-12 w-12 text-orange-500 animate-bounce" />
          <h2 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">
            {t.registrationSuccessTitle}
          </h2>
          <p className="mb-6 text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            {t.registrationSuccessDesc}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
            >
              {t.signInBtn}
            </Link>
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendStatus === 'sending'}
              className="text-xs text-stone-500 hover:text-stone-800 underline dark:text-stone-400 dark:hover:text-stone-200"
            >
              {resendStatus === 'sending' ? t.resending : resendStatus === 'sent' ? t.emailResentSuccess : t.resendEmailBtn}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white/60 p-8 shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/60"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {t.registerTitle}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t.registerSubtitle}
          </p>
        </div>

        {authError && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border p-4 transition-colors ${
                formData.role === 'citizen'
                  ? 'border-orange-500 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950/20 dark:text-orange-100'
                  : 'border-stone-200 bg-transparent text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="citizen"
                checked={formData.role === 'citizen'}
                onChange={() => setFormData({ ...formData, role: 'citizen' })}
                className="sr-only"
              />
              <User className="mb-2 h-6 w-6" />
              <span className="text-sm font-semibold">{t.citizenRole}</span>
            </label>

            <label
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border p-4 transition-colors ${
                formData.role === 'officer'
                  ? 'border-orange-500 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950/20 dark:text-orange-100'
                  : 'border-stone-200 bg-transparent text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-900'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="officer"
                checked={formData.role === 'officer'}
                onChange={() => setFormData({ ...formData, role: 'officer' })}
                className="sr-only"
              />
              <ShieldCheck className="mb-2 h-6 w-6" />
              <span className="text-sm font-semibold">{t.officerRole}</span>
            </label>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              {t.nameLabel}
            </label>
            <input
              id="name"
              type="text"
              suppressHydrationWarning
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${
                errors.name ? 'border-red-500' : 'border-stone-200'
              }`}
              placeholder="Amit Das"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              {t.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              suppressHydrationWarning
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${
                errors.email ? 'border-red-500' : 'border-stone-200'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium leading-none">
              {t.phoneLabel}
            </label>
            <input
              id="phone"
              type="tel"
              suppressHydrationWarning
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="flex h-10 w-full rounded-md border border-stone-200 bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-stone-800 dark:focus:ring-offset-stone-950"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              {t.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              suppressHydrationWarning
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${
                errors.password ? 'border-red-500' : 'border-stone-200'
              }`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          {/* Officer Code conditional field */}
          <AnimatePresence>
            {formData.role === 'officer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label htmlFor="officerCode" className="text-sm font-medium leading-none">
                  {t.officerCodeLabel}
                </label>
                <input
                  id="officerCode"
                  type="text"
                  suppressHydrationWarning
                  value={formData.officerCode}
                  onChange={(e) => setFormData({ ...formData, officerCode: e.target.value })}
                  className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${
                    errors.officerCode ? 'border-red-500' : 'border-stone-200'
                  }`}
                  placeholder={t.officerCodePlaceholder}
                />
                {errors.officerCode && <p className="text-sm text-red-500">{errors.officerCode}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-offset-stone-950"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? t.registering : t.signUpBtn}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-stone-600 dark:text-stone-400">{t.hasAccount} </span>
          <Link href="/auth/login" className="font-medium text-orange-600 hover:underline dark:text-orange-500">
            {t.signInBtn}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
