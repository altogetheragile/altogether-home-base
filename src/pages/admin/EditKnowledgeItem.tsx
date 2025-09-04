import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/integrations/supabase/client';
import KnowledgeItemEditor from '@/components/admin/knowledge/KnowledgeItemEditor';

interface KnowledgeItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  // Add other fields of your knowledge item record here
}

/**
 * EditKnowledgeItem page
 *
 * This page fetches an existing knowledge item from Supabase using the ID from the URL
 * and renders the KnowledgeItemEditor component.  The editor will receive the
 * loaded record as a prop so it can pre-fill the form.  If you haven’t yet
 * updated your KnowledgeItemEditor component to accept a `knowledgeItem` prop,
 * you should do so—read the record into the form’s default values.
 */
export default function EditKnowledgeItem() {
  // Extract the knowledge item ID from the URL parameters
  const { id } = useParams<{ id: string }>();

  // Fetch the knowledge item record from Supabase
  const {
    data: knowledgeItem,
    isLoading,
    error,
  } = useQuery<KnowledgeItem, Error>(['knowledge-item', id], async () => {
    // Guard against undefined IDs
    if (!id) {
      throw new Error('No knowledge item ID provided');
    }
    const { data, error } = await supabase
      .from<KnowledgeItem>('knowledge_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  });

  if (isLoading) {
    return <div>Loading knowledge item…</div>;
  }

  if (error) {
    return <div>Error loading knowledge item: {error.message}</div>;
  }

  // Render the improved editor, passing in the knowledge item data
  return <KnowledgeItemEditor knowledgeItem={knowledgeItem} />;
}
