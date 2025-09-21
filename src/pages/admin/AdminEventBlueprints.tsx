import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Calendar, Users, MapPin, Clock, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventBlueprint {
  id: string;
  title: string;
  description?: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  event_type_id?: string;
  category_id?: string;
  level_id?: string;
  format_id?: string;
  brand_color?: string;
  icon_name?: string;
  hero_image_url?: string;
  banner_template?: string;
  learning_outcomes?: string[];
  prerequisites?: string[];
  target_audience?: string;
  key_benefits?: string[];
  template_tags?: string[];
  difficulty_rating?: 'beginner' | 'intermediate' | 'advanced';
  popularity_score?: number;
  created_at: string;
  created_by?: string;
  updated_by?: string;
}

const AdminEventBlueprints: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<EventBlueprint | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: 1,
    target_audience: '',
    difficulty_rating: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
  });

  const queryClient = useQueryClient();

  // Fetch event blueprints
  const { data: blueprints = [], isLoading } = useQuery({
    queryKey: ['event-blueprints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EventBlueprint[];
    }
  });

  // Create blueprint mutation
  const createBlueprint = useMutation({
    mutationFn: async (blueprintData: Partial<EventBlueprint>) => {
      const { data, error } = await supabase
        .from('event_templates')
        .insert({
          ...blueprintData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blueprints'] });
      toast.success('Event blueprint created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error creating blueprint:', error);
      toast.error('Failed to create event blueprint');
    }
  });

  // Update blueprint mutation
  const updateBlueprint = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EventBlueprint> }) => {
      const { data, error } = await supabase
        .from('event_templates')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blueprints'] });
      toast.success('Event blueprint updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error updating blueprint:', error);
      toast.error('Failed to update event blueprint');
    }
  });

  // Delete blueprint mutation
  const deleteBlueprint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blueprints'] });
      toast.success('Event blueprint deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting blueprint:', error);
      toast.error('Failed to delete event blueprint');
    }
  });

  const handleSubmit = () => {
    if (editingBlueprint) {
      updateBlueprint.mutate({ id: editingBlueprint.id, updates: formData });
    } else {
      createBlueprint.mutate(formData);
    }
  };

  const handleEdit = (blueprint: EventBlueprint) => {
    setEditingBlueprint(blueprint);
    setFormData({
      title: blueprint.title,
      description: blueprint.description || '',
      duration_days: blueprint.duration_days,
      target_audience: blueprint.target_audience || '',
      difficulty_rating: blueprint.difficulty_rating || 'intermediate'
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingBlueprint(null);
    setFormData({
      title: '',
      description: '',
      duration_days: 1,
      target_audience: '',
    difficulty_rating: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
    });
  };

  const getDifficultyColor = (rating?: string) => {
    switch (rating) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Blueprints</h1>
          <p className="text-muted-foreground">
            Create reusable templates for courses, workshops, and training events
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Blueprint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingBlueprint ? 'Edit Event Blueprint' : 'Create Event Blueprint'}
              </DialogTitle>
              <DialogDescription>
                Define a reusable template for creating similar events
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Blueprint Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Agile Project Management Workshop"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this blueprint is for..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={formData.difficulty_rating} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_rating: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="e.g., Project managers, team leads, scrum masters"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
                {editingBlueprint ? 'Update Blueprint' : 'Create Blueprint'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Blueprints
          </CardTitle>
          <CardDescription>
            Manage templates for creating consistent, professional events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blueprints.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Event Blueprints Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first blueprint to get started with consistent event planning
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Blueprint
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blueprint</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blueprints.map((blueprint) => (
                  <TableRow key={blueprint.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{blueprint.title}</div>
                        {blueprint.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {blueprint.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {blueprint.duration_days} day{blueprint.duration_days !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(blueprint.difficulty_rating)}>
                        {blueprint.difficulty_rating || 'intermediate'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {blueprint.target_audience || 'Not specified'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(blueprint)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBlueprint.mutate(blueprint.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventBlueprints;