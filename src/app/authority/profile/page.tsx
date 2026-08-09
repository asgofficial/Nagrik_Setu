'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  User,
  Mail,
  Phone,
  Building2,
  Edit3,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Badge,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function OfficerProfilePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
    jurisdiction: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        department: user.user_metadata?.department || '',
        designation: user.user_metadata?.designation || '',
        employeeId: user.user_metadata?.employee_id || '',
        jurisdiction: user.user_metadata?.jurisdiction || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.updateUser({
      data: {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
        employee_id: formData.employeeId.trim() || null,
        jurisdiction: formData.jurisdiction.trim() || null,
      },
    });

    setIsSaving(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to update profile. Please try again.');
    } else {
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Loading guard
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Auth + role guard
  const isOfficerOrAdmin = user && (role === 'officer' || role === 'admin' || user.user_metadata?.role === 'officer');

  if (!user || !isOfficerOrAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/80">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50">
            <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">Officer Access Only</h2>
          <p className="mb-6 text-sm text-stone-600 dark:text-stone-400">
            This page is only accessible to authorized municipal officers.
          </p>
          <Link
            href="/authority"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            Go to Officer Portal
          </Link>
        </div>
      </div>
    );
  }

  const initials = (formData.name || user.email || 'O').slice(0, 2).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <Link
        href="/authority"
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Officer Portal
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            Officer Profile
          </h1>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Manage your administrative profile and credentials
          </p>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs dark:border-stone-800 dark:bg-stone-900 overflow-hidden">

        {/* Profile Header Band */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white ring-2 ring-white/30">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                {formData.name || user.email}
              </h2>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {role || 'officer'}
              </span>
            </div>
            <p className="text-sm text-orange-100">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-orange-200">
              <Calendar className="h-3.5 w-3.5" />
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Profile Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                    // Reset to original
                    setFormData({
                      name: user.user_metadata?.name || '',
                      phone: user.user_metadata?.phone || '',
                      department: user.user_metadata?.department || '',
                      designation: user.user_metadata?.designation || '',
                      employeeId: user.user_metadata?.employee_id || '',
                      jurisdiction: user.user_metadata?.jurisdiction || '',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <User className="h-3.5 w-3.5" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                  placeholder="Your full name"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {formData.name || <span className="text-stone-400 font-normal italic">Not set</span>}
                </p>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </label>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {user.email}
              </p>
              <p className="text-[10px] text-stone-400">Email cannot be changed here</p>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                  placeholder="10-digit mobile number"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {formData.phone || <span className="text-stone-400 font-normal italic">Not set</span>}
                </p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Building2 className="h-3.5 w-3.5" />
                Department
              </label>
              {isEditing ? (
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                >
                  <option value="">Select department</option>
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="PWD – Roads & Infrastructure">PWD – Roads & Infrastructure</option>
                  <option value="Water Supply Board">Water Supply Board</option>
                  <option value="Electrical Department">Electrical Department</option>
                  <option value="Solid Waste Management">Solid Waste Management</option>
                  <option value="Sanitation Department">Sanitation Department</option>
                  <option value="Vigilance & Anti-Corruption Cell">Vigilance & Anti-Corruption Cell</option>
                  <option value="Public Safety & Police Liaison">Public Safety & Police Liaison</option>
                  <option value="District Collector Office">District Collector Office</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {formData.department || <span className="text-stone-400 font-normal italic">Not set</span>}
                </p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Badge className="h-3.5 w-3.5" />
                Designation / Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                  placeholder="e.g. Deputy Commissioner, Field Inspector"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {formData.designation || <span className="text-stone-400 font-normal italic">Not set</span>}
                </p>
              )}
            </div>

            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Shield className="h-3.5 w-3.5" />
                Employee ID / Badge Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                  placeholder="e.g. KMC/2026/04521"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 font-mono">
                  {formData.employeeId || <span className="text-stone-400 font-normal italic font-sans">Not set</span>}
                </p>
              )}
            </div>

            {/* Jurisdiction */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <MapPin className="h-3.5 w-3.5" />
                Jurisdiction / Area of Responsibility
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
                  placeholder="e.g. Kolkata – Ward 10-15, Borough II"
                />
              ) : (
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {formData.jurisdiction || <span className="text-stone-400 font-normal italic">Not set</span>}
                </p>
              )}
            </div>

          </div>

          {/* Account Info */}
          <div className="border-t border-stone-100 pt-5 dark:border-stone-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-stone-400 font-semibold">Account ID</p>
                <p className="text-stone-700 dark:text-stone-300 font-mono mt-0.5 text-[11px] break-all">{user.id}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-stone-400 font-semibold">Role Level</p>
                <p className="text-orange-600 dark:text-orange-400 font-bold mt-0.5 uppercase">{role || user.user_metadata?.role || 'officer'}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-stone-400 font-semibold">Last Sign In</p>
                <p className="text-stone-700 dark:text-stone-300 mt-0.5">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
                <p className="text-stone-400 font-semibold">Email Confirmed</p>
                <p className={`mt-0.5 font-bold ${user.email_confirmed_at ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {user.email_confirmed_at ? '✓ Verified' : '⚠ Pending Verification'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/authority"
          className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-orange-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Open Cases Queue</p>
            <p className="text-xs text-stone-400 mt-0.5">Review and manage pending grievances</p>
          </div>
          <Shield className="h-5 w-5 text-orange-500 shrink-0" />
        </Link>
        <Link
          href="/map"
          className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-orange-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200">Civic Map Overview</p>
            <p className="text-xs text-stone-400 mt-0.5">See active issues across your jurisdiction</p>
          </div>
          <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
        </Link>
      </div>

    </div>
  );
}
