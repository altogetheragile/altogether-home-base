import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeItemUseCases } from "../KnowledgeItemUseCases";
import { useFormContext } from "react-hook-form";

export const UseCasesSection = () => {
  const form = useFormContext();
  const knowledgeItemId = form.watch('id');

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

  const handleEditUseCase = (useCaseId: string) => {
    console.log('Edit use case triggered:', useCaseId);
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
    </Card>
  );
};