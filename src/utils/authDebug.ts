import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from './authCleanup';

export const debugAuthState = async () => {
  console.log('🔍 Auth Debug Check:', {
    timestamp: new Date().toISOString(),
    localStorage: Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-')),
    sessionStorage: Object.keys(sessionStorage).filter(k => k.includes('supabase') || k.includes('sb-')),
  });

  try {
    const { data: session } = await supabase.auth.getSession();
    console.log('📋 Current Session:', {
      hasSession: !!session.session,
      hasUser: !!session.session?.user,
      userEmail: session.session?.user?.email,
      expiresAt: session.session?.expires_at,
    });
  } catch (error) {
    console.error('❌ Session check failed:', error);
  }
};

export const resetAuthState = async () => {
  console.log('🔄 Resetting auth state...');
  
  try {
    // Clean up storage first
    cleanupAuthState();
    
    // Sign out globally
    await supabase.auth.signOut({ scope: 'global' });
    
    // Clear React Query cache if available
    try {
      const queryClient = (window as any).queryClient;
      if (queryClient) {
        queryClient.clear();
      }
    } catch {
      // Ignore if queryClient not available
    }
    
    console.log('✅ Auth state reset complete');
    
    // Force reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
  } catch (error) {
    console.error('❌ Auth reset failed:', error);
    // Force reload anyway
    window.location.href = '/auth';
  }
};

// Development helper - expose to window for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = debugAuthState;
  (window as any).resetAuth = resetAuthState;
}