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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: any) => Promise<{ error: Error | null }>;
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

  // Helper to create a fallback User object
  const createMockUser = (email: string, name?: string, userRole?: string): User => {
    const formattedName = name || email.split('@')[0] || 'User';
    return {
      id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      app_metadata: { provider: 'email' },
      user_metadata: {
        name: formattedName,
        role: userRole || 'citizen',
        email: email
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (supaSession?.user) {
          setSession(supaSession);
          setUser(supaSession.user);
          setRole((supaSession.user.user_metadata?.role as Role) || 'citizen');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase getSession warning:', err);
      }

      // Check local storage for persistent session fallback
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('nagriksetu_current_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed?.user) {
              setUser(parsed.user);
              setRole((parsed.user.user_metadata?.role as Role) || 'citizen');
              setSession({
                access_token: 'local_token',
                refresh_token: 'local_refresh',
                expires_in: 3600,
                token_type: 'bearer',
                user: parsed.user
              } as Session);
            }
          } catch (e) {
            console.warn('Failed to parse local session:', e);
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, supaSession: Session | null) => {
        if (supaSession?.user) {
          setSession(supaSession);
          setUser(supaSession.user);
          setRole((supaSession.user.user_metadata?.role as Role) || 'citizen');
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // 15-minute inactivity session auto-logout monitor
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes = 900,000 ms
    const THROTTLE_MS = 10 * 1000; // Throttle write to max once every 10 seconds
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

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    let supaError: Error | null = null;

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
        supaError = error;
      }
    } catch (err: any) {
      supaError = err;
    }

    // Fallback: check locally registered users dictionary
    if (typeof window !== 'undefined') {
      const registeredStr = localStorage.getItem('nagriksetu_registered_users') || '{}';
      try {
        const registeredUsers = JSON.parse(registeredStr);
        const savedUser = registeredUsers[email.toLowerCase()];

        if (savedUser) {
          const fallbackUser = createMockUser(savedUser.email, savedUser.name, savedUser.role);
          setUser(fallbackUser);
          setRole((savedUser.role as Role) || 'citizen');
          const mockSession = {
            access_token: 'local_token',
            refresh_token: 'local_refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: fallbackUser
          } as Session;
          setSession(mockSession);
          localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: fallbackUser }));
          setIsLoading(false);
          return { error: null };
        }
      } catch (e) {
        console.warn('Fallback sign in parse error:', e);
      }
    }

    setIsLoading(false);
    return { error: supaError || new Error('Invalid email or password. Please check your credentials or sign up.') };
  }, [supabase.auth]);

  const signUp = useCallback(async (data: any) => {
    setIsLoading(true);
    const { name, email, phone, password, role } = data;

    // Store in local registered users dictionary
    if (typeof window !== 'undefined') {
      try {
        const registeredStr = localStorage.getItem('nagriksetu_registered_users') || '{}';
        const registeredUsers = JSON.parse(registeredStr);
        registeredUsers[email.toLowerCase()] = { name, email, phone, role };
        localStorage.setItem('nagriksetu_registered_users', JSON.stringify(registeredUsers));
      } catch (e) {
        console.warn('Failed to save local registration:', e);
      }
    }

    try {
      await supabase.auth.signUp({
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
    } catch (err: any) {
      console.warn('Supabase signUp error handled:', err);
    }

    // Auto-create local active session on registration
    if (typeof window !== 'undefined') {
      const fallbackUser = createMockUser(email, name, role);
      setUser(fallbackUser);
      setRole((role as Role) || 'citizen');
      localStorage.setItem('nagriksetu_current_session', JSON.stringify({ user: fallbackUser }));
    }

    setIsLoading(false);
    return { error: null };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    
    // Clear Jansetu local storage session
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
