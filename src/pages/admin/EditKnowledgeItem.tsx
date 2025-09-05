import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeItemEditor } from '@/components/admin/knowledge/KnowledgeItemEditor';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';

export default function EditKnowledgeItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State for editor visibility
  const [open, setOpen] = useState(true);

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

  useEffect(() => {
    if (!open) {
      // Navigate back to knowledge items list when dialog closes
      navigate('/admin/knowledge-items');
    }
  }, [open, navigate]);

  if (isLoading) {
    return <div className="p-6">Loading knowledge item...</div>;
  }

  if (error) {
    return <div className="p-6">Error loading knowledge item: {(error as Error).message}</div>;
  }

  return (
    <div className="p-6">
      <KnowledgeItemEditor
        open={open}
        onOpenChange={setOpen}
        knowledgeItem={knowledgeItem}
        onSuccess={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}
