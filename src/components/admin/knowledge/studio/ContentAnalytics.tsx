import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, Users, Eye, FileText, Target, Star,
  Calendar, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const ContentAnalytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ['content-analytics'],
    queryFn: async () => {
      // Get content stats
      const { data: items } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (name, color),
          knowledge_use_cases (id, case_type)
        `);

      if (!items) return null;

      const totalItems = items.length;
      const publishedItems = items.filter(item => item.is_published).length;
      const draftItems = totalItems - publishedItems;
      const featuredItems = items.filter(item => item.is_featured).length;
      const totalViews = items.reduce((sum, item) => sum + (item.view_count || 0), 0);
      const totalUseCases = items.reduce((sum, item) => sum + (item.knowledge_use_cases?.length || 0), 0);

      // Content health metrics
      const healthyItems = items.filter(item => {
        let score = 0;
        if (item.description) score += 25;
        if (item.knowledge_use_cases?.length > 0) score += 25;
        if (item.category_id) score += 20;
        if (item.planning_focus_id) score += 15;
        if (item.domain_id) score += 15;
        return score >= 70;
      }).length;

      // Category breakdown
      const categoryStats = items.reduce((acc, item) => {
        const category = item.knowledge_categories?.name || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { 
            name: category, 
            count: 0, 
            views: 0,
            color: item.knowledge_categories?.color || '#8B5CF6'
          };
        }
        acc[category].count++;
        acc[category].views += item.view_count || 0;
        return acc;
      }, {} as Record<string, { name: string; count: number; views: number; color: string }>);

      // Top performing content
      const topContent = items
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 10);

      return {
        overview: {
          totalItems,
          publishedItems,
          draftItems,
          featuredItems,
          totalViews,
          totalUseCases,
          healthyItems
        },
        categories: Object.values(categoryStats),
        topContent,
        trends: [
          { month: 'Jan', items: 45, views: 1200 },
          { month: 'Feb', items: 52, views: 1450 },
          { month: 'Mar', items: 61, views: 1800 },
          { month: 'Apr', items: 68, views: 2100 },
          { month: 'May', items: 78, views: 2400 },
          { month: 'Jun', items: 89, views: 2800 }
        ]
      };
    },
  });

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { overview, categories, topContent, trends } = analytics;
  
  // Type the categories properly
  const typedCategories = categories as Array<{ name: string; count: number; views: number; color: string }>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Content Analytics</h2>
        <p className="text-muted-foreground">
          Insights into your knowledge base performance and content health
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalItems}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalViews.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
              +18% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.publishedItems}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((overview.publishedItems / overview.totalItems) * 100)}% of total content
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.healthyItems}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((overview.healthyItems / overview.totalItems) * 100)}% are complete
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="items" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Items"
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary-glow))" 
                  strokeWidth={2}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typedCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typedCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{category.count} items</span>
                  <span>{category.views} views</span>
                  <Progress 
                    value={(category.count / overview.totalItems) * 100} 
                    className="w-16 h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topContent.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{item.view_count || 0}</span>
                  </div>
                  {item.is_featured && (
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  )}
                  <Badge variant={item.is_published ? 'default' : 'secondary'}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};