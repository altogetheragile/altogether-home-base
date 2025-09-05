import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Eye, EyeOff, Edit, Trash2, MoreHorizontal, FileText, Target, 
  Clock, TrendingUp, Copy, Archive, Star, StarOff, Share, ExternalLink 
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
          planning_layers (id, name, slug, color, display_order),
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
        planning_layers: undefined,
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
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {items?.length || 0} items total
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="min-w-[300px]">Item</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Use Cases</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  aria-label={`Select ${item.name}`}
                />
              </TableCell>
              
              <TableCell>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      {item.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">
                        {item.name}
                      </h4>
                      {item.is_featured && (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      /{item.slug}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="space-y-1.5">
                  {item.knowledge_categories && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
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
                      className="text-xs"
                      style={{ 
                        borderColor: item.planning_layers.color, 
                        color: item.planning_layers.color 
                      }}
                    >
                      {item.planning_layers.name}
                    </Badge>
                  )}
                  {item.activity_domains && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: item.activity_domains.color, 
                        color: item.activity_domains.color 
                      }}
                    >
                      {item.activity_domains.name}
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{item.knowledge_use_cases?.filter(uc => uc.case_type === 'generic').length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    <span>{item.knowledge_use_cases?.filter(uc => uc.case_type === 'example').length || 0}</span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{item.view_count || 0} views</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_published ? 'default' : 'secondary'}>
                    {item.is_published ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                </div>
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Content
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreview(item)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview in New Tab
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(item)}>
                      <Share className="h-4 w-4 mr-2" />
                      Copy Share Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleFeatured(item)}>
                      {item.is_featured ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Remove from Featured
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Add to Featured
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePublished(item)}>
                      {item.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleArchive(item)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          
          {!items?.length && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No knowledge items found</h3>
                  <p className="text-sm">Try adjusting your filters or create a new item</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};