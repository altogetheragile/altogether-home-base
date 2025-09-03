import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ContentFilters } from '../ContentStudioDashboard';
import { EnhancedKnowledgeCard } from '../enhanced/EnhancedKnowledgeCard';

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
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-xl h-96"></div>
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

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((item) => (
          <EnhancedKnowledgeCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={(checked) => handleSelectItem(item.id, checked)}
            onEdit={() => onEdit(item)}
          />
        ))}
      </div>
    </div>
  );
};