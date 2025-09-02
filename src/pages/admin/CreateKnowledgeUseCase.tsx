import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UseCaseForm } from "@/components/admin/knowledge/editor/UseCaseForm";
import { useToast } from "@/hooks/use-toast";
import { useKnowledgeUseCases } from "@/hooks/useKnowledgeUseCases";

const CreateKnowledgeUseCase = () => {
  const { knowledgeItemId, useCaseId } = useParams<{ knowledgeItemId: string; useCaseId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get the case type from the URL (?type=generic or ?type=example)
  const caseType = searchParams.get("type") as "generic" | "example" | null;

  // Fetch use cases to find the one being edited
  const { data: useCases } = useKnowledgeUseCases(knowledgeItemId || '');
  
  // Find the specific use case being edited
  const editingUseCase = useCaseId ? useCases?.find(uc => uc.id === useCaseId) : null;

  if (!knowledgeItemId || (!caseType && !useCaseId)) {
    toast({
      title: "Invalid request",
      description: "Missing knowledge item ID or case type.",
      variant: "destructive",
    });
    navigate("/admin/knowledge/items");
    return null;
  }

  // For new use cases, create a partial object with case_type
  const formEditingUseCase = editingUseCase || (caseType ? { case_type: caseType } : null);

  return (
    <div className="container mx-auto p-6">
      <UseCaseForm
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            navigate(`/admin/knowledge/items/${knowledgeItemId}/edit?tab=usecases`);
          }
        }}
        knowledgeItemId={knowledgeItemId}
        editingUseCase={formEditingUseCase}
        onSuccess={() => {
          navigate(`/admin/knowledge/items/${knowledgeItemId}/edit?tab=usecases`);
        }}
      />
    </div>
  );
};

export default CreateKnowledgeUseCase;