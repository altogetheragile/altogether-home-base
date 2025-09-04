import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useKnowledgeUseCases } from '@/hooks/useKnowledgeUseCases';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UseCaseFormData {
  who: string;
  what: string;
  when: string;
  where: string;
  why: string;
  how: string;
  how_much: string;
  summary: string;
  type: 'generic' | 'example';
}

interface InlineUseCaseManagerProps {
  knowledgeItemId?: string;
  onSaveItem?: () => void;
}

export const InlineUseCaseManager: React.FC<InlineUseCaseManagerProps> = ({
  knowledgeItemId,
  onSaveItem
}) => {
  const { toast } = useToast();
  const [editingUseCase, setEditingUseCase] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState<{ type: 'generic' | 'example' | null }>({ type: null });
  const [newUseCaseData, setNewUseCaseData] = useState<UseCaseFormData>({
    who: '',
    what: '',
    when: '',
    where: '',
    why: '',
    how: '',
    how_much: '',
    summary: '',
    type: 'generic'
  });
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(new Set());

  const { data: useCases = [], isLoading } = useKnowledgeUseCases(knowledgeItemId);

  if (!knowledgeItemId || knowledgeItemId === 'new') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Save Knowledge Item First</h3>
          <p className="text-muted-foreground mb-4">
            You need to save the knowledge item before you can add use cases.
          </p>
          {onSaveItem && (
            <Button onClick={onSaveItem} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Knowledge Item
            </Button>
          )}
        </div>
      </div>
    );
  }

  const genericUseCases = useCases.filter(uc => uc.case_type === 'generic');
  const exampleUseCases = useCases.filter(uc => uc.case_type === 'example');

  const handleAddUseCase = (type: 'generic' | 'example') => {
    setShowNewForm({ type });
    setNewUseCaseData(prev => ({ ...prev, type }));
  };

  const handleCancelNew = () => {
    setShowNewForm({ type: null });
    setNewUseCaseData({
      who: '',
      what: '',
      when: '',
      where: '',
      why: '',
      how: '',
      how_much: '',
      summary: '',
      type: 'generic'
    });
  };

  const toggleUseCaseExpanded = (useCaseId: string) => {
    setExpandedUseCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(useCaseId)) {
        newSet.delete(useCaseId);
      } else {
        newSet.add(useCaseId);
      }
      return newSet;
    });
  };

  const UseCaseForm: React.FC<{ 
    data: UseCaseFormData; 
    onChange: (data: UseCaseFormData) => void;
    onSave: () => void;
    onCancel: () => void;
    isEditing?: boolean;
  }> = ({ data, onChange, onSave, onCancel, isEditing = false }) => (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            {isEditing ? 'Edit' : 'New'} {data.type === 'generic' ? 'Generic' : 'Example'} Use Case
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="flex items-center gap-1">
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="who">Who</Label>
            <Input
              id="who"
              placeholder="Target user or role"
              value={data.who}
              onChange={(e) => onChange({ ...data, who: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="what">What</Label>
            <Input
              id="what"
              placeholder="Action or goal"
              value={data.what}
              onChange={(e) => onChange({ ...data, what: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="when">When</Label>
            <Input
              id="when"
              placeholder="Timing or context"
              value={data.when}
              onChange={(e) => onChange({ ...data, when: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="where">Where</Label>
            <Input
              id="where"
              placeholder="Location or environment"
              value={data.where}
              onChange={(e) => onChange({ ...data, where: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="why">Why</Label>
            <Input
              id="why"
              placeholder="Motivation or purpose"
              value={data.why}
              onChange={(e) => onChange({ ...data, why: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="how">How</Label>
            <Input
              id="how"
              placeholder="Method or approach"
              value={data.how}
              onChange={(e) => onChange({ ...data, how: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="how_much">How Much</Label>
          <Input
            id="how_much"
            placeholder="Quantity, frequency, or scope"
            value={data.how_much}
            onChange={(e) => onChange({ ...data, how_much: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            placeholder="Brief summary of this use case"
            rows={3}
            value={data.summary}
            onChange={(e) => onChange({ ...data, summary: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );

  const UseCaseCard: React.FC<{ useCase: any }> = ({ useCase }) => {
    const isExpanded = expandedUseCases.has(useCase.id);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <Collapsible open={isExpanded} onOpenChange={() => toggleUseCaseExpanded(useCase.id)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={useCase.case_type === 'generic' ? 'default' : 'secondary'}>
                  {useCase.case_type === 'generic' ? 'Generic' : 'Example'}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingUseCase(useCase.id)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this use case? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            {/* Summary Preview */}
            <div className="text-sm text-muted-foreground">
              {useCase.summary || `${useCase.who || 'Someone'} wants to ${useCase.what || 'do something'}`}
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {useCase.who && (
                  <div>
                    <strong className="text-muted-foreground">Who:</strong> {useCase.who}
                  </div>
                )}
                {useCase.what && (
                  <div>
                    <strong className="text-muted-foreground">What:</strong> {useCase.what}
                  </div>
                )}
                {useCase.when && (
                  <div>
                    <strong className="text-muted-foreground">When:</strong> {useCase.when}
                  </div>
                )}
                {useCase.where && (
                  <div>
                    <strong className="text-muted-foreground">Where:</strong> {useCase.where}
                  </div>
                )}
                {useCase.why && (
                  <div>
                    <strong className="text-muted-foreground">Why:</strong> {useCase.why}
                  </div>
                )}
                {useCase.how && (
                  <div>
                    <strong className="text-muted-foreground">How:</strong> {useCase.how}
                  </div>
                )}
                {useCase.how_much && (
                  <div className="col-span-2">
                    <strong className="text-muted-foreground">How Much:</strong> {useCase.how_much}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Use Cases
        </h3>
        <p className="text-sm text-muted-foreground">
          Define generic patterns and specific examples of how this knowledge is applied
        </p>
      </div>

      <Tabs defaultValue="generic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generic" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Generic ({genericUseCases.length})
          </TabsTrigger>
          <TabsTrigger value="example" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Examples ({exampleUseCases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generic" className="space-y-4">
          {/* Add New Generic Use Case */}
          {showNewForm.type === 'generic' && (
            <UseCaseForm
              data={newUseCaseData}
              onChange={setNewUseCaseData}
              onSave={() => {
                // Handle save logic
                toast({ title: "Use case saved", description: "Generic use case has been added." });
                handleCancelNew();
              }}
              onCancel={handleCancelNew}
            />
          )}

          {/* Existing Generic Use Cases */}
          <div className="space-y-3">
            {genericUseCases.map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} />
            ))}
          </div>

          {/* Add Button */}
          {showNewForm.type !== 'generic' && (
            <Button
              onClick={() => handleAddUseCase('generic')}
              variant="outline"
              className="w-full border-dashed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Generic Use Case
            </Button>
          )}

          {genericUseCases.length === 0 && showNewForm.type !== 'generic' && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-8 w-8 mb-2" />
              <p>No generic use cases defined yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="example" className="space-y-4">
          {/* Add New Example Use Case */}
          {showNewForm.type === 'example' && (
            <UseCaseForm
              data={newUseCaseData}
              onChange={setNewUseCaseData}
              onSave={() => {
                // Handle save logic
                toast({ title: "Use case saved", description: "Example use case has been added." });
                handleCancelNew();
              }}
              onCancel={handleCancelNew}
            />
          )}

          {/* Existing Example Use Cases */}
          <div className="space-y-3">
            {exampleUseCases.map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} />
            ))}
          </div>

          {/* Add Button */}
          {showNewForm.type !== 'example' && (
            <Button
              onClick={() => handleAddUseCase('example')}
              variant="outline"
              className="w-full border-dashed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Example Use Case
            </Button>
          )}

          {exampleUseCases.length === 0 && showNewForm.type !== 'example' && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2" />
              <p>No example use cases defined yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
