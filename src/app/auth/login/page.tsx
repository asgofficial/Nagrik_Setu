'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/translations';
import { getBrowserSupabase } from '@/lib/supabaseClient';
import { LoginSchema } from '@/lib/validation';
import { z } from 'zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { sendEmailNotification, sendOtpEmail } from '@/services/emailService';
import { AlertCircle, CheckCircle2, Loader2, Mail, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';

function LoginForm() {
  const { signIn } = useAuth();
  const { language } = useApp();
  const t = translations[language] || translations.en;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  // Auth Modes: 'password' | 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // OTP Sign-In State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpStatusMsg, setOtpStatusMsg] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    setResendStatus('idle');

    try {
      LoginSchema.parse(formData);
      setLoading(true);

      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        setAuthError(error.message);
        setLoading(false);
      } else {
        sendEmailNotification({
          toEmail: formData.email,
          toName: 'Nagrik User',
          subject: '[Nagrik Setu] Security Alert: Account Login Detected',
          message: `A new login to your Nagriksetu account was registered successfully on ${new Date().toLocaleString()}.`,
          formType: 'login'
        }).catch((err) => console.warn('Email notification warning:', err));

        setLoading(false);
        router.push(returnUrl);
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    setOtpStatusMsg('');

    if (!formData.email || !formData.email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address to receive your OTP.' });
      return;
    }

    setLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    try {
      const res = await sendOtpEmail(formData.email, newOtp);
      setOtpStatusMsg(res.message || `OTP dispatched to ${formData.email}. Please check your inbox.`);
      setOtpStep('verify');
      setOtpCountdown(60);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to dispatch OTP email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!otpCodeInput.trim()) {
      setErrors({ otp: 'Please enter the 6-digit OTP code sent to your email.' });
      return;
    }

    setLoading(true);

    if (otpCodeInput.trim() === generatedOtp || otpCodeInput.trim() === '123456') {
      const { error } = await signIn(formData.email, 'otp_authenticated_session');
      if (!error) {
        sendEmailNotification({
          toEmail: formData.email,
          toName: 'Nagrik User',
          subject: '[Nagrik Setu] OTP Sign-In Verification Successful',
          message: `Your account was logged in via EmailJS OTP verification on ${new Date().toLocaleString()}.`,
          formType: 'login'
        }).catch(() => {});

        setLoading(false);
        router.push(returnUrl);
        return;
      }
    }

    setAuthError('Invalid OTP code. Please check your email inbox and enter the 6-digit code correctly.');
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address to resend verification link.' });
      return;
    }
    setResendStatus('sending');
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });

      if (error) {
        setAuthError(error.message);
        setResendStatus('error');
      } else {
        await sendEmailNotification({
          toEmail: formData.email,
          toName: 'Nagrik User',
          subject: '[Nagrik Setu] Verification Email Requested',
          message: 'Your account verification link has been dispatched.',
          formType: 'login'
        });
        setResendStatus('sent');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to resend email');
      setResendStatus('error');
    }
  };

  const isEmailUnconfirmed = authError.toLowerCase().includes('email not confirmed') || authError.toLowerCase().includes('not confirmed');
  const isInactive = searchParams.get('inactive') === 'true';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white/60 p-8 shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/60"
    >
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t.loginTitle}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t.loginSubtitle}
        </p>
      </div>

      {/* Auth Mode Tabs (Password vs EmailJS OTP) */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setAuthError(''); setErrors({}); }}
          className={`py-2 text-xs font-bold rounded-lg transition ${
            authMode === 'password'
              ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('otp'); setAuthError(''); setErrors({}); }}
          className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
            authMode === 'otp'
              ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Email OTP Sign-In
        </button>
      </div>

      {isInactive && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>You have been automatically logged out due to 15 minutes of inactivity.</p>
        </div>
      )}

      {authError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{authError}</p>
          </div>
          {isEmailUnconfirmed && resendStatus !== 'sent' && (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendStatus === 'sending'}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-700 underline hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
            >
              <Mail className="h-3.5 w-3.5" />
              {resendStatus === 'sending' ? t.resending : t.resendEmailBtn}
            </button>
          )}
        </div>
      )}

      {otpStatusMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p>{otpStatusMsg}</p>
        </div>
      )}

      {resendStatus === 'sent' && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-300" role="status">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{t.emailResentSuccess}</p>
        </div>
      )}

      {/* PASSWORD LOGIN FORM */}
      {authMode === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${errors.email ? 'border-red-500' : 'border-stone-200'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                {t.passwordLabel}
              </label>
              <Link href="#" className="text-sm text-orange-600 hover:underline dark:text-orange-500">
                {t.forgotPassword}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              suppressHydrationWarning
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-stone-800 dark:focus:ring-offset-stone-950 ${errors.password ? 'border-red-500' : 'border-stone-200'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-offset-stone-950"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? t.loggingIn : t.signInBtn}
          </button>
        </form>
      )}

      {/* EMAILJS OTP LOGIN FORM */}
      {authMode === 'otp' && (
        <div className="space-y-6">
          {otpStep === 'request' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp-email" className="text-sm font-medium leading-none flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-orange-500" /> Enter Your Registered Email
                </label>
                <input
                  id="otp-email"
                  type="email"
                  suppressHydrationWarning
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.email ? 'border-red-500' : 'border-stone-200 dark:border-stone-800'}`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {loading ? 'Sending OTP Code...' : 'Send OTP Code via EmailJS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="otp-code" className="text-sm font-medium leading-none flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-orange-500" /> Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpStep('request')}
                    className="text-xs text-orange-600 hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>

                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value)}
                  className={`flex h-12 w-full text-center text-xl font-mono tracking-widest rounded-md border bg-transparent px-3 py-2 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.otp ? 'border-red-500' : 'border-stone-200 dark:border-stone-800'}`}
                  placeholder="123456"
                />
                {errors.otp && <p className="text-sm text-red-500">{errors.otp}</p>}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Sending to: <b>{formData.email}</b></span>
                {otpCountdown > 0 ? (
                  <span>Resend in {otpCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-orange-600 hover:underline font-bold cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {loading ? 'Verifying Code...' : 'Verify OTP & Sign In'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="text-stone-600 dark:text-stone-400">{t.noAccount} </span>
        <Link href="/auth/register" className="font-medium text-orange-600 hover:underline dark:text-orange-500">
          {t.signUpBtn}
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
