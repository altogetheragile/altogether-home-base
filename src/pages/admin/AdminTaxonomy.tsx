import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, FolderOpen, Layers, Target, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TaxonomyViewDialog from './components/TaxonomyViewDialog';
import TaxonomyFormDialog from './components/TaxonomyFormDialog';
import type { TaxonomyType, TaxonomyItem, TaxonomyFormData, TabConfig } from './components/taxonomy-types';

const DEFAULT_FORM_DATA: TaxonomyFormData = {
  name: '',
  slug: '',
  description: '',
  full_description: '',
  color: '#3B82F6',
  display_order: 0,
};

const AdminTaxonomy = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TaxonomyType>('decision-levels');
  const [showForm, setShowForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingItem, setViewingItem] = useState<TaxonomyItem | null>(null);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<TaxonomyFormData>(DEFAULT_FORM_DATA);

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
    mutationFn: async (data: TaxonomyFormData) => {
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
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & TaxonomyFormData) => {
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
    onError: (error: Error) => {
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
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const buildSubmitData = (): Partial<TaxonomyFormData> => {
    const submitData: Partial<TaxonomyFormData> = { name: formData.name, slug: formData.slug };

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

    return submitData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = buildSubmitData();

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...submitData } as { id: string } & TaxonomyFormData);
    } else {
      createMutation.mutate(submitData as TaxonomyFormData);
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

  const handleEdit = (item: TaxonomyItem) => {
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

  const handleDelete = (item: TaxonomyItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Columns are built per tab because the visible columns vary (order / color / usage).
  // Only the active tab's TabsContent mounts, so a plain builder is fine here.
  const columnsFor = (type: TaxonomyType): DataTableColumn<TaxonomyItem>[] => {
    const config = getTabConfig(type);
    const cols: DataTableColumn<TaxonomyItem>[] = [];
    if (config.hasOrder) {
      cols.push({
        id: 'display_order',
        header: 'Order',
        sortable: true,
        sortValue: (i) => i.display_order ?? 0,
        cellClassName: 'font-medium',
        cell: (i) => i.display_order,
      });
    }
    cols.push(
      {
        id: 'name',
        header: 'Name',
        sortable: true,
        sortValue: (i) => i.name,
        cellClassName: 'font-medium',
        cell: (i) => i.name,
      },
      {
        id: 'slug',
        header: 'Slug',
        sortable: true,
        sortValue: (i) => i.slug ?? '',
        cellClassName: 'text-muted-foreground',
        cell: (i) => i.slug,
      },
    );
    if (config.hasColor) {
      cols.push({
        id: 'color',
        header: 'Color',
        cell: (i) => (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: i.color }} />
            <Badge style={{ backgroundColor: (i.color || '#3B82F6') + '20', color: i.color }}>
              {i.color}
            </Badge>
          </div>
        ),
      });
    }
    if (type === 'tags') {
      cols.push({
        id: 'usage',
        header: 'Usage',
        sortable: true,
        sortValue: (i) => i.usage_count || 0,
        cell: (i) => i.usage_count || 0,
      });
    }
    cols.push(
      {
        id: 'description',
        header: 'Description',
        cellClassName: 'max-w-xs truncate',
        cell: (i) => i.description || '-',
      },
      {
        id: 'actions',
        header: 'Actions',
        headClassName: 'w-[100px]',
        cell: (item) => (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    );
    return cols;
  };

  const getTabConfig = (type: TaxonomyType): TabConfig => {
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

                <DataTable
                  data={filteredItems}
                  columns={columnsFor(type)}
                  rowKey={(item) => item.id}
                  onRowClick={(item) => handleView(item)}
                  emptyMessage={
                    searchTerm
                      ? `No ${getTabConfig(type).label.toLowerCase()} found matching your search.`
                      : `No ${getTabConfig(type).label.toLowerCase()} created yet.`
                  }
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <TaxonomyViewDialog
        item={viewingItem}
        tabConfig={tabConfig}
        activeTab={activeTab}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        onEdit={handleEditFromView}
      />

      <TaxonomyFormDialog
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        tabConfig={tabConfig}
        activeTab={activeTab}
        open={showForm}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AdminTaxonomy;
