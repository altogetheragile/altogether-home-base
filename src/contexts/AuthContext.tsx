import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
      (event, session) => {
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
          setTimeout(() => {
            supabase.from('profiles').select('role').eq('id', session.user.id).single()
              .then(({ data, error }) => {
                console.log('🔍 Profile check result:', { data, error, uid: session.user.id });
              });
          }, 100);
        }
      }
    );

    // Check for existing session
    console.log('🔍 Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Existing session check:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        error
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
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
      // Let the auth state listener handle the session update
      // No need for aggressive cleanup or forced reload
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Starting sign out process...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
    } else {
      console.log('✅ Sign out successful');
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
