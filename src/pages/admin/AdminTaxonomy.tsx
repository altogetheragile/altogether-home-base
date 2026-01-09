import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, FolderOpen, Layers, Target, Tag, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TaxonomyType = 'decision-levels' | 'categories' | 'domains' | 'tags';

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  display_order?: number;
  full_description?: string;
  usage_count?: number;
  created_at: string;
  updated_at?: string;
}

const AdminTaxonomy = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TaxonomyType>('decision-levels');
  const [showForm, setShowForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingItem, setViewingItem] = useState<TaxonomyItem | null>(null);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    full_description: '',
    color: '#3B82F6',
    display_order: 0,
  });

  const getTableName = (type: TaxonomyType) => {
    switch (type) {
      case 'decision-levels': return 'decision_levels';
      case 'categories': return 'knowledge_categories';
      case 'domains': return 'activity_domains';
      case 'tags': return 'knowledge_tags';
    }
  };

  const getQueryKey = (type: TaxonomyType) => `admin-taxonomy-${type}`;

  const { data: items, isLoading } = useQuery({
    queryKey: [getQueryKey(activeTab)],
    queryFn: async () => {
      const tableName = getTableName(activeTab);
      const orderColumn = activeTab === 'tags' ? 'name' : 
                         activeTab === 'domains' ? 'name' : 'display_order';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(orderColumn);
      
      if (error) throw error;
      return data as TaxonomyItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from(getTableName(activeTab))
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey(activeTab)] });
      toast({ title: 'Success', description: 'Item created successfully' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from(getTableName(activeTab))
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey(activeTab)] });
      toast({ title: 'Success', description: 'Item updated successfully' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(getTableName(activeTab))
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey(activeTab)] });
      toast({ title: 'Success', description: 'Item deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', slug: '', description: '', full_description: '', color: '#3B82F6', display_order: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { name: formData.name, slug: formData.slug };
    
    // Add fields based on type
    if (activeTab !== 'tags') {
      submitData.description = formData.description;
      submitData.color = formData.color;
    }
    if (activeTab === 'decision-levels' || activeTab === 'categories') {
      submitData.display_order = formData.display_order;
    }
    if (activeTab === 'domains') {
      submitData.full_description = formData.full_description;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleView = (item: TaxonomyItem) => {
    setViewingItem(item);
    setShowViewDialog(true);
  };

  const handleEditFromView = () => {
    if (viewingItem) {
      setEditingItem(viewingItem);
      setFormData({
        name: viewingItem.name || '',
        slug: viewingItem.slug || '',
        description: viewingItem.description || '',
        full_description: viewingItem.full_description || '',
        color: viewingItem.color || '#3B82F6',
        display_order: viewingItem.display_order || 0,
      });
      setShowViewDialog(false);
      setShowForm(true);
    }
  };

  const handleEdit = (item: TaxonomyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      full_description: item.full_description || '',
      color: item.color || '#3B82F6',
      display_order: item.display_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = (item: TaxonomyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTabConfig = (type: TaxonomyType) => {
    switch (type) {
      case 'decision-levels':
        return {
          label: 'Decision Levels',
          icon: Layers,
          description: 'Strategic, Coordination, Teams, or General focus areas',
          addLabel: 'Add Decision Level',
          hasOrder: true,
          hasColor: true,
        };
      case 'categories':
        return {
          label: 'Categories',
          icon: FolderOpen,
          description: 'Use-case categories for knowledge items',
          addLabel: 'Add Category',
          hasOrder: true,
          hasColor: true,
        };
      case 'domains':
        return {
          label: 'Domains of Interest',
          icon: Target,
          description: 'Value Ownership, Delivery Enablement, Solution Delivery',
          addLabel: 'Add Domain',
          hasOrder: false,
          hasColor: true,
        };
      case 'tags':
        return {
          label: 'Tags',
          icon: Tag,
          description: 'Free-form tags for flexible categorization',
          addLabel: 'Add Tag',
          hasOrder: false,
          hasColor: false,
        };
    }
  };

  const tabConfig = getTabConfig(activeTab);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-6 w-6" />
                <span>Taxonomy Management</span>
              </CardTitle>
              <CardDescription>
                Manage all classification dimensions: Decision Levels, Categories, Domains, and Tags
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TaxonomyType)}>
            <TabsList className="grid w-full grid-cols-4">
              {(['decision-levels', 'categories', 'domains', 'tags'] as TaxonomyType[]).map(type => {
                const config = getTabConfig(type);
                return (
                  <TabsTrigger key={type} value={type} className="flex items-center space-x-2">
                    <config.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(['decision-levels', 'categories', 'domains', 'tags'] as TaxonomyType[]).map((type) => (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{getTabConfig(type).label}</h2>
                    <p className="text-muted-foreground">{getTabConfig(type).description}</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setActiveTab(type);
                      setShowForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {getTabConfig(type).addLabel}
                  </Button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={`Search ${getTabConfig(type).label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {getTabConfig(type).hasOrder && <TableHead>Order</TableHead>}
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        {getTabConfig(type).hasColor && <TableHead>Color</TableHead>}
                        {type === 'tags' && <TableHead>Usage</TableHead>}
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems?.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleView(item)}
                        >
                          {getTabConfig(type).hasOrder && (
                            <TableCell className="font-medium">{item.display_order}</TableCell>
                          )}
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                          {getTabConfig(type).hasColor && (
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <Badge style={{ backgroundColor: (item.color || '#3B82F6') + '20', color: item.color }}>
                                  {item.color}
                                </Badge>
                              </div>
                            </TableCell>
                          )}
                          {type === 'tags' && (
                            <TableCell>{item.usage_count || 0}</TableCell>
                          )}
                          <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEdit(item, e)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(item, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems?.length === 0 && (
                        <TableRow>
                          <TableCell 
                            colSpan={getTabConfig(type).hasOrder ? (getTabConfig(type).hasColor ? 7 : 6) : (type === 'tags' ? 6 : 5)} 
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm ? `No ${getTabConfig(type).label.toLowerCase()} found matching your search.` : `No ${getTabConfig(type).label.toLowerCase()} created yet.`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingItem?.name}</span>
              <Button onClick={handleEditFromView} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Slug</Label>
              <p className="mt-1 font-mono text-sm">{viewingItem?.slug}</p>
            </div>
            {tabConfig.hasColor && viewingItem?.color && (
              <div>
                <Label className="text-muted-foreground">Color</Label>
                <div className="flex items-center space-x-3 mt-1">
                  <div 
                    className="w-8 h-8 rounded border" 
                    style={{ backgroundColor: viewingItem?.color }}
                  />
                  <Badge style={{ backgroundColor: (viewingItem?.color || '') + '20', color: viewingItem?.color }}>
                    {viewingItem?.color}
                  </Badge>
                </div>
              </div>
            )}
            {tabConfig.hasOrder && (
              <div>
                <Label className="text-muted-foreground">Display Order</Label>
                <p className="mt-1">{viewingItem?.display_order}</p>
              </div>
            )}
            {activeTab === 'tags' && (
              <div>
                <Label className="text-muted-foreground">Usage Count</Label>
                <p className="mt-1">{viewingItem?.usage_count || 0}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1 text-sm">{viewingItem?.description || 'No description'}</p>
            </div>
            {activeTab === 'domains' && viewingItem?.full_description && (
              <div>
                <Label className="text-muted-foreground">Full Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{viewingItem.full_description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="mt-1">{new Date(viewingItem?.created_at || '').toLocaleDateString()}</p>
              </div>
              {viewingItem?.updated_at && (
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="mt-1">{new Date(viewingItem.updated_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${tabConfig.label.slice(0, -1)}` : `Create ${tabConfig.label.slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-friendly-name"
                required
              />
            </div>
            {tabConfig.hasColor && (
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            )}
            {tabConfig.hasOrder && (
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            )}
            {activeTab !== 'tags' && (
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            )}
            {activeTab === 'domains' && (
              <div>
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  placeholder="Enter detailed description"
                  rows={4}
                />
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTaxonomy;
