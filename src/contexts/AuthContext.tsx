import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
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
    console.log('🔧 Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check for existing session once on mount
  useEffect(() => {
    console.log('🔍 Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Initial session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionUserId: session?.user?.id,
        sessionUserEmail: session?.user?.email,
        sessionError: error,
        accessToken: session?.access_token ? 'present' : 'missing'
      });
      
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('❌ Session check failed:', error);
      setLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    // Ensure clean state before attempting sign-up
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } catch {}
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🚀 Starting sign in process...');

    // Clean up any existing auth state to avoid limbo sessions
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } catch {}
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔐 Sign in result:', {
      success: !error,
      hasSession: !!data?.session,
      hasAccessToken: !!data?.session?.access_token,
      userEmail: data?.user?.email,
      error: error?.message
    });
    
    if (!error && data?.session) {
      console.log('✅ Sign in successful, session established');
      // Auth state listener will handle state updates
    }
    
    return { data, error };
  };

  const signOut = async () => {
    console.log('🚪 Starting sign out process...');

    try {
      // Proactively clear local state/storage
      cleanupAuthState();
      setSession(null);
      setUser(null);
      setLoading(false);

      // Attempt global sign-out to invalidate all refresh tokens
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
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
