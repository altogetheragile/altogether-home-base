import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Search, Eye, MessageSquare, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const ContentAnalyticsDashboard = () => {
  const { data: analytics } = useQuery({
    queryKey: ['content-analytics'],
    queryFn: async () => {
      // Get top viewed techniques
      const { data: topViewed } = await supabase
        .from('knowledge_techniques')
        .select('name, view_count, slug')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(10);

      // Get search analytics
      const { data: searchStats } = await supabase
        .from('search_analytics')
        .select('query, results_count, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Get feedback stats
      const { data: feedbackStats } = await supabase
        .from('kb_feedback')
        .select('rating, created_at, technique_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const totalViews = topViewed?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0;
      const totalSearches = searchStats?.length || 0;
      const avgRating = feedbackStats?.length 
        ? feedbackStats.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackStats.length 
        : 0;

      // Popular searches
      const searchCounts = searchStats?.reduce((acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const popularSearches = Object.entries(searchCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }));

      // Failed searches (0 results)
      const failedSearches = searchStats?.filter(s => s.results_count === 0) || [];
      const failedQueries = failedSearches.reduce((acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topFailedSearches = Object.entries(failedQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }));

      return {
        totalViews,
        totalSearches,
        avgRating,
        topViewed: topViewed || [],
        popularSearches,
        topFailedSearches,
        searchSuccessRate: totalSearches > 0 
          ? ((totalSearches - failedSearches.length) / totalSearches * 100).toFixed(1)
          : '0'
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Analytics</h2>
        <p className="text-muted-foreground">Performance insights for your knowledge base</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalViews?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSearches?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.searchSuccessRate || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgRating?.toFixed(1) || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Content */}
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Techniques</CardTitle>
            <CardDescription>Popular content in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topViewed?.slice(0, 8).map((technique, index) => (
                <div key={technique.slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate">{technique.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {technique.view_count || 0}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
            <CardDescription>Most common search queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.popularSearches?.map((search, index) => (
                <div key={search.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">"{search.query}"</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Search className="h-3 w-3" />
                    {search.count}
                  </div>
                </div>
              ))}
              {!analytics?.popularSearches?.length && (
                <p className="text-sm text-muted-foreground">No search data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Failed Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Content Gaps</CardTitle>
            <CardDescription>Searches with no results - content opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topFailedSearches?.map((search, index) => (
                <div key={search.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">"{search.query}"</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Search className="h-3 w-3" />
                    {search.count} failed
                  </div>
                </div>
              ))}
              {!analytics?.topFailedSearches?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  🎉 No failed searches! All queries are finding results.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Count Chart */}
        <Card>
          <CardHeader>
            <CardTitle>View Distribution</CardTitle>
            <CardDescription>Content engagement overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics?.topViewed?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="view_count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};