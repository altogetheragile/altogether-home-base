import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Star, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ContentFilters } from '../ContentStudioDashboard';
import { formatDistanceToNow } from 'date-fns';

interface ContentKanbanProps {
  filters: ContentFilters;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

const columns = [
  { id: 'draft', title: 'Draft', filter: (item: any) => !item.is_published },
  { id: 'review', title: 'Ready for Review', filter: (item: any) => !item.is_published && item.description },
  { id: 'published', title: 'Published', filter: (item: any) => item.is_published },
  { id: 'featured', title: 'Featured', filter: (item: any) => item.is_featured }
];

export const ContentKanban = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: ContentKanbanProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['content-studio-kanban', filters],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_layers (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type)
        `);

      // Apply search
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        case 'popularity':
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'engagement':
          query = query.order('view_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('updated_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Content Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Drag items between stages to update their status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
        {columns.map((column) => {
          const columnItems = items?.filter(column.filter) || [];
          
          return (
            <div key={column.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{column.title}</h3>
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
                    {columnItems.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-3 min-h-[500px] p-3 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                {columnItems.map((item) => {
                  const useCasesCount = item.knowledge_use_cases?.length || 0;
                  const genericCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0;
                  const exampleCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0;

                  return (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-border/50 hover:border-border"
                      onClick={() => onEdit(item)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                {item.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-start gap-1">
                                <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-snug">
                                  {item.name}
                                </h4>
                                {item.is_featured && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Classification */}
                          {(item.knowledge_categories || item.planning_layers) && (
                            <div className="flex flex-wrap gap-1">
                              {item.knowledge_categories && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0.5"
                                  style={{ 
                                    backgroundColor: `${item.knowledge_categories.color}15`, 
                                    color: item.knowledge_categories.color,
                                    borderColor: `${item.knowledge_categories.color}30`
                                  }}
                                >
                                  {item.knowledge_categories.name}
                                </Badge>
                              )}
                              {item.planning_layers && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-1.5 py-0.5"
                                  style={{ 
                                    borderColor: item.planning_layers.color, 
                                    color: item.planning_layers.color 
                                  }}
                                >
                                  {item.planning_layers.name}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              {useCasesCount > 0 && (
                                <div className="flex items-center gap-0.5 text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  <span>{useCasesCount}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-0.5 text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>{item.view_count || 0}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {columnItems.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No items in {column.title.toLowerCase()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};