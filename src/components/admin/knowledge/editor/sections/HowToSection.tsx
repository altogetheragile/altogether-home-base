import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  useKnowledgeItemSteps,
  useCreateKnowledgeStep,
  useUpdateKnowledgeStep,
  useDeleteKnowledgeStep,
  useReorderKnowledgeSteps,
  type KnowledgeItemStep,
} from '@/hooks/useKnowledgeItemSteps';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HowToSectionProps {
  knowledgeItemId: string | undefined;
}

export function HowToSection({ knowledgeItemId }: HowToSectionProps) {
  const { data: steps = [], isLoading } = useKnowledgeItemSteps(knowledgeItemId);
  const createStep = useCreateKnowledgeStep();
  const updateStep = useUpdateKnowledgeStep();
  const deleteStep = useDeleteKnowledgeStep();
  const reorderSteps = useReorderKnowledgeSteps();
  
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [newStep, setNewStep] = useState({ title: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddStep = async () => {
    if (!knowledgeItemId || !newStep.title) return;
    
    await createStep.mutateAsync({
      knowledge_item_id: knowledgeItemId,
      title: newStep.title,
      description: newStep.description,
      step_number: steps.length + 1,
      position: steps.length,
    });
    
    setNewStep({ title: '', description: '' });
    setShowAddForm(false);
  };

  const handleUpdateStep = async (step: KnowledgeItemStep, updates: Partial<KnowledgeItemStep>) => {
    await updateStep.mutateAsync({ id: step.id, ...updates });
    setEditingStep(null);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!knowledgeItemId) return;
    await deleteStep.mutateAsync({ id: stepId, knowledge_item_id: knowledgeItemId });
    setStepToDelete(null);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    reorderSteps.mutate({ steps: newSteps });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading steps...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Step-by-Step Instructions</h3>
          <p className="text-sm text-muted-foreground">
            Create detailed, sequential steps to guide users through this technique
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        )}
      </div>

      {/* Add New Step Form */}
      {showAddForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">New Step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Step Title *</label>
              <Input
                value={newStep.title}
                onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                placeholder="e.g., Define the Product Vision"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Step Description</label>
              <Textarea
                value={newStep.description}
                onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                placeholder="Provide detailed instructions for this step..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewStep({ title: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStep}
                disabled={!newStep.title || createStep.isPending}
              >
                Add Step
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Steps */}
      {steps.length === 0 && !showAddForm ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No steps added yet</p>
            <Button onClick={() => setShowAddForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Step
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Step Number and Drag Handle */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-2">
                    {editingStep === step.id ? (
                      <>
                        <Input
                          defaultValue={step.title}
                          onBlur={(e) =>
                            handleUpdateStep(step, { title: e.target.value })
                          }
                          className="font-semibold"
                        />
                        <Textarea
                          defaultValue={step.description || ''}
                          onBlur={(e) =>
                            handleUpdateStep(step, { description: e.target.value })
                          }
                          rows={3}
                        />
                      </>
                    ) : (
                      <>
                        <h4
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => setEditingStep(step.id)}
                        >
                          {step.title}
                        </h4>
                        {step.description && (
                          <p
                            className="text-sm text-muted-foreground cursor-pointer"
                            onClick={() => setEditingStep(step.id)}
                          >
                            {step.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStepToDelete(step.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!stepToDelete} onOpenChange={() => setStepToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this step? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stepToDelete && handleDeleteStep(stepToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
