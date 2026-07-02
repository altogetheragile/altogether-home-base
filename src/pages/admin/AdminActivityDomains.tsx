import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { useToast } from '@/hooks/use-toast';
import SimpleForm from '@/components/admin/SimpleForm';

interface ActivityDomain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  full_description: string | null;
  color: string | null;
}

const AdminActivityDomains = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const { data: domains, isLoading, refetch } = useQuery({
    queryKey: ['admin-activity-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_domains')
        .select('id, name, slug, description, full_description, color')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    const { name, slug, description, full_description, color } = formData;
    
    if (editingDomain) {
      const { error } = await supabase
        .from('activity_domains')
        .update({
          name,
          slug,
          description,
          full_description,
          color: color || '#3B82F6',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDomain.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('activity_domains')
        .insert({
          name,
          slug,
          description,
          full_description,
          color: color || '#3B82F6',
        });

      if (error) throw error;
    }

    refetch();
  };

  const handleEdit = (domain: any) => {
    setEditingDomain(domain);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity domain?')) return;

    try {
      const { error } = await supabase
        .from('activity_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity domain deleted successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete activity domain.",
        variant: "destructive",
      });
    }
  };

  const formFields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'slug', label: 'Slug', type: 'text' as const, required: true, placeholder: 'unique-slug-for-url' },
    { key: 'description', label: 'Short Description', type: 'textarea' as const },
    { key: 'full_description', label: 'Full Description', type: 'textarea' as const },
    { key: 'color', label: 'Color', type: 'text' as const, placeholder: '#3B82F6' },
  ];

  const columns: DataTableColumn<ActivityDomain>[] = useMemo(() => [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortValue: (d) => d.name,
      cellClassName: 'font-medium',
      cell: (d) => d.name,
    },
    {
      id: 'slug',
      header: 'Slug',
      sortable: true,
      sortValue: (d) => d.slug,
      cellClassName: 'font-mono text-sm',
      cell: (d) => d.slug,
    },
    {
      id: 'color',
      header: 'Color',
      cell: (d) => (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: d.color ?? undefined }} />
          <Badge style={{ backgroundColor: (d.color ?? '') + '20', color: d.color ?? undefined }}>
            {d.color}
          </Badge>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cellClassName: 'max-w-xs truncate',
      cell: (d) => d.description || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (domain) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(domain)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(domain.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <SimpleForm
          title="Activity Domain"
          onSubmit={handleSubmit}
          editingItem={editingDomain}
          onCancel={() => {
            setShowForm(false);
            setEditingDomain(null);
          }}
          fields={formFields}
        />
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Domains of Interest</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Domain of Interest</span>
        </Button>
      </div>

      <DataTable
        data={domains as ActivityDomain[] | undefined}
        columns={columns}
        rowKey={(d) => d.id}
        searchable
        searchPlaceholder="Search domains..."
        getSearchText={(d) => `${d.name} ${d.slug} ${d.description ?? ''}`}
        selection={{ selectedIds: selectedDomains, onChange: setSelectedDomains }}
        emptyMessage="No domains of interest found. Create your first domain of interest to get started."
      />
    </div>
  );
};

export default AdminActivityDomains;