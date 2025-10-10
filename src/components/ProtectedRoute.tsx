
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import AccessDenied from '@/components/AccessDenied';
import { supabase } from '@/integrations/supabase/client';
import { resetAuthState } from '@/utils/authDebug';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requireAAL2?: boolean;
}

const ProtectedRoute = ({ children, requiredRole = 'admin', requireAAL2 = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [aalLevel, setAalLevel] = useState<string | null>(null);
  const [aalLoading, setAalLoading] = useState<boolean>(false);
  const [hasMfaFactors, setHasMfaFactors] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const checkAal = async () => {
      if (!requireAAL2 || !user) {
        setAalLevel(null);
        setHasMfaFactors(false);
        return;
      }
      setAalLoading(true);
      try {
        // Check if user has MFA factors configured
        const { data: factors } = await (supabase as any).auth.mfa.listFactors();
        const verifiedTotp = factors?.all?.find((f: any) => 
          (f.type === 'totp' || f.factor_type === 'totp') && 
          (f.status === 'verified' || f.factor_status === 'verified')
        );
        setHasMfaFactors(!!verifiedTotp);

        // Only check AAL if user has MFA configured
        if (verifiedTotp) {
          const { data } = await (supabase as any).auth.mfa.getAuthenticatorAssuranceLevel();
          if (!cancelled) setAalLevel(data?.currentLevel ?? null);
        } else {
          // No MFA configured, so AAL2 not required
          if (!cancelled) setAalLevel('aal1');
        }
      } catch {
        if (!cancelled) {
          setAalLevel(null);
          setHasMfaFactors(false);
        }
      } finally {
        if (!cancelled) setAalLoading(false);
      }
    };
    checkAal();
    return () => { cancelled = true; };
  }, [requireAAL2, user]);
  // Debug logging for loading states
  console.log('🔍 ProtectedRoute Debug:', {
    loading,
    roleLoading,
    requireAAL2,
    aalLoading,
    aalLevel,
    userRole,
    userId: user?.id,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  // Add session debugging
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 ProtectedRoute Session Check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          sessionUserId: session?.user?.id,
          sessionUserEmail: session?.user?.email,
          sessionError: error,
          accessToken: session?.access_token ? 'present' : 'missing'
        });
      } catch (err) {
        console.error('❌ ProtectedRoute Session Error:', err);
      }
    };
    
    if (user) {
      checkSession();
    }
  }, [user]);

  // Show enhanced loading state while checking authentication, role, and AAL level (if required)
  if (loading || roleLoading || (requireAAL2 && (aalLoading || aalLevel === null))) {
    const loadingReasons = [];
    if (loading) loadingReasons.push('auth');
    if (roleLoading) loadingReasons.push('role'); 
    if (requireAAL2 && aalLoading) loadingReasons.push('mfa');
    if (requireAAL2 && aalLevel === null) loadingReasons.push('mfa-level');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Checking {loadingReasons.join(', ')}...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 max-w-md space-y-2">
              <p>Debug: loading={String(loading)}, roleLoading={String(roleLoading)}</p>
              <p>User: {user?.email || 'none'}, Role: {userRole || 'none'}</p>
              <button 
                onClick={resetAuthState}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Reset Auth State
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show AccessDenied component instead of redirecting home
  if (userRole !== requiredRole) {
    return (
      <AccessDenied 
        title="Admin Access Required"
        message={`You need ${requiredRole} privileges to access this page. Your current role is: ${userRole || 'user'}.`}
      />
    );
  }

  // Enforce AAL2 if user has MFA configured
  if (requireAAL2 && hasMfaFactors && aalLevel !== 'aal2') {
    // Store redirect intent
    sessionStorage.setItem('mfa:prompt', 'true');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
