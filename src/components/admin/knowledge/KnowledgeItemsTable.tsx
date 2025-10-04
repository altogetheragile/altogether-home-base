import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, Trash2, MoreHorizontal, 
  Clock, Copy, Archive, Star, StarOff, Share, ExternalLink 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KnowledgeItemsFiltersType } from './KnowledgeItemsDashboard';
import { useDeleteKnowledgeItem, useUpdateKnowledgeItem, useCreateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeItemsTableProps {
  filters: KnowledgeItemsFiltersType;
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onEdit: (item: any) => void;
}

export const KnowledgeItemsTable = ({
  filters,
  selectedItems,
  onSelectionChange,
  onEdit
}: KnowledgeItemsTableProps) => {
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-knowledge-items-table', filters],
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

      // Apply filters
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

  const deleteKnowledgeItem = useDeleteKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();
  const createKnowledgeItem = useCreateKnowledgeItem();
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items?.map(item => item.id) || []);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const toggleFeatured = async (item: any) => {
    await updateKnowledgeItem.mutateAsync({
      id: item.id,
      is_featured: !item.is_featured
    });
  };

  const togglePublished = async (item: any) => {
    await updateKnowledgeItem.mutateAsync({
      id: item.id,
      is_published: !item.is_published
    });
  };

  const handlePreview = (item: any) => {
    if (item.is_published) {
      window.open(`/knowledge/${item.slug}`, '_blank');
    } else {
      toast({
        title: "Preview unavailable",
        description: "This item needs to be published before it can be previewed.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (item: any) => {
    const url = `${window.location.origin}/knowledge/${item.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The knowledge item link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy link",
        description: "Please try copying the link manually.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicate = async (item: any) => {
    try {
      const duplicatedItem = {
        ...item,
        name: `${item.name} (Copy)`,
        slug: `${item.slug}-copy-${Date.now()}`,
        is_published: false,
        is_featured: false,
        view_count: 0,
        // Remove ID and timestamps
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        created_by: undefined,
        updated_by: undefined,
        // Remove relations
        knowledge_categories: undefined,
        planning_focuses: undefined,
        activity_domains: undefined,
        knowledge_use_cases: undefined
      };

      await createKnowledgeItem.mutateAsync(duplicatedItem);
      toast({
        title: "Item duplicated!",
        description: "A copy of the knowledge item has been created.",
      });
    } catch (err) {
      toast({
        title: "Failed to duplicate",
        description: "There was an error duplicating the knowledge item.",
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (item: any) => {
    await updateKnowledgeItem.mutateAsync({
      id: item.id,
      is_published: false
    });
    toast({
      title: "Item archived",
      description: "The knowledge item has been unpublished and archived.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allSelected = items?.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < (items?.length || 0);

  return (
    <div className="bg-card rounded border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="py-2">Title</TableHead>
            <TableHead className="py-2 text-right">Cases</TableHead>
            <TableHead className="py-2 text-right">Views</TableHead>
            <TableHead className="py-2">Status</TableHead>
            <TableHead className="py-2">Updated</TableHead>
            <TableHead className="w-16 py-2"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell className="py-2">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  aria-label={`Select ${item.name}`}
                />
              </TableCell>
              
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.is_featured && (
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
              </TableCell>

              <TableCell className="py-2 text-right">
                <span className="text-xs text-muted-foreground">
                  {item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0}/
                  {item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0}
                </span>
              </TableCell>

              <TableCell className="py-2 text-right">
                <span className="text-xs text-muted-foreground">{item.view_count || 0}</span>
              </TableCell>

              <TableCell className="py-2">
                <Badge 
                  variant={item.is_published ? 'default' : 'secondary'}
                  className="text-[10px] h-5 px-1.5"
                >
                  {item.is_published ? 'Published' : 'Draft'}
                </Badge>
              </TableCell>

              <TableCell className="py-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.updated_at), { addSuffix: false }).replace('about ', '')}
                </span>
              </TableCell>

              <TableCell className="py-2">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreview(item)}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(item)}>
                      <Share className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleFeatured(item)}>
                      {item.is_featured ? (
                        <>
                          <StarOff className="h-3.5 w-3.5 mr-1.5" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 mr-1.5" />
                          Feature
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePublished(item)}>
                      {item.is_published ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleArchive(item)}>
                      <Archive className="h-3.5 w-3.5 mr-1.5" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              </TableCell>
            </TableRow>
          ))}
          
          {!items?.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <p className="text-sm text-muted-foreground">No items found</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};