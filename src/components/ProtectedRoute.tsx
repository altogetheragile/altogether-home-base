
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import AccessDenied from '@/components/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole = 'admin' }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  // Show enhanced loading state while checking authentication and role
  if (loading || roleLoading) {
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

  return <>{children}</>;
};

export default ProtectedRoute;
