import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  BookOpen, 
  Users, 
  Ticket, 
  CreditCard, 
  Activity 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalEvents: number;
  totalKnowledgeItems: number;
  totalUsers: number;
  totalRegistrations: number;
  paidRegistrations: number;
  unpaidRegistrations: number;
  recentActions: number;
}

interface AdminStatsCardsProps {
  stats?: AdminStats;
  isLoading: boolean;
}

const AdminStatsCards = ({ stats, isLoading }: AdminStatsCardsProps) => {
  const statsConfig = [
    {
      title: "Published Events",
      value: stats?.totalEvents || 0,
      icon: Calendar,
      description: "Active event listings",
    },
    {
      title: "Knowledge Items",
      value: stats?.totalKnowledgeItems || 0,
      icon: BookOpen,
      description: "Published articles",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Registered accounts",
    },
    {
      title: "Event Registrations",
      value: stats?.totalRegistrations || 0,
      icon: Ticket,
      description: "All time",
    },
    {
      title: "Paid Registrations",
      value: stats?.paidRegistrations || 0,
      icon: CreditCard,
      description: "Completed payments",
    },
    {
      title: "Recent Actions",
      value: stats?.recentActions || 0,
      icon: Activity,
      description: "Last 7 days",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statsConfig.map((stat) => {
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
              {isLoading ? (
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

export default AdminStatsCards;
