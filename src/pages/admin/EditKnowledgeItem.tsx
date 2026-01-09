import { useParams } from 'react-router-dom';
import { KnowledgeItemEditorPage } from '@/components/admin/knowledge/KnowledgeItemEditorPage';
import { useKnowledgeItemById } from '@/hooks/useKnowledgeItems';

export default function EditKnowledgeItem() {
  const { id } = useParams<{ id: string }>();

  // Use the standardized hook that fetches all taxonomy data
  const { data: knowledgeItem, isLoading, error } = useKnowledgeItemById(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading knowledge item...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading knowledge item: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !knowledgeItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground mb-2">Knowledge Item Not Found</p>
          <p className="text-muted-foreground">The requested item does not exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <KnowledgeItemEditorPage 
      knowledgeItem={knowledgeItem} 
      isEditing={true} 
    />
  );
}
