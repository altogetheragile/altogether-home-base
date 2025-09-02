import { useState } from 'react';
import { FileText, Target, Plus, Edit, Trash2, Users, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { UseCaseForm } from './UseCaseForm';
import { useKnowledgeUseCases, useDeleteKnowledgeUseCase } from '@/hooks/useKnowledgeUseCases';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeItemUseCasesProps {
  knowledgeItemId?: string;
  onSaveItem?: () => Promise<void>;
}

export const KnowledgeItemUseCases = ({ knowledgeItemId, onSaveItem }: KnowledgeItemUseCasesProps) => {
  const [activeTab, setActiveTab] = useState('generic');
  const [showForm, setShowForm] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<any>(null);
  const [useCaseToDelete, setUseCaseToDelete] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const { data: useCases = [] } = useKnowledgeUseCases(knowledgeItemId || '');
  const deleteUseCase = useDeleteKnowledgeUseCase();

  const genericUseCases = useCases.filter(uc => uc.case_type === 'generic');
  const exampleUseCases = useCases.filter(uc => uc.case_type === 'example');

  const handleAddUseCase = (type: 'generic' | 'example') => {
    if (!knowledgeItemId || knowledgeItemId === 'new') {
      toast({
        title: "Save Required",
        description: "Please save the knowledge item first before adding use cases.",
        variant: "destructive",
      });
      return;
    }
    setEditingUseCase({ case_type: type });
    setShowForm(true);
  };

  const handleEditUseCase = (useCase: any) => {
    setEditingUseCase(useCase);
    setShowForm(true);
  };

  const handleDeleteUseCase = async () => {
    if (useCaseToDelete) {
      try {
        await deleteUseCase.mutateAsync(useCaseToDelete.id);
        setUseCaseToDelete(null);
      } catch (error) {
        console.error('Error deleting use case:', error);
      }
    }
  };

  if (!knowledgeItemId || knowledgeItemId === 'new') {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          Please save the knowledge item first to add use cases.
        </p>
        {onSaveItem && (
          <Button onClick={async () => {
            setIsProcessing(true);
            try {
              await onSaveItem();
            } finally {
              setIsProcessing(false);
            }
          }} disabled={isProcessing}>
            {isProcessing ? 'Saving...' : 'Save Knowledge Item'}
          </Button>
        )}
      </div>
    );
  }

  const UseCaseCard = ({ useCase }: { useCase: any }) => (
    <Card className="group relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base line-clamp-2">
              {useCase.title || 'Untitled Use Case'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={useCase.case_type === 'generic' ? 'default' : 'secondary'} className="text-xs">
                {useCase.case_type === 'generic' ? (
                  <>
                    <FileText className="h-3 w-3 mr-1" />
                    Generic
                  </>
                ) : (
                  <>
                    <Target className="h-3 w-3 mr-1" />
                    Example
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUseCase(useCase)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseCaseToDelete(useCase)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm">
          {useCase.who && (
            <div>
              <span className="font-medium text-foreground">Who: </span>
              <span className="text-muted-foreground">{useCase.who}</span>
            </div>
          )}
          {useCase.what && (
            <div>
              <span className="font-medium text-foreground">What: </span>
              <span className="text-muted-foreground">{useCase.what}</span>
            </div>
          )}
          {useCase.when_used && (
            <div>
              <span className="font-medium text-foreground">When: </span>
              <span className="text-muted-foreground">{useCase.when_used}</span>
            </div>
          )}
          {useCase.where_used && (
            <div>
              <span className="font-medium text-foreground">Where: </span>
              <span className="text-muted-foreground">{useCase.where_used}</span>
            </div>
          )}
          {useCase.why && (
            <div>
              <span className="font-medium text-foreground">Why: </span>
              <span className="text-muted-foreground">{useCase.why}</span>
            </div>
          )}
          {useCase.how && (
            <div>
              <span className="font-medium text-foreground">How: </span>
              <span className="text-muted-foreground">{useCase.how}</span>
            </div>
          )}
          {useCase.how_much && (
            <div>
              <span className="font-medium text-foreground">How Much: </span>
              <span className="text-muted-foreground">{useCase.how_much}</span>
            </div>
          )}
          {useCase.summary && (
            <div className="pt-2 border-t border-border">
              <span className="font-medium text-foreground">Summary: </span>
              <p className="text-muted-foreground mt-1 line-clamp-3">{useCase.summary}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Use Cases
        </h3>
        <p className="text-sm text-muted-foreground">
          Define when, where, and how this knowledge item is used
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="generic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generic ({genericUseCases.length})
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Examples ({exampleUseCases.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generic" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Generic Use Cases
                  </CardTitle>
                  <CardDescription>
                    General scenarios where this knowledge applies
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleAddUseCase('generic')} 
                  size="sm"
                  disabled={!knowledgeItemId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Generic
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {genericUseCases.map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} />
            ))}
            
            {genericUseCases.length === 0 && (
              <div className="lg:col-span-2 text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-3">No generic use cases defined</p>
                <Button 
                  onClick={() => handleAddUseCase('generic')} 
                  variant="outline"
                  disabled={!knowledgeItemId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Generic Use Case
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Example Use Cases
                  </CardTitle>
                  <CardDescription>
                    Specific real-world examples and case studies
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleAddUseCase('example')} 
                  size="sm"
                  disabled={!knowledgeItemId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Example
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exampleUseCases.map((useCase) => (
              <UseCaseCard key={useCase.id} useCase={useCase} />
            ))}
            
            {exampleUseCases.length === 0 && (
              <div className="lg:col-span-2 text-center py-8">
                <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-3">No example use cases defined</p>
                <Button 
                  onClick={() => handleAddUseCase('example')} 
                  variant="outline"
                  disabled={!knowledgeItemId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Example Use Case
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Use Case Form Dialog */}
      <UseCaseForm
        open={showForm}
        onOpenChange={setShowForm}
        knowledgeItemId={knowledgeItemId}
        editingUseCase={editingUseCase}
        onSuccess={() => {
          setShowForm(false);
          setEditingUseCase(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!useCaseToDelete} onOpenChange={(open) => !open && setUseCaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this use case? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUseCase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};