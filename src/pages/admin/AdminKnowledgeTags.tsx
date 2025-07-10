import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
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

const AdminKnowledgeTags = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);

  const { data: tags, isLoading, refetch } = useQuery({
    queryKey: ['admin-knowledge-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    const { name, slug } = formData;
    
    if (editingTag) {
      const { error } = await supabase
        .from('knowledge_tags')
        .update({
          name,
          slug,
        })
        .eq('id', editingTag.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('knowledge_tags')
        .insert({
          name,
          slug,
        });

      if (error) throw error;
    }

    refetch();
  };

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tag deleted successfully.",
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag.",
        variant: "destructive",
      });
    }
  };

  const formFields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'slug', label: 'Slug', type: 'text' as const, required: true, placeholder: 'unique-slug-for-url' },
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
          title="Tag"
          onSubmit={handleSubmit}
          editingItem={editingTag}
          onCancel={() => {
            setShowForm(false);
            setEditingTag(null);
          }}
          fields={formFields}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Knowledge Tags</span>
          </h3>
          <p className="text-gray-600">Manage tags for categorizing and filtering techniques</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags?.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{tag.usage_count || 0}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!tags?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No tags found. Create your first tag to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminKnowledgeTags;