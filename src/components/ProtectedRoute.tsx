
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import AccessDenied from '@/components/AccessDenied';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // If specified, only users with this role can access. If omitted, all authenticated users can access.
  requireAAL2?: boolean; // If true, require AAL2 MFA for users who have MFA configured
}

const ProtectedRoute = ({ children, requiredRole, requireAAL2 = false }: ProtectedRouteProps) => {
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
          setAalLevel('aal1'); // Non-blocking: treat as AAL1 on error
          setHasMfaFactors(false);
        }
      } finally {
        if (!cancelled) setAalLoading(false);
      }
    };
    checkAal();
    return () => { cancelled = true; };
  }, [requireAAL2, user]);

  // Early redirect for unauthenticated users - no need to show loading
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show enhanced loading state while checking authentication, role, and AAL level (if required)
  if (loading || (user && roleLoading) || (user && requireAAL2 && hasMfaFactors && (aalLoading || aalLevel === null))) {
    const loadingReasons = [];
    if (loading) loadingReasons.push('auth');
    if (user && roleLoading) loadingReasons.push('role'); 
    if (user && requireAAL2 && hasMfaFactors && aalLoading) loadingReasons.push('mfa');
    if (user && requireAAL2 && hasMfaFactors && aalLevel === null) loadingReasons.push('mfa-level');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Checking {loadingReasons.join(', ')}...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only check role if a specific role is required
  if (requiredRole && userRole !== requiredRole) {
    return (
      <AccessDenied 
        title="Access Required"
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
