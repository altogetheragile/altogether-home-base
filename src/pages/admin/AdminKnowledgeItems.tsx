import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, Target } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeleteKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import KnowledgeItemForm from '@/components/admin/knowledge/KnowledgeItemForm';

const AdminKnowledgeItems = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [planningLayerFilter, setPlanningLayerFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Use admin version that shows all items (published and draft)
  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['admin-knowledge-items', { searchTerm, categoryFilter, planningLayerFilter, domainFilter }],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories!knowledge_items_category_id_fkey (id, name, slug, color),
          planning_layers!knowledge_items_planning_layer_id_fkey (id, name, slug, color, display_order),
          activity_domains!knowledge_items_domain_id_fkey (id, name, slug, color),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm && searchTerm.length >= 2) {
        const searchTermEscaped = searchTerm.trim();
        query = query.or(`name.ilike.%${searchTermEscaped}%,description.ilike.%${searchTermEscaped}%`);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (planningLayerFilter && planningLayerFilter !== 'all') {
        query = query.eq('planning_layer_id', planningLayerFilter);
      }

      if (domainFilter && domainFilter !== 'all') {
        query = query.eq('domain_id', domainFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useKnowledgeCategories();
  const { data: planningLayers } = usePlanningLayers();
  const { data: domains } = useActivityDomains();
  // Filter items based on published status if needed
  const filteredItems = items?.filter(item => {
    if (publishedFilter === 'published') return item.is_published;
    if (publishedFilter === 'draft') return !item.is_published;
    return true;
  }) || [];

  const deleteKnowledgeItem = useDeleteKnowledgeItem();

  const handleDelete = async (item: any) => {
    try {
      await deleteKnowledgeItem.mutateAsync(item.id);
      setItemToDelete(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPlanningLayerFilter('all');
    setDomainFilter('all');
    setPublishedFilter('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Knowledge Items</h2>
          <p className="text-gray-600">Manage knowledge base items and content</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Knowledge Item</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search knowledge items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={planningLayerFilter} onValueChange={setPlanningLayerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Layers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Layers</SelectItem>
              {planningLayers?.map((layer) => (
                <SelectItem key={layer.id} value={layer.id}>
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <p className="text-sm text-gray-600">
            {filteredItems?.length || 0} items found
          </p>
        </div>
      </div>

      {/* Knowledge Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Planning Layer</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Use Cases</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.category && (
                    <Badge variant="secondary" style={{ backgroundColor: `${item.category.color}15`, color: item.category.color }}>
                      {item.category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.planning_layer && (
                    <Badge variant="outline" style={{ borderColor: item.planning_layer.color, color: item.planning_layer.color }}>
                      {item.planning_layer.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.activity_domain && (
                    <Badge variant="outline" style={{ borderColor: item.activity_domain.color, color: item.activity_domain.color }}>
                      {item.activity_domain.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>{item.use_cases?.filter(uc => uc.case_type === 'generic').length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Target className="h-3 w-3" />
                      <span>{item.use_cases?.filter(uc => uc.case_type === 'example').length || 0}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{item.view_count || 0}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant={item.is_published ? 'default' : 'secondary'}>
                      {item.is_published ? (
                        <><Eye className="h-3 w-3 mr-1" />Published</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                      )}
                    </Badge>
                    {item.is_featured && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Featured
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredItems?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No knowledge items found. 
                  <Button variant="link" onClick={handleCreate} className="ml-1">
                    Create your first knowledge item
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Knowledge Item Form Dialog */}
      <KnowledgeItemForm
        open={showForm}
        onOpenChange={setShowForm}
        editingItem={editingItem}
        onSuccess={() => {
          setShowForm(false);
          setEditingItem(null);
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone and will also delete all associated use cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(itemToDelete)}
              disabled={deleteKnowledgeItem.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminKnowledgeItems;