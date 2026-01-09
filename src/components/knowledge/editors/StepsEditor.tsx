import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ListOrdered, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import {
  useKnowledgeItemSteps,
  useCreateKnowledgeStep,
  useUpdateKnowledgeStep,
  useDeleteKnowledgeStep,
  type KnowledgeItemStep,
} from '@/hooks/useKnowledgeItemSteps';

interface StepsEditorProps {
  knowledgeItemId: string | undefined;
}

export const StepsEditor: React.FC<StepsEditorProps> = ({ knowledgeItemId }) => {
  const { data: steps = [], isLoading } = useKnowledgeItemSteps(knowledgeItemId);
  const createStep = useCreateKnowledgeStep();
  const updateStep = useUpdateKnowledgeStep();
  const deleteStep = useDeleteKnowledgeStep();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState({ title: '', description: '' });

  const handleAddStep = () => {
    if (!knowledgeItemId || !newStep.title.trim()) return;
    
    createStep.mutate({
      knowledge_item_id: knowledgeItemId,
      title: newStep.title,
      description: newStep.description || null,
      step_number: steps.length + 1,
      position: steps.length,
    }, {
      onSuccess: () => setNewStep({ title: '', description: '' }),
    });
  };

  const handleUpdateStep = (step: KnowledgeItemStep, updates: Partial<KnowledgeItemStep>) => {
    updateStep.mutate({ id: step.id, ...updates });
  };

  const handleDeleteStep = (step: KnowledgeItemStep) => {
    if (confirm('Delete this step?')) {
      deleteStep.mutate({ id: step.id, knowledge_item_id: step.knowledge_item_id });
    }
  };

  if (!knowledgeItemId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-4 w-4" />
            How-To Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Save the knowledge item first to add steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered className="h-4 w-4" />
          How-To Steps
        </CardTitle>
        <CardDescription>
          Step-by-step instructions for applying this knowledge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Existing steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className="flex gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {editingId === step.id ? (
                      <>
                        <Input
                          value={step.title}
                          onChange={(e) => handleUpdateStep(step, { title: e.target.value })}
                          placeholder="Step title"
                          className="font-medium"
                        />
                        <Textarea
                          value={step.description || ''}
                          onChange={(e) => handleUpdateStep(step, { description: e.target.value })}
                          placeholder="Step description (optional)"
                          rows={2}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Done
                        </Button>
                      </>
                    ) : (
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingId(step.id)}
                      >
                        <p className="font-medium">{step.title}</p>
                        {step.description && (
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStep(step)}
                    className="flex-shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new step */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Add New Step</p>
              <Input
                value={newStep.title}
                onChange={(e) => setNewStep(s => ({ ...s, title: e.target.value }))}
                placeholder="Step title..."
              />
              <Textarea
                value={newStep.description}
                onChange={(e) => setNewStep(s => ({ ...s, description: e.target.value }))}
                placeholder="Step description (optional)"
                rows={2}
              />
              <Button
                onClick={handleAddStep}
                disabled={!newStep.title.trim() || createStep.isPending}
                size="sm"
              >
                {createStep.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Step
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
