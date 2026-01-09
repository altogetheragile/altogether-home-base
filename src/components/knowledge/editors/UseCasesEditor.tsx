import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useKnowledgeUseCases,
  useCreateKnowledgeUseCase,
  useUpdateKnowledgeUseCase,
  useDeleteKnowledgeUseCase,
  type KnowledgeUseCase,
} from '@/hooks/useKnowledgeUseCases';

interface UseCasesEditorProps {
  knowledgeItemId: string | undefined;
}

interface NewUseCase {
  case_type: 'generic' | 'example';
  title: string;
  summary: string;
  what: string;
  who: string;
  when_used: string;
  where_used: string;
  why: string;
  how: string;
  how_much: string;
}

const EMPTY_USE_CASE: NewUseCase = {
  case_type: 'generic',
  title: '',
  summary: '',
  what: '',
  who: '',
  when_used: '',
  where_used: '',
  why: '',
  how: '',
  how_much: '',
};

export const UseCasesEditor: React.FC<UseCasesEditorProps> = ({ knowledgeItemId }) => {
  const { data: useCases = [], isLoading } = useKnowledgeUseCases(knowledgeItemId || '');
  const createUseCase = useCreateKnowledgeUseCase();
  const updateUseCase = useUpdateKnowledgeUseCase();
  const deleteUseCase = useDeleteKnowledgeUseCase();
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newUseCase, setNewUseCase] = useState<NewUseCase>(EMPTY_USE_CASE);
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddUseCase = () => {
    if (!knowledgeItemId || !newUseCase.title?.trim()) return;
    
    createUseCase.mutate({
      knowledge_item_id: knowledgeItemId,
      ...newUseCase,
    }, {
      onSuccess: () => {
        setNewUseCase(EMPTY_USE_CASE);
        setShowAddForm(false);
      },
    });
  };

  const handleUpdateField = (id: string, field: keyof KnowledgeUseCase, value: string) => {
    updateUseCase.mutate({ id, [field]: value });
  };

  const handleDelete = (useCase: KnowledgeUseCase) => {
    if (confirm('Delete this use case?')) {
      deleteUseCase.mutate({ id: useCase.id, knowledgeItemId: useCase.knowledge_item_id });
    }
  };

  if (!knowledgeItemId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Use Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Save the knowledge item first to add use cases.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Use Cases
        </CardTitle>
        <CardDescription>
          Practical examples of how this knowledge is applied
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Existing use cases */}
            <div className="space-y-3">
              {useCases.map((useCase) => (
                <Collapsible 
                  key={useCase.id}
                  open={expandedIds.has(useCase.id)}
                  onOpenChange={() => toggleExpanded(useCase.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase px-2 py-0.5 rounded bg-muted">
                          {useCase.case_type}
                        </span>
                        <span className="font-medium">{useCase.title || 'Untitled Use Case'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(useCase);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedIds.has(useCase.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="p-3 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={useCase.title || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'title', e.target.value)}
                            placeholder="Use case title"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={useCase.case_type}
                            onValueChange={(v) => handleUpdateField(useCase.id, 'case_type', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="generic">Generic</SelectItem>
                              <SelectItem value="example">Example</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Summary</Label>
                        <Textarea
                          value={useCase.summary || ''}
                          onChange={(e) => handleUpdateField(useCase.id, 'summary', e.target.value)}
                          placeholder="Brief summary of this use case"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">What</Label>
                          <Input
                            value={useCase.what || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'what', e.target.value)}
                            placeholder="What is being done?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Who</Label>
                          <Input
                            value={useCase.who || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'who', e.target.value)}
                            placeholder="Who is involved?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">When</Label>
                          <Input
                            value={useCase.when_used || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'when_used', e.target.value)}
                            placeholder="When is this used?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Where</Label>
                          <Input
                            value={useCase.where_used || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'where_used', e.target.value)}
                            placeholder="Where is this applied?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Why</Label>
                          <Input
                            value={useCase.why || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'why', e.target.value)}
                            placeholder="Why use this approach?"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">How</Label>
                          <Input
                            value={useCase.how || ''}
                            onChange={(e) => handleUpdateField(useCase.id, 'how', e.target.value)}
                            placeholder="How is it applied?"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>

            {/* Add new use case */}
            {showAddForm ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-medium">New Use Case</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title *</Label>
                    <Input
                      value={newUseCase.title}
                      onChange={(e) => setNewUseCase(s => ({ ...s, title: e.target.value }))}
                      placeholder="Use case title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={newUseCase.case_type}
                      onValueChange={(v: 'generic' | 'example') => setNewUseCase(s => ({ ...s, case_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Generic</SelectItem>
                        <SelectItem value="example">Example</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Summary</Label>
                  <Textarea
                    value={newUseCase.summary}
                    onChange={(e) => setNewUseCase(s => ({ ...s, summary: e.target.value }))}
                    placeholder="Brief summary"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddUseCase}
                    disabled={!newUseCase.title?.trim() || createUseCase.isPending}
                    size="sm"
                  >
                    {createUseCase.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Use Case
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewUseCase(EMPTY_USE_CASE);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Use Case
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
