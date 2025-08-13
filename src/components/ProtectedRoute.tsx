
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import AccessDenied from '@/components/AccessDenied';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    let cancelled = false;
    const checkAal = async () => {
      if (!requireAAL2 || !user) {
        setAalLevel(null);
        return;
      }
      setAalLoading(true);
      try {
        const { data } = await (supabase as any).auth.mfa.getAuthenticatorAssuranceLevel();
        if (!cancelled) setAalLevel(data?.currentLevel ?? null);
      } catch {
        if (!cancelled) setAalLevel(null);
      } finally {
        if (!cancelled) setAalLoading(false);
      }
    };
    checkAal();
    return () => { cancelled = true; };
  }, [requireAAL2, user]);
  // Show enhanced loading state while checking authentication, role, and AAL level (if required)
  if (loading || roleLoading || (requireAAL2 && (aalLoading || aalLevel === null))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Checking permissions...</p>
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

  // Enforce AAL2 if requested
  if (requireAAL2 && aalLevel !== 'aal2') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
