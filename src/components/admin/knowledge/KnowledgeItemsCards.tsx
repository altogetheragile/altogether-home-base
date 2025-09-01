import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Star 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { KnowledgeItemsFilters } from './KnowledgeItemsDashboard';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeItemsCardsProps {
  filters: KnowledgeItemsFilters;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

export const KnowledgeItemsCards = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: KnowledgeItemsCardsProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-knowledge-items-cards', filters],
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

      // Apply filters (same as table)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.categories.length > 0) {
        query = query.in('category_id', filters.categories);
      }

      if (filters.planningLayers.length > 0) {
        query = query.in('planning_layer_id', filters.planningLayers);
      }

      if (filters.domains.length > 0) {
        query = query.in('domain_id', filters.domains);
      }

      if (filters.status !== 'all') {
        query = query.eq('is_published', filters.status === 'published');
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        case 'popularity':
          query = query.order('view_count', { ascending: false });
          break;
        case 'views':
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-muted rounded-lg"></div>
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
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No knowledge items found</h3>
          <p className="text-sm">Try adjusting your filters or create a new item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items?.map((item) => (
        <Card 
          key={item.id} 
          className={`group transition-all duration-200 hover:shadow-md cursor-pointer ${
            selectedItems.includes(item.id) ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => onEdit(item)}
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with checkbox and menu */}
              <div className="flex items-start justify-between">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${item.name}`}
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      {item.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-2">
                        {item.name}
                      </h4>
                      {item.is_featured && (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Classification badges */}
                <div className="flex flex-wrap gap-1.5">
                  {item.knowledge_categories && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5"
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
                      className="text-xs px-2 py-0.5"
                      style={{ 
                        borderColor: item.planning_layers.color, 
                        color: item.planning_layers.color 
                      }}
                    >
                      {item.planning_layers.name}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{item.view_count || 0}</span>
                    </div>
                  </div>
                  
                  <Badge variant={item.is_published ? 'default' : 'secondary'} className="text-xs">
                    {item.is_published ? (
                      <Eye className="h-2.5 w-2.5 mr-1" />
                    ) : (
                      <EyeOff className="h-2.5 w-2.5 mr-1" />
                    )}
                    {item.is_published ? 'Live' : 'Draft'}
                  </Badge>
                </div>

                {/* Updated timestamp */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};