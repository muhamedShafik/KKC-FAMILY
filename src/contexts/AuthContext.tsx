import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface LocalAdminUser {
  id: string;
  email: string;
  role: 'admin';
}

interface AuthContextValue {
  user: User | LocalAdminUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
  isLocalMode: boolean;
}

const LOCAL_AUTH_KEY = 'kkc_local_admin_session';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | LocalAdminUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local Mode: check localStorage for saved admin session
      try {
        const saved = localStorage.getItem(LOCAL_AUTH_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        }
      } catch (e) {
        console.error('Error reading local auth session', e);
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } else {
      // Local development sign in
      if (!email || !password) {
        return { error: new Error('Please enter both email and password') };
      }
      const localUser: LocalAdminUser = {
        id: 'local-admin-1',
        email,
        role: 'admin',
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localUser));
      setUser(localUser);
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error: error as Error | null };
    } else {
      const localUser: LocalAdminUser = {
        id: 'local-admin-1',
        email,
        role: 'admin',
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localUser));
      setUser(localUser);
      return { data: { user: localUser }, error: null };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      setUser(null);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    if (isSupabaseConfigured) {
      const redirectUrl = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error: error as Error | null };
    } else {
      // Local mode simulation
      if (!email) {
        return { error: new Error('Please enter your email address') };
      }
      return { error: null };
    }
  };

  const updatePassword = async (password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error as Error | null };
    } else {
      // Local mode simulation
      if (!password || password.length < 6) {
        return { error: new Error('Password must be at least 6 characters long') };
      }
      return { error: null };
    }
  };

  const isAdmin = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        isAdmin,
        isLocalMode: !isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
