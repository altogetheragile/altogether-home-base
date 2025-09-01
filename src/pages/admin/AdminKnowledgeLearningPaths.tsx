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

const AdminKnowledgeLearningPaths = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPath, setEditingPath] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: learningPaths, isLoading, refetch } = useQuery({
    queryKey: ['admin-learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_learning_paths')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredPaths = learningPaths?.filter(path =>
    path.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (path: any) => {
    setEditingPath(path);
    setShowForm(true);
  };

  const handleDelete = async (path: any) => {
    if (!confirm(`Are you sure you want to delete "${path.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('user_learning_paths')
        .delete()
        .eq('id', path.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Learning path deleted successfully",
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
    setEditingPath(null);
    refetch();
  };

  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter learning path name',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter description',
    },
    {
      key: 'difficulty_level',
      label: 'Difficulty Level',
      type: 'select' as const,
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
    {
      key: 'estimated_duration_hours',
      label: 'Estimated Duration (hours)',
      type: 'number' as const,
      placeholder: '0',
    },
  ];

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Learning Path
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search learning paths..."
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
              <TableHead>Description</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Duration (hrs)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPaths?.map((path) => (
              <TableRow key={path.id}>
                <TableCell className="font-medium">{path.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {path.description}
                </TableCell>
                <TableCell>
                  <span className="capitalize">{path.difficulty_level}</span>
                </TableCell>
                <TableCell>{path.estimated_duration_hours || 0}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    path.is_published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {path.is_published ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(path)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredPaths?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No learning paths found matching your search.' : 'No learning paths created yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <SimpleForm
          title={editingPath ? 'Edit Learning Path' : 'Create Learning Path'}
          fields={formFields}
          editingItem={editingPath}
          onSubmit={async (data) => {
            if (editingPath) {
              const { error } = await supabase
                .from('user_learning_paths')
                .update(data)
                .eq('id', editingPath.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('user_learning_paths')
                .insert(data);
              if (error) throw error;
            }
            handleFormSuccess();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPath(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminKnowledgeLearningPaths;