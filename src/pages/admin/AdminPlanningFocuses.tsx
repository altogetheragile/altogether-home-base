import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus } from 'lucide-react';
import SimpleForm from '@/components/admin/SimpleForm';
import { useToast } from '@/hooks/use-toast';

export default function AdminPlanningFocuses() {
  const [showForm, setShowForm] = useState(false);
  const [editingFocus, setEditingFocus] = useState<any>(null);
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch planning focuses
  const { data: planningFocuses, isLoading, refetch } = useQuery({
    queryKey: ['planning-focuses-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_focuses')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      if (editingFocus) {
        // Update existing planning focus
        const { error } = await supabase
          .from('planning_focuses')
          .update(data)
          .eq('id', editingFocus.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Planning focus updated successfully",
        });
      } else {
        // Create new planning focus
        const { error } = await supabase
          .from('planning_focuses')
          .insert([{ ...data, created_by: (await supabase.auth.getUser()).data.user?.id }]);
        
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Planning focus created successfully",
        });
      }
      
      setShowForm(false);
      setEditingFocus(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save planning focus",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (focus: any) => {
    setEditingFocus(focus);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this planning focus?')) return;
    
    try {
      const { error } = await supabase
        .from('planning_focuses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Planning focus deleted successfully",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete planning focus",
        variant: "destructive",
      });
    }
  };

  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter planning focus name'
    },
    {
      key: 'slug',
      label: 'Slug', 
      type: 'text' as const,
      required: true,
      placeholder: 'Enter URL-friendly slug'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter planning focus description'
    },
    {
      key: 'color',
      label: 'Color',
      type: 'text' as const,
      placeholder: '#10B981'
    },
    {
      key: 'display_order',
      label: 'Display Order',
      type: 'number' as const
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Planning Focuses</h1>
          <p className="text-muted-foreground">Manage planning focus categories for knowledge items</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Planning Focus
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFocus ? 'Edit Planning Focus' : 'Add New Planning Focus'}</CardTitle>
            <CardDescription>
              {editingFocus ? 'Update the planning focus details below.' : 'Create a new planning focus category.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleForm
              title={editingFocus ? 'Edit Planning Focus' : 'Add New Planning Focus'}
              fields={formFields}
              onSubmit={handleSubmit}
              editingItem={editingFocus}
              onCancel={() => {
                setShowForm(false);
                setEditingFocus(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Planning Focuses</CardTitle>
          <CardDescription>
            {planningFocuses?.length || 0} planning focuses configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-10">
                    <Checkbox />
                  </th>
                  <th className="text-left p-2">Order</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Slug</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {planningFocuses?.map((focus) => (
                  <tr key={focus.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Checkbox 
                        checked={selectedFocuses.includes(focus.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFocuses([...selectedFocuses, focus.id]);
                          } else {
                            setSelectedFocuses(selectedFocuses.filter(id => id !== focus.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-2 font-medium">{focus.display_order}</td>
                    <td className="p-2 font-medium">{focus.name}</td>
                    <td className="p-2 text-muted-foreground">{focus.slug}</td>
                    <td className="p-2">
                      <Badge 
                        style={{ backgroundColor: focus.color + '20', borderColor: focus.color, color: focus.color }}
                        variant="outline"
                      >
                        {focus.color}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground max-w-xs truncate">
                      {focus.description || 'No description'}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(focus)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(focus.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}