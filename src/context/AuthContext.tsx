'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabaseClient';

type Role = 'citizen' | 'officer' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; token?: string }>;
  signUp: (data: any) => Promise<{ error: Error | null; token?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [supabase] = useState(() => getBrowserSupabase());

  // Helper to format User object compatible with Supabase User interface
  const formatUserObject = (id: string, email: string, name?: string, userRole?: string, phone?: string): User => {
    const formattedName = name || (email ? email.split('@')[0] : 'User');
    return {
      id: id || `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      app_metadata: { provider: 'jwt' },
      user_metadata: {
        name: formattedName,
        role: userRole || 'citizen',
        email: email,
        phone: phone || ''
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
      phone: phone || '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;
  };

  // Initialize Auth on app launch: Check backend /api/auth/me (JWT)
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Try JWT endpoint
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            const userObj = formatUserObject(
              data.user.id,
              data.user.email,
              data.user.name,
              data.user.role,
              data.user.phone
            );
            setUser(userObj);
            setRole((data.user.role as Role) || 'citizen');
            setSession({
              access_token: 'jwt_authenticated',
              refresh_token: 'jwt_refresh',
              expires_in: 604800,
              token_type: 'bearer',
              user: userObj
            } as Session);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[AuthContext] JWT session check error:', err);
      }

      // 2. Try Supabase session fallback
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (supaSession?.user && isMounted) {
          setSession(supaSession);
          setUser(supaSession.user);
          setRole((supaSession.user.user_metadata?.role as Role) || 'citizen');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[AuthContext] Supabase getSession fallback warning:', err);
      }

      // 3. Check persistent session fallback from localStorage
      if (typeof window !== 'undefined' && isMounted) {
        const savedSession = localStorage.getItem('nagriksetu_current_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed?.user) {
              setUser(parsed.user);
              setRole((parsed.user.user_metadata?.role as Role) || 'citizen');
              setSession({
                access_token: parsed.token || 'local_token',
                refresh_token: 'local_refresh',
                expires_in: 3600,
                token_type: 'bearer',
                user: parsed.user
              } as Session);
            }
          } catch (e) {
            console.warn('[AuthContext] Failed to parse local session:', e);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [supabase.auth]);

  // 15-minute inactivity session monitor
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    const THROTTLE_MS = 10 * 1000;
    let lastWriteTime = 0;

    const updateLastActivity = () => {
      const now = Date.now();
      if (now - lastWriteTime > THROTTLE_MS) {
        lastWriteTime = now;
        localStorage.setItem('nagriksetu_last_activity', String(now));
      }
    };

    if (!localStorage.getItem('nagriksetu_last_activity')) {
      localStorage.setItem('nagriksetu_last_activity', String(Date.now()));
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, updateLastActivity, { passive: true }));

    const checkInactivity = async () => {
      const lastActivity = Number(localStorage.getItem('nagriksetu_last_activity') || Date.now());
      const now = Date.now();
      if (now - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        console.warn('15 minutes of inactivity reached. Processing auto logout...');
        await signOut();
        router.push('/auth/login?inactive=true');
      }
    };

    const interval = setInterval(checkInactivity, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, updateLastActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [user]);

  // JWT Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // 1. Call Backend JWT Login Endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        const userObj = formatUserObject(
          data.user.id,
          data.user.email,
          data.user.name,
          data.user.role,
          data.user.phone
        );

        setUser(userObj);
        setRole((data.user.role as Role) || 'citizen');
        setSession({
          access_token: data.token,
          refresh_token: 'jwt_refresh',
          expires_in: 604800,
          token_type: 'bearer',
          user: userObj
        } as Session);

        if (typeof window !== 'undefined') {
          localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: userObj, token: data.token }));
        }

        setIsLoading(false);
        return { error: null, token: data.token };
      }

      if (data.error) {
        setIsLoading(false);
        return { error: new Error(data.error) };
      }
    } catch (err: any) {
      console.warn('[AuthContext] JWT login fetch failed, trying Supabase fallback:', err);
    }

    // 2. Supabase fallback
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        setSession(data.session);
        setUser(data.user);
        setRole((data.user.user_metadata?.role as Role) || 'citizen');
        if (typeof window !== 'undefined') {
          localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: data.user }));
        }
        setIsLoading(false);
        return { error: null };
      }
      if (error) {
        setIsLoading(false);
        return { error };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { error: err || new Error('Authentication failed') };
    }

    setIsLoading(false);
    return { error: new Error('Invalid email or password. Please verify your credentials.') };
  }, [supabase.auth]);

  // JWT Sign Up
  const signUp = useCallback(async (data: any) => {
    setIsLoading(true);
    const { name, email, phone, password, role, officerCode } = data;

    try {
      // 1. Call Backend JWT Register Endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role, officerCode }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.user) {
        const userObj = formatUserObject(
          result.user.id,
          result.user.email,
          result.user.name,
          result.user.role,
          result.user.phone
        );

        setUser(userObj);
        setRole((result.user.role as Role) || 'citizen');
        setSession({
          access_token: result.token,
          refresh_token: 'jwt_refresh',
          expires_in: 604800,
          token_type: 'bearer',
          user: userObj
        } as Session);

        if (typeof window !== 'undefined') {
          localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: userObj, token: result.token }));
        }

        setIsLoading(false);
        return { error: null, token: result.token };
      }

      if (result.error) {
        setIsLoading(false);
        return { error: new Error(result.error) };
      }
    } catch (err: any) {
      console.warn('[AuthContext] JWT register fetch failed, trying Supabase fallback:', err);
    }

    // 2. Supabase fallback
    try {
      const { data: supaData, error: supaErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || null,
            role: role || 'citizen',
          },
        },
      });

      if (supaErr) {
        setIsLoading(false);
        return { error: supaErr };
      }

      const fallbackUser = formatUserObject(supaData.user?.id || '', email, name, role, phone);
      setUser(fallbackUser);
      setRole((role as Role) || 'citizen');
      if (typeof window !== 'undefined') {
        localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: fallbackUser }));
      }
      setIsLoading(false);
      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err || new Error('Registration failed') };
    }
  }, [supabase.auth]);

  // Sign Out
  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[AuthContext] Logout API error:', e);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('nagriksetu_current_session');
    }

    setSession(null);
    setUser(null);
    setRole(null);
    setIsLoading(false);
    router.push('/');
  }, [supabase.auth, router]);

  const value = useMemo(() => ({
    user,
    session,
    role,
    isLoading,
    signIn,
    signUp,
    signOut,
  }), [user, session, role, isLoading, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}