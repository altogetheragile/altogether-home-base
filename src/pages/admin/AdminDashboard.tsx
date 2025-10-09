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
          <Link to="/admin/knowledge/items/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Knowledge Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} isLoading={isLoading} />

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card className="md:col-span-1">
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

        {/* Quick Stats Summary */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>
              Summary of your content distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Published Events</p>
                    <p className="text-xs text-muted-foreground">Active listings</p>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Knowledge Items</p>
                    <p className="text-xs text-muted-foreground">Published articles</p>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalKnowledgeItems || 0}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-xs text-muted-foreground">Registered accounts</p>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Event Registrations</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
