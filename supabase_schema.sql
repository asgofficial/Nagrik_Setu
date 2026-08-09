-- ==========================================
-- JANSETU SUPABASE DATABASE SCHEMA (PRODUCTION MIGRATION)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Grievances table
CREATE TABLE IF NOT EXISTS public.grievances (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    landmark TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    evidence TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'REPORTED',
    reporter_id TEXT,
    authority_id TEXT,
    cluster_id TEXT,
    assigned_team TEXT,
    resolution_note TEXT,
    citizen_confirmations INTEGER DEFAULT 0,
    sla_deadline TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalated_to TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migration columns for existing grievances table
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS reporter_id TEXT;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS authority_id TEXT;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS cluster_id TEXT;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS assigned_team TEXT;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS citizen_confirmations INTEGER DEFAULT 0;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS escalated_to TEXT;

-- 3. Civic Clusters table
CREATE TABLE IF NOT EXISTS public.clusters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    affected_radius INTEGER DEFAULT 220,
    confidence INTEGER DEFAULT 92,
    report_ids TEXT[] DEFAULT '{}',
    reports_count INTEGER DEFAULT 0,
    citizen_confirmations INTEGER DEFAULT 0,
    description TEXT,
    severity TEXT DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    authority_id TEXT,
    last_reported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;
ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS citizen_confirmations INTEGER DEFAULT 0;
ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'MEDIUM';
ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS authority_id TEXT;
ALTER TABLE public.clusters ADD COLUMN IF NOT EXISTS last_reported_at TIMESTAMPTZ;

-- 4. Confirmations table
CREATE TABLE IF NOT EXISTS public.confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    grievance_id TEXT REFERENCES public.grievances(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, grievance_id)
);

-- 5. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('grievance', 'scheme', 'system', 'escalation', 'cluster')),
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Audit Log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grievances_select" ON public.grievances;
DROP POLICY IF EXISTS "grievances_insert" ON public.grievances;
DROP POLICY IF EXISTS "grievances_update" ON public.grievances;
DROP POLICY IF EXISTS "Allow public read access" ON public.grievances;
DROP POLICY IF EXISTS "Allow public insert access" ON public.grievances;
DROP POLICY IF EXISTS "Allow public update access" ON public.grievances;

CREATE POLICY "grievances_select" ON public.grievances
    FOR SELECT USING (true);

CREATE POLICY "grievances_insert" ON public.grievances
    FOR INSERT WITH CHECK (true);

CREATE POLICY "grievances_update" ON public.grievances
    FOR UPDATE USING (true);

ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clusters_select" ON public.clusters;
DROP POLICY IF EXISTS "clusters_insert" ON public.clusters;
DROP POLICY IF EXISTS "clusters_update" ON public.clusters;
DROP POLICY IF EXISTS "Allow public read clusters" ON public.clusters;
DROP POLICY IF EXISTS "Allow public insert clusters" ON public.clusters;
DROP POLICY IF EXISTS "Allow public update clusters" ON public.clusters;

CREATE POLICY "clusters_select" ON public.clusters FOR SELECT USING (true);
CREATE POLICY "clusters_insert" ON public.clusters FOR INSERT WITH CHECK (true);
CREATE POLICY "clusters_update" ON public.clusters FOR UPDATE USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);

ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "confirmations_select" ON public.confirmations;
DROP POLICY IF EXISTS "confirmations_insert" ON public.confirmations;
CREATE POLICY "confirmations_select" ON public.confirmations FOR SELECT USING (true);
CREATE POLICY "confirmations_insert" ON public.confirmations FOR INSERT WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_select" ON public.audit_log;
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_select" ON public.audit_log FOR SELECT USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON public.grievances(category);
CREATE INDEX IF NOT EXISTS idx_grievances_created ON public.grievances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_reporter ON public.grievances(reporter_id);

-- USER PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AUTO-CONFIRM EMAIL FOR DEV/DEMO CONVENIENCE
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- Auto-confirm any existing unconfirmed users in auth.users
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
