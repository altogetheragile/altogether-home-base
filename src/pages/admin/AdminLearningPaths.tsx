import { useState } from 'react';
import { Plus, BookOpen, Clock, Users, Eye, EyeOff, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DifficultyBadge } from '@/components/knowledge/DifficultyBadge';

interface LearningPath {
  id: string;
  title: string;
  description?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes?: number;
  is_published: boolean;
  created_at: string;
  steps?: any[];
}

interface LearningPathForm {
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  is_published: boolean;
}

const AdminLearningPaths = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LearningPathForm>({
    defaultValues: {
      title: '',
      description: '',
      difficulty_level: 'beginner',
      estimated_duration_minutes: 60,
      is_published: false,
    },
  });

  // Fetch learning paths
  const { data: learningPaths, isLoading } = useQuery({
    queryKey: ['admin-learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_steps:learning_path_steps(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create/update learning path
  const createMutation = useMutation({
    mutationFn: async (values: LearningPathForm) => {
      if (editingPath) {
        const { data, error } = await supabase
          .from('learning_paths')
          .update(values)
          .eq('id', editingPath.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('learning_paths')
          .insert([values])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-paths'] });
      setIsDialogOpen(false);
      setEditingPath(null);
      form.reset();
      toast({
        title: editingPath ? 'Learning path updated' : 'Learning path created',
        description: editingPath ? 'The learning path has been updated successfully.' : 'The learning path has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete learning path
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-paths'] });
      toast({
        title: 'Learning path deleted',
        description: 'The learning path has been deleted successfully.',
      });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('learning_paths')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-learning-paths'] });
      toast({
        title: 'Status updated',
        description: 'Learning path status has been updated.',
      });
    },
  });

  const handleEdit = (path: LearningPath) => {
    setEditingPath(path);
    form.reset({
      title: path.title,
      description: path.description || '',
      difficulty_level: path.difficulty_level || 'beginner',
      estimated_duration_minutes: path.estimated_duration_minutes || 60,
      is_published: path.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: LearningPathForm) => {
    createMutation.mutate(values);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Learning Paths</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Learning Paths</h1>
          <p className="text-muted-foreground mt-1">
            Create structured learning journeys for your users
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPath(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Learning Path
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPath ? 'Edit Learning Path' : 'Create Learning Path'}
              </DialogTitle>
              <DialogDescription>
                {editingPath ? 'Update the learning path details.' : 'Create a new structured learning journey.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter learning path title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe what users will learn" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimated_duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="60" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Published</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this learning path visible to users
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : (editingPath ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Learning Paths List */}
      <div className="grid gap-4">
        {learningPaths?.map((path) => (
          <Card key={path.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{path.title}</CardTitle>
                  {path.description && (
                    <CardDescription className="text-sm">{path.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublishMutation.mutate({
                      id: path.id,
                      is_published: !path.is_published
                    })}
                  >
                    {path.is_published ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
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
                    onClick={() => deleteMutation.mutate(path.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{path.steps?.[0]?.count || 0} steps</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(path.estimated_duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>0 enrolled</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {path.difficulty_level && (
                  <DifficultyBadge level={path.difficulty_level} />
                )}
                <Badge variant={path.is_published ? 'default' : 'secondary'}>
                  {path.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {learningPaths?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No learning paths yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first learning path to help users learn in a structured way.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Learning Path
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminLearningPaths;