import { useState, useEffect } from 'react';
import { Save, X, FileText, Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateKnowledgeUseCase, useUpdateKnowledgeUseCase } from '@/hooks/useKnowledgeUseCases';
import { useToast } from '@/hooks/use-toast';

interface UseCaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeItemId: string;
  editingUseCase?: any;
  onSuccess: () => void;
}

export const UseCaseForm = ({
  open,
  onOpenChange,
  knowledgeItemId,
  editingUseCase,
  onSuccess
}: UseCaseFormProps) => {
  const [formData, setFormData] = useState({
    case_type: 'generic' as 'generic' | 'example',
    knowledge_item_id: '',
    title: '',
    who: '',
    what: '',
    when_used: '',
    where_used: '',
    why: '',
    how: '',
    how_much: '',
    summary: ''
  });

  const { toast } = useToast();
  const createUseCase = useCreateKnowledgeUseCase();
  const updateUseCase = useUpdateKnowledgeUseCase();

  useEffect(() => {
    if (editingUseCase?.id) {
      // Editing existing use case
      setFormData({
        case_type: editingUseCase.case_type || 'generic',
        knowledge_item_id: editingUseCase.knowledge_item_id || knowledgeItemId,
        title: editingUseCase.title || '',
        who: editingUseCase.who || '',
        what: editingUseCase.what || '',
        when_used: editingUseCase.when_used || '',
        where_used: editingUseCase.where_used || '',
        why: editingUseCase.why || '',
        how: editingUseCase.how || '',
        how_much: editingUseCase.how_much || '',
        summary: editingUseCase.summary || ''
      });
    } else if (open) {
      // Creating new use case
      setFormData({
        case_type: editingUseCase?.case_type || 'generic',
        knowledge_item_id: knowledgeItemId,
        title: '',
        who: '',
        what: '',
        when_used: '',
        where_used: '',
        why: '',
        how: '',
        how_much: '',
        summary: ''
      });
    }
  }, [editingUseCase, open, knowledgeItemId]);

  const handleSave = async () => {
    if (!formData.knowledge_item_id || formData.knowledge_item_id === 'new') {
      toast({
        title: "Error",
        description: "Please save the knowledge item first before adding use cases",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    try {
      if (editingUseCase?.id) {
        await updateUseCase.mutateAsync({
          id: editingUseCase.id,
          ...formData
        });
      } else {
        await createUseCase.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving use case:', error);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createUseCase.isPending || updateUseCase.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                {formData.case_type === 'generic' ? (
                  <>
                    <FileText className="h-5 w-5" />
                    {editingUseCase?.id ? 'Edit Generic Use Case' : 'Create Generic Use Case'}
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    {editingUseCase?.id ? 'Edit Example Use Case' : 'Create Example Use Case'}
                  </>
                )}
              </DialogTitle>
              <Badge variant={formData.case_type === 'generic' ? 'default' : 'secondary'}>
                {formData.case_type === 'generic' ? 'Generic' : 'Example'}
              </Badge>
              <DialogDescription>
                Define when, where, and how this knowledge item is used
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Case Type Selection */}
          <div className="space-y-3">
            <Label>Use Case Type</Label>
            <RadioGroup
              value={formData.case_type}
              onValueChange={(value) => handleFormChange('case_type', value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="generic" id="generic" />
                <Label htmlFor="generic" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Generic Use Case
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="example" id="example" />
                <Label htmlFor="example" className="flex items-center gap-2 cursor-pointer">
                  <Target className="h-4 w-4" />
                  Example Use Case
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {formData.case_type === 'generic' 
                ? 'Generic use cases describe broad, reusable scenarios and patterns.'
                : 'Example use cases provide specific, real-world implementations and case studies.'
              }
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Brief title for this use case"
            />
          </div>

          {/* 5W1H Framework */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-foreground">5W1H Framework</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="who">Who</Label>
                  <Textarea
                    id="who"
                    value={formData.who}
                    onChange={(e) => handleFormChange('who', e.target.value)}
                    placeholder="Who uses this? Target audience, roles, personas..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="what">What</Label>
                  <Textarea
                    id="what"
                    value={formData.what}
                    onChange={(e) => handleFormChange('what', e.target.value)}
                    placeholder="What is being done? Activities, processes, outcomes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="when_used">When</Label>
                  <Textarea
                    id="when_used"
                    value={formData.when_used}
                    onChange={(e) => handleFormChange('when_used', e.target.value)}
                    placeholder="When is this used? Timing, conditions, triggers..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="where_used">Where</Label>
                  <Textarea
                    id="where_used"
                    value={formData.where_used}
                    onChange={(e) => handleFormChange('where_used', e.target.value)}
                    placeholder="Where is this applied? Context, environment, setting..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="why">Why</Label>
                  <Textarea
                    id="why"
                    value={formData.why}
                    onChange={(e) => handleFormChange('why', e.target.value)}
                    placeholder="Why is this needed? Purpose, benefits, motivation..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="how">How</Label>
                  <Textarea
                    id="how"
                    value={formData.how}
                    onChange={(e) => handleFormChange('how', e.target.value)}
                    placeholder="How is this done? Methods, steps, techniques..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="how_much">How Much</Label>
                <Textarea
                  id="how_much"
                  value={formData.how_much}
                  onChange={(e) => handleFormChange('how_much', e.target.value)}
                  placeholder="How much effort, time, resources? Scale, scope, metrics..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleFormChange('summary', e.target.value)}
              placeholder="Concise summary of this use case, key takeaways, or practical insights..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.summary?.length || 0} characters
            </p>
          </div>

          {/* Helper Text */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2">
                {formData.case_type === 'generic' ? 'Generic Use Case Tips' : 'Example Use Case Tips'}
              </h4>
              {formData.case_type === 'generic' ? (
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Focus on broad, reusable scenarios</li>
                  <li>• Describe general patterns and principles</li>
                  <li>• Keep it applicable across different contexts</li>
                  <li>• Emphasize the conceptual framework</li>
                </ul>
              ) : (
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Provide specific, real-world examples</li>
                  <li>• Include concrete details and context</li>
                  <li>• Mention actual companies, projects, or cases</li>
                  <li>• Show practical implementation details</li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};