import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, FolderOpen, Layers, Target, Settings } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useClassificationConfig, useUpdateClassificationConfig } from '@/hooks/useClassificationConfig';

type ClassificationType = 'categories' | 'planning-focuses' | 'activity-domains';

interface Classification {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  display_order?: number;
  full_description?: string;
  created_at: string;
  updated_at: string;
}

const AdminClassifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ClassificationType>('categories');
  const [showForm, setShowForm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Classification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    full_description: '',
    color: '#3B82F6',
    display_order: 0,
  });
  const { data: configs } = useClassificationConfig();
  const updateConfig = useUpdateClassificationConfig();

  const getTableName = (type: ClassificationType) => {
    switch (type) {
      case 'categories': return 'knowledge_categories';
      case 'planning-focuses': return 'planning_focuses';
      case 'activity-domains': return 'activity_domains';
    }
  };

  const getQueryKey = (type: ClassificationType) => `admin-${type}`;

  const { data: items, isLoading } = useQuery({
    queryKey: [getQueryKey(activeTab)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(getTableName(activeTab))
        .select('*')
        .order(activeTab === 'planning-focuses' ? 'display_order' : 'name');
      
      if (error) throw error;
      return data as Classification[];
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
    const submitData = { ...formData };
    
    // Only include relevant fields for each type
    if (activeTab !== 'activity-domains') {
      delete submitData.full_description;
    }
    if (activeTab !== 'planning-focuses') {
      delete submitData.display_order;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (item: Classification) => {
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

  const handleDelete = (item: Classification) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTabConfig = (type: ClassificationType) => {
    switch (type) {
      case 'categories':
        return {
          label: 'Categories',
          icon: FolderOpen,
          description: 'Organize knowledge items into categories',
          addLabel: 'Add Category'
        };
      case 'planning-focuses':
        return {
          label: 'Planning Focuses',
          icon: Layers,
          description: 'Define different planning focus areas',
          addLabel: 'Add Planning Focus'
        };
      case 'activity-domains':
        return {
          label: 'Domains of Interest',
          icon: Target,
          description: 'Manage activity domains and areas of interest',
          addLabel: 'Add Domain'
        };
    }
  };

  const tabConfig = getTabConfig(activeTab);

  // Get visible tabs based on configuration
  const visibleTabs = configs?.filter(c => c.is_visible).sort((a, b) => a.display_order - b.display_order) || [];
  const getTabType = (type: string): ClassificationType => {
    const mapping: Record<string, ClassificationType> = {
      'categories': 'categories',
      'planning-focuses': 'planning-focuses',
      'activity-domains': 'activity-domains'
    };
    return mapping[type] || 'categories';
  };

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
                <FolderOpen className="h-6 w-6" />
                <span>Classifications Management</span>
              </CardTitle>
              <CardDescription>
                Manage all classification systems for knowledge items in one place
              </CardDescription>
            </div>
            <Button onClick={() => setShowConfigDialog(true)} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure Visibility
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ClassificationType)}>
            <TabsList className={`grid w-full grid-cols-${visibleTabs.length}`}>
              {visibleTabs.map(config => {
                const tabType = getTabType(config.classification_type);
                const tabConfigInfo = getTabConfig(tabType);
                return (
                  <TabsTrigger key={config.id} value={tabType} className="flex items-center space-x-2">
                    <tabConfigInfo.icon className="h-4 w-4" />
                    <span>{config.custom_label || tabConfigInfo.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(['categories', 'planning-focuses', 'activity-domains'] as ClassificationType[]).map((type) => (
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
                      placeholder={`Search ${type}...`}
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
                        {type === 'planning-focuses' && <TableHead>Order</TableHead>}
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems?.map((item) => (
                        <TableRow key={item.id}>
                          {type === 'planning-focuses' && (
                            <TableCell className="font-medium">{item.display_order}</TableCell>
                          )}
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: item.color }}
                              />
                              <Badge style={{ backgroundColor: item.color + '20', color: item.color }}>
                                {item.color}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={type === 'planning-focuses' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? `No ${type} found matching your search.` : `No ${type} created yet.`}
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
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            {activeTab === 'activity-domains' && (
              <div>
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                />
              </div>
            )}
            {activeTab === 'planning-focuses' && (
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Classification Visibility</DialogTitle>
            <DialogDescription>
              Control which classification types are visible throughout the application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {configs?.sort((a, b) => a.display_order - b.display_order).map(config => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={config.is_visible}
                        onCheckedChange={(checked) => {
                          updateConfig.mutate({
                            id: config.id,
                            updates: { is_visible: checked }
                          });
                        }}
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {config.custom_label || config.classification_type}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {config.is_visible ? 'Visible in editor and filters' : 'Hidden from application'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={config.is_visible ? 'default' : 'secondary'}>
                      {config.is_visible ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`label-${config.id}`}>Custom Label</Label>
                      <Input
                        id={`label-${config.id}`}
                        value={config.custom_label || ''}
                        onBlur={(e) => {
                          if (e.target.value !== config.custom_label) {
                            updateConfig.mutate({
                              id: config.id,
                              updates: { custom_label: e.target.value }
                            });
                          }
                        }}
                        placeholder="Enter custom label"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`order-${config.id}`}>Display Order</Label>
                      <Input
                        id={`order-${config.id}`}
                        type="number"
                        defaultValue={config.display_order}
                        onBlur={(e) => {
                          const newOrder = parseInt(e.target.value);
                          if (newOrder !== config.display_order) {
                            updateConfig.mutate({
                              id: config.id,
                              updates: { display_order: newOrder }
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClassifications;