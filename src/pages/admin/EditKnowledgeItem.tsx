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

  const handleClose = () => {
    setOpen(false);
    // Use replace to avoid adding to history stack
    navigate('/admin/knowledge/items', { replace: true });
  };

  useEffect(() => {
    if (!open) {
      // Small delay to ensure smooth dialog closing animation
      const timer = setTimeout(() => {
        navigate('/admin/knowledge/items', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
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
        onOpenChange={handleClose}
        knowledgeItem={knowledgeItem}
        onSuccess={() => {
          handleClose();
        }}
      />
    </div>
  );
}
