import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session first, then listen for changes.
    // Combined into a single effect to avoid race conditions between
    // getSession and onAuthStateChange firing independently.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Auth session retrieval failed:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, username?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    // Ensure clean state before attempting sign-up
    // Intentionally silent — pre-auth cleanup failure is non-critical
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch (_) { /* Intentionally silent — sign-out before sign-up is best-effort */ }
    } catch (_) { /* Intentionally silent — cleanup failure is non-critical */ }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: username,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Clean up any existing auth state to avoid limbo sessions
    // Intentionally silent — pre-auth cleanup failure is non-critical
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch (_) { /* Intentionally silent — sign-out before sign-in is best-effort */ }
    } catch (_) { /* Intentionally silent — cleanup failure is non-critical */ }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    try {
      // Proactively clear local state/storage
      cleanupAuthState();
      setSession(null);
      setUser(null);
      setLoading(false);

      // Attempt global sign-out to invalidate all refresh tokens
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error) {
        console.error('Auth sign-out request failed:', error);
      }
    } catch (error) {
      console.error('Auth sign-out cleanup failed:', error);
    } finally {
      // Force hard redirect to ensure a clean app state
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
