import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeItemUseCases } from "../KnowledgeItemUseCases";
import { UseCaseForm } from "../UseCaseForm";
import { useFormContext } from "react-hook-form";
import type { KnowledgeUseCase } from "@/hooks/useKnowledgeUseCases";

export const UseCasesSection = () => {
  const form = useFormContext();
  const knowledgeItemId = form.watch('id');
  
  // Dialog state management
  const [editingUseCase, setEditingUseCase] = useState<KnowledgeUseCase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSaveItem = async () => {
    // Trigger form submission to save current progress
    return new Promise<void>((resolve) => {
      form.handleSubmit((data) => {
        console.log('Saving knowledge item from use cases section:', data);
        resolve();
      })();
    });
  };

  const handleAddUseCase = () => {
    console.log('Add use case triggered');
  };

  const handleEditUseCase = (useCase: KnowledgeUseCase) => {
    console.log('Edit use case triggered:', useCase);
    setEditingUseCase(useCase);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingUseCase(null);
  };

  const handleEditSuccess = () => {
    handleDialogClose();
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-xl font-semibold">Use Cases</CardTitle>
        <CardDescription>
          Define practical use cases and examples for this knowledge item
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <KnowledgeItemUseCases
          knowledgeItemId={knowledgeItemId}
          onSaveItem={handleSaveItem}
          onAddUseCase={handleAddUseCase}
          onEditUseCase={handleEditUseCase}
        />
      </CardContent>

      {/* Use Case Edit Dialog */}
      <UseCaseForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        knowledgeItemId={knowledgeItemId}
        editingUseCase={editingUseCase}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};