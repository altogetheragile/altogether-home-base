import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, Search, ThumbsUp, Users, FileText, Target, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export const ContentAnalyticsDashboard = () => {
  // Analytics queries
  const { data: topTechniques } = useQuery({
    queryKey: ['analytics', 'top-techniques'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_techniques')
        .select('name, view_count, popularity_score')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: searchAnalytics } = useQuery({
    queryKey: ['analytics', 'search-queries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('search_analytics')
        .select('query, results_count')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Group by query and count occurrences
      const queryGroups = data?.reduce((acc: any, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
      }, {}) || {};
      
      return Object.entries(queryGroups)
        .map(([query, count]) => ({ query, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
    },
  });

  const { data: categoryStats } = useQuery({
    queryKey: ['analytics', 'category-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_techniques')
        .select(`
          category_id,
          knowledge_categories!inner(name)
        `)
        .eq('is_published', true);
      
      const categoryGroups = data?.reduce((acc: any, item) => {
        const categoryName = (item.knowledge_categories as any)?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {}) || {};
      
      return Object.entries(categoryGroups).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: contentQuality } = useQuery({
    queryKey: ['analytics', 'content-quality'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_techniques')
        .select('name, description, purpose, summary, image_url, is_complete')
        .eq('is_published', true);
      
      return data?.map(technique => {
        let score = 0;
        let maxScore = 6;
        
        if (technique.description) score += 2;
        if (technique.purpose) score += 1;
        if (technique.summary) score += 1;
        if (technique.image_url) score += 1;
        if (technique.is_complete) score += 1;
        
        const percentage = (score / maxScore) * 100;
        let status = 'Poor';
        if (percentage >= 80) status = 'Excellent';
        else if (percentage >= 60) status = 'Good';
        else if (percentage >= 40) status = 'Fair';
        
        return {
          name: technique.name,
          score: percentage,
          status
        };
      }) || [];
    },
  });

  const { data: feedbackStats } = useQuery({
    queryKey: ['analytics', 'feedback-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('kb_feedback')
        .select(`
          rating,
          knowledge_techniques!inner(name)
        `)
        .not('rating', 'is', null);
      
      const techniqueRatings = data?.reduce((acc: any, feedback) => {
        const techniqueName = (feedback.knowledge_techniques as any)?.name;
        if (!acc[techniqueName]) {
          acc[techniqueName] = { ratings: [], count: 0 };
        }
        acc[techniqueName].ratings.push(feedback.rating);
        acc[techniqueName].count++;
        return acc;
      }, {}) || {};
      
      return Object.entries(techniqueRatings).map(([name, data]: [string, any]) => ({
        name,
        avgRating: data.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / data.ratings.length,
        totalRatings: data.count
      })).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
    },
  });

  const overviewStats = [
    {
      title: 'Total Techniques',
      value: topTechniques?.length || 0,
      icon: FileText,
      trend: '+12%',
      color: 'text-blue-600'
    },
    {
      title: 'Total Views',
      value: topTechniques?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0,
      icon: Eye,
      trend: '+23%',
      color: 'text-green-600'
    },
    {
      title: 'Search Queries',
      value: searchAnalytics?.reduce((sum: number, s: any) => sum + s.count, 0) || 0,
      icon: Search,
      trend: '+8%',
      color: 'text-purple-600'
    },
    {
      title: 'Avg. Rating',
      value: feedbackStats && feedbackStats.length > 0 
        ? (feedbackStats.reduce((sum, f) => sum + f.avgRating, 0) / feedbackStats.length).toFixed(1)
        : '0.0',
      icon: ThumbsUp,
      trend: '+5%',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Analytics Dashboard</h3>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {overviewStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.trend}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content Quality</TabsTrigger>
          <TabsTrigger value="search">Search Insights</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performing Techniques</CardTitle>
                <CardDescription>By view count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topTechniques?.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="view_count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Techniques by Category</CardTitle>
                <CardDescription>Distribution overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryStats?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Quality Overview</CardTitle>
              <CardDescription>Completeness scores for published techniques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentQuality?.slice(0, 15).map((technique, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{technique.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${technique.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">
                          {technique.score.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        technique.status === 'Excellent' ? 'default' :
                        technique.status === 'Good' ? 'secondary' :
                        technique.status === 'Fair' ? 'outline' : 'destructive'
                      }
                      className="ml-3"
                    >
                      {technique.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular Search Queries</CardTitle>
              <CardDescription>Most frequently searched terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchAnalytics?.map((query: any, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="font-medium">{query.query}</span>
                    <Badge variant="secondary">{query.count} searches</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Rated Techniques</CardTitle>
              <CardDescription>Average user ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedbackStats?.map((technique, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{technique.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {technique.totalRatings} rating{technique.totalRatings !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {technique.avgRating.toFixed(1)}★
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};