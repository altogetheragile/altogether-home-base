import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeItemEditorPage } from '@/components/admin/knowledge/KnowledgeItemEditorPage';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';

export default function EditKnowledgeItem() {
  const { id } = useParams<{ id: string }>();

  // Fetch the actual knowledge item if editing
  const { data: knowledgeItem, isLoading, error } = useQuery({
    queryKey: ['knowledge-item', id],
    queryFn: async (): Promise<KnowledgeItem | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  return (
    <KnowledgeItemEditorPage 
      knowledgeItem={knowledgeItem} 
      isEditing={true} 
    />
  );
}
