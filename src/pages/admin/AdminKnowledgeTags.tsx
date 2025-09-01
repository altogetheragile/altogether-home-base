import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tags, isLoading, refetch } = useQuery({
    queryKey: ['admin-knowledge-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredTags = tags?.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setShowForm(true);
  };

  const handleDelete = async (tag: any) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_tags')
        .delete()
        .eq('id', tag.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTag(null);
    refetch();
  };

  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter tag name',
    },
    {
      key: 'slug',
      label: 'Slug',
      type: 'text' as const,
      required: true,
      placeholder: 'url-friendly-name',
    },
  ];

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Tags</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tags..."
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTags?.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                <TableCell>{tag.usage_count || 0}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredTags?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No tags found matching your search.' : 'No tags created yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <SimpleForm
          title={editingTag ? 'Edit Tag' : 'Create Tag'}
          fields={formFields}
          editingItem={editingTag}
          onSubmit={async (data) => {
            if (editingTag) {
              const { error } = await supabase
                .from('knowledge_tags')
                .update(data)
                .eq('id', editingTag.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('knowledge_tags')
                .insert(data);
              if (error) throw error;
            }
            handleFormSuccess();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminKnowledgeTags;