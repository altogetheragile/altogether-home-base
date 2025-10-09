import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegistrationsList from "@/components/dashboard/RegistrationsList";
import { ProjectsList } from "@/components/dashboard/ProjectsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { useUserRegistrations } from "@/hooks/useUserRegistrations";
import { Calendar, FolderKanban } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: registrations = [], isLoading: registrationsLoading } = useUserRegistrations();

  const upcomingRegistrations = registrations.filter(
    (reg) => reg.event && new Date(reg.event.start_date) > new Date()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your activity
          </p>
        </div>

        {/* Stats Cards */}
        <DashboardStats />

        {/* Main Content - Tabs */}
        <Tabs defaultValue="events" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>My Events</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <FolderKanban className="h-4 w-4" />
              <span>My Projects</span>
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Registrations</CardTitle>
                <CardDescription>
                  View and manage your event registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationsList 
                  registrations={registrations} 
                  isLoading={registrationsLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  Manage your project canvases and work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
