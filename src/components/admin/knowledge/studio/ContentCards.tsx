import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Star, Users, MessageCircle, Calendar,
  Bookmark, Share, Copy, Archive, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContentFilters } from '../ContentStudioDashboard';
import { formatDistanceToNow } from 'date-fns';

interface ContentCardsProps {
  filters: ContentFilters;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

export const ContentCards = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: ContentCardsProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['content-studio-cards', filters],
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

      // Apply workflow filter
      switch (filters.workflow) {
        case 'drafts':
          query = query.eq('is_published', false);
          break;
        case 'published':
          query = query.eq('is_published', true);
          break;
        case 'high-performing':
          query = query.gte('view_count', 100);
          break;
        case 'needs-attention':
          query = query.or('view_count.lt.10,description.is.null');
          break;
      }

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

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const calculateContentHealth = (item: any) => {
    let score = 0;
    if (item.description) score += 25;
    if (item.knowledge_use_cases?.length > 0) score += 25;
    if (item.category_id) score += 20;
    if (item.planning_layer_id) score += 15;
    if (item.domain_id) score += 15;
    return score;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 bg-muted rounded-xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-6 opacity-30" />
          <h3 className="text-xl font-medium mb-3">No content found</h3>
          <p className="text-sm max-w-md mx-auto">
            {filters.search 
              ? `No items match "${filters.search}". Try adjusting your search or filters.`
              : 'Start building your knowledge base by creating your first item.'
            }
          </p>
          <Button className="mt-6">
            <FileText className="h-4 w-4 mr-2" />
            Create First Item
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{items.length}</span> items found
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items?.map((item) => {
          const healthScore = calculateContentHealth(item);
          const useCasesCount = item.knowledge_use_cases?.length || 0;
          const genericCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0;
          const exampleCount = item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0;

          return (
            <Card 
              key={item.id} 
              className={`group transition-all duration-200 hover:shadow-lg cursor-pointer border-2 ${
                selectedItems.includes(item.id) 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                  : 'border-transparent hover:border-border'
              }`}
              onClick={() => onEdit(item)}
            >
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                    {/* Content Preview */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                            {item.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <h4 className="font-semibold text-foreground text-sm line-clamp-1 leading-snug">
                              {item.name}
                            </h4>
                            {item.is_featured && (
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                </div>

                {/* Classification */}
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.knowledge_categories && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 font-medium"
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
                        className="text-xs px-2 py-0.5 font-medium"
                        style={{ 
                          borderColor: item.planning_layers.color, 
                          color: item.planning_layers.color 
                        }}
                      >
                        {item.planning_layers.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="px-4 py-3 border-t bg-muted/30">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <Badge 
                      variant={item.is_published ? 'default' : 'secondary'} 
                      className="text-xs font-medium"
                    >
                      {item.is_published ? (
                        <>
                          <Eye className="h-2.5 w-2.5 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-2.5 w-2.5 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};