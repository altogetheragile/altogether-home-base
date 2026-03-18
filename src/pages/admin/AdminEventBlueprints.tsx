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
import { Plus, Edit, Trash2, Calendar, Clock, GripVertical } from 'lucide-react';
import LegacyBanner from '@/components/admin/courses/LegacyBanner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  display_order: number;
  created_at: string;
  created_by?: string;
  updated_by?: string;
}

const getDifficultyColor = (rating?: string) => {
  switch (rating) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800';
    case 'advanced': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ─── Sortable row ────────────────────────────────────────────────────────────
const SortableRow = ({
  blueprint,
  onEdit,
  onDelete,
}: {
  blueprint: EventBlueprint;
  onEdit: (b: EventBlueprint) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: blueprint.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
          aria-label={`Reorder ${blueprint.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
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
        {blueprint.difficulty_rating ? (
          <Badge className={getDifficultyColor(blueprint.difficulty_rating)}>
            {blueprint.difficulty_rating}
          </Badge>
        ) : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(blueprint)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(blueprint.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Fetch event blueprints ordered by display_order
  const { data: blueprints = [], isLoading } = useQuery({
    queryKey: ['event-blueprints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select('id, title, description, duration_days, target_audience, difficulty_rating, display_order')
        .order('display_order', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      return data as EventBlueprint[];
    }
  });

  // Reorder mutation — batch update display_order for all items
  const reorderBlueprints = useMutation({
    mutationFn: async (ordered: { id: string; display_order: number }[]) => {
      const updates = ordered.map(({ id, display_order }) =>
        supabase.from('event_templates').update({ display_order }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blueprints'] });
      queryClient.invalidateQueries({ queryKey: ['courses-catalogue'] });
      toast.success('Order saved');
    },
    onError: () => {
      toast.error('Failed to save order');
      queryClient.invalidateQueries({ queryKey: ['event-blueprints'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blueprints.findIndex((b) => b.id === active.id);
    const newIndex = blueprints.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blueprints, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData(['event-blueprints'], reordered);

    // Persist new order
    reorderBlueprints.mutate(
      reordered.map((b, i) => ({ id: b.id, display_order: i + 1 }))
    );
  };

  // Create blueprint mutation
  const createBlueprint = useMutation({
    mutationFn: async (blueprintData: Partial<EventBlueprint>) => {
      const maxOrder = blueprints.reduce((max, b) => Math.max(max, b.display_order || 0), 0);
      const { data, error } = await supabase.from('event_templates')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          ...blueprintData,
          display_order: maxOrder + 1,
          created_by: (await supabase.auth.getUser()).data.user?.id
        } as any)
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
    onError: () => {
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
    onError: () => {
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
    onError: () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LegacyBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Blueprints</h1>
          <p className="text-muted-foreground">
            Create reusable templates for courses, workshops, and training events. Drag to reorder.
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
            Drag rows to set the display order on the public courses page
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Blueprint</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext items={blueprints.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <TableBody>
                    {blueprints.map((blueprint) => (
                      <SortableRow
                        key={blueprint.id}
                        blueprint={blueprint}
                        onEdit={handleEdit}
                        onDelete={(id) => deleteBlueprint.mutate(id)}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventBlueprints;
