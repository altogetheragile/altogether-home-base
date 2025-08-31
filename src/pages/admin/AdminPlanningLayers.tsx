import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import SimpleForm from '@/components/admin/SimpleForm';

const AdminPlanningLayers = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingLayer, setEditingLayer] = useState<any>(null);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);

  const { data: layers, isLoading, refetch } = useQuery({
    queryKey: ['admin-planning-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_layers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    const { name, slug, description, full_description, color, display_order } = formData;
    
    if (editingLayer) {
      const { error } = await supabase
        .from('planning_layers')
        .update({
          name,
          slug,
          description,
          full_description,
          color: color || '#3B82F6',
          display_order: parseInt(display_order) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLayer.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('planning_layers')
        .insert({
          name,
          slug,
          description,
          full_description,
          color: color || '#3B82F6',
          display_order: parseInt(display_order) || 0,
        });

      if (error) throw error;
    }

    refetch();
  };

  const handleEdit = (layer: any) => {
    setEditingLayer(layer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this planning layer?')) return;

    try {
      const { error } = await supabase
        .from('planning_layers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Planning layer deleted successfully.",
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete planning layer.",
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
    { key: 'display_order', label: 'Display Order', type: 'number' as const, placeholder: '0' },
  ];

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
          title="Planning Layer"
          onSubmit={handleSubmit}
          editingItem={editingLayer}
          onCancel={() => {
            setShowForm(false);
            setEditingLayer(null);
          }}
          fields={formFields}
        />
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Planning Layers</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Planning Layer</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLayers.length === layers?.length && layers.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLayers(layers?.map(l => l.id) || []);
                    } else {
                      setSelectedLayers([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers?.map((layer) => (
              <TableRow key={layer.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLayers.includes(layer.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLayers([...selectedLayers, layer.id]);
                      } else {
                        setSelectedLayers(selectedLayers.filter(id => id !== layer.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{layer.display_order}</TableCell>
                <TableCell className="font-medium">{layer.name}</TableCell>
                <TableCell className="font-mono text-sm">{layer.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: layer.color }}
                    />
                    <Badge style={{ backgroundColor: layer.color + '20', color: layer.color }}>
                      {layer.color}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{layer.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(layer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(layer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!layers?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No planning layers found. Create your first planning layer to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPlanningLayers;