import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, FolderKanban, TrendingUp } from "lucide-react";
import { useUserRegistrations } from "@/hooks/useUserRegistrations";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardStats = () => {
  const { data: registrations = [], isLoading: registrationsLoading } = useUserRegistrations();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const upcomingEvents = registrations.filter(
    (reg) => reg.event && new Date(reg.event.start_date) > new Date()
  );

  const paidRegistrations = registrations.filter(
    (reg) => reg.payment_status === 'paid'
  );

  const stats = [
    {
      title: "Total Registrations",
      value: registrations.length,
      icon: Calendar,
      description: "All time",
      loading: registrationsLoading,
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.length,
      icon: TrendingUp,
      description: "Events ahead",
      loading: registrationsLoading,
    },
    {
      title: "Completed Payments",
      value: paidRegistrations.length,
      icon: CheckCircle2,
      description: "Paid events",
      loading: registrationsLoading,
    },
    {
      title: "My Projects",
      value: projects.length,
      icon: FolderKanban,
      description: "Active projects",
      loading: projectsLoading,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
