import { useQuery } from '@tanstack/react-query';
import { FileText, Target, TrendingUp, Clock, Eye, EyeOff, Edit, MoreHorizontal } from 'lucide-react';
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
import { KnowledgeItemsFiltersType } from './KnowledgeItemsDashboard';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeItemsBoardProps {
  filters: KnowledgeItemsFiltersType;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

interface BoardColumn {
  id: string;
  title: string;
  color: string;
  items: any[];
}

export const KnowledgeItemsBoard = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: KnowledgeItemsBoardProps) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-knowledge-items-board', filters],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_focuses (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type)
        `);

      // Apply filters (same as table/cards)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.categories.length > 0) {
        query = query.in('category_id', filters.categories);
      }

      if (filters.planningLayers.length > 0) {
        query = query.in('planning_focus_id', filters.planningLayers);
      }

      if (filters.domains.length > 0) {
        query = query.in('domain_id', filters.domains);
      }

      // Don't filter by status for board view - we want to see all statuses
      
      query = query.order('updated_at', { ascending: false });

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

  // Organize items by status for board view
  const columns: BoardColumn[] = [
    {
      id: 'draft',
      title: 'Draft',
      color: 'hsl(var(--muted-foreground))',
      items: items?.filter(item => !item.is_published) || []
    },
    {
      id: 'published',
      title: 'Published',
      color: 'hsl(var(--primary))',
      items: items?.filter(item => item.is_published && !item.is_featured) || []
    },
    {
      id: 'featured',
      title: 'Featured',
      color: '#eab308',
      items: items?.filter(item => item.is_published && item.is_featured) || []
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Card key={j} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded w-12"></div>
                        <div className="h-5 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          {/* Column header */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <h3 className="font-semibold text-foreground">{column.title}</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {column.items.length}
            </Badge>
          </div>

          {/* Column items */}
          <div className="space-y-3 min-h-[400px]">
            {column.items.map((item) => (
              <Card 
                key={item.id} 
                className={`group transition-all duration-200 hover:shadow-md cursor-pointer ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => onEdit(item)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
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
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 rounded">
                          <AvatarFallback className="rounded bg-primary/10 text-primary text-xs font-medium">
                            {item.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 text-foreground">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Classification */}
                      <div className="flex flex-wrap gap-1">
                        {item.knowledge_categories && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1.5 py-0.5"
                            style={{ 
                              backgroundColor: `${item.knowledge_categories.color}15`, 
                              color: item.knowledge_categories.color
                            }}
                          >
                            {item.knowledge_categories.name}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
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
                      </div>

                      {/* Updated */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {column.items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">No items in {column.title.toLowerCase()}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};