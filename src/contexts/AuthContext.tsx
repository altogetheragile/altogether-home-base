import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, {
          userEmail: session?.user?.email,
          hasAccessToken: !!session?.access_token,
          tokenLength: session?.access_token?.length || 0,
          uid: session?.user?.id
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Debug: Test database connection with new session
        if (session?.access_token) {
          console.log('✅ Session established, testing DB connection...');
          // Use setTimeout to ensure the session is fully set
          setTimeout(async () => {
            try {
              const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
              console.log('🔍 Profile check result:', { data, error, uid: session.user.id });
            } catch (err) {
              console.error('Profile check failed:', err);
            }
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Separate effect to check for existing session after auth listener is set up
  useEffect(() => {
    console.log('🔍 Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Existing session check:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        error
      });
      
      // Only set if we don't already have a session
      if (!session && !user) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
  }, [user]); // Depend on user to avoid overwriting authenticated state

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
    
    return { error };
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
