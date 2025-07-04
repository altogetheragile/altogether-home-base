
import { useAuth } from "@/contexts/AuthContext";
import { useUserRegistrations } from "@/hooks/useUserRegistrations";
import { useUserProfile } from "@/hooks/useUserProfile";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RegistrationsList from "@/components/dashboard/RegistrationsList";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: registrations, isLoading } = useUserRegistrations();
  const { data: profile } = useUserProfile();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || user.email}! Here are your event registrations.
            </p>
          </div>
          
          <RegistrationsList registrations={registrations} isLoading={isLoading} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
