import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import KnowledgeItemEditor from '@/components/admin/knowledge/KnowledgeItemEditor';

export default function EditKnowledgeItem() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledgeItem', id],
    queryFn: async () => {
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

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p>Error loading knowledge item.</p>;

  return <KnowledgeItemEditor knowledgeItem={data} />;
}
