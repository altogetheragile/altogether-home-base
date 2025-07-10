import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const AdminKnowledgeCategories = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['admin-knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    const { name, slug, description, color } = formData;
    
    if (editingCategory) {
      const { error } = await supabase
        .from('knowledge_categories')
        .update({
          name,
          slug,
          description,
          color: color || '#3B82F6',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCategory.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('knowledge_categories')
        .insert({
          name,
          slug,
          description,
          color: color || '#3B82F6',
        });

      if (error) throw error;
    }

    refetch();
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const formFields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'slug', label: 'Slug', type: 'text' as const, required: true, placeholder: 'unique-slug-for-url' },
    { key: 'description', label: 'Description', type: 'textarea' as const },
    { key: 'color', label: 'Color', type: 'text' as const, placeholder: '#3B82F6' },
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
          title="Category"
          onSubmit={handleSubmit}
          editingItem={editingCategory}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          fields={formFields}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Knowledge Categories</span>
          </h3>
          <p className="text-gray-600">Organize techniques into purpose groups</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: category.color }}
                    />
                    <Badge style={{ backgroundColor: category.color + '20', color: category.color }}>
                      {category.color}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!categories?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminKnowledgeCategories;