import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import RecentActivityFeed from "@/components/admin/RecentActivityFeed";
import { useAdminStats } from "@/hooks/useAdminStats";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your system metrics and recent activity
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </Link>
          <Link to="/knowledge">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Manage Knowledge
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} isLoading={isLoading} />

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>
            Latest actions performed by administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>

      {/* Additional Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link to="/admin/logs/audit">
              <Button variant="outline" className="w-full">
                View Audit Logs
              </Button>
            </Link>
            <Link to="/admin/moderation">
              <Button variant="outline" className="w-full">
                Moderate Comments
              </Button>
            </Link>
            <Link to="/admin/knowledge/analytics">
              <Button variant="outline" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link to="/admin/imports">
              <Button variant="outline" className="w-full">
                Import Data
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
