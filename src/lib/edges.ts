// Four-kind model: typed edges between knowledge_items. Available for the
// Phase 2 data-layer/views rework; not yet wired into the live views.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// The nine edge types (seven build edges + two cross-horizon structures).
export const EDGE_TYPES = [
  'convene', // Event -> Technique
  'generate', // Technique -> Constituent item
  'decompose', // Constituent item -> Constituent item (from_level -> to_level)
  'populate', // Constituent item -> Artifact (container)
  'formalise', // Constituent item -> Artifact (anchor)
  'produce_or_shape', // Technique -> Artifact (orders a queue, fills a canvas)
  'advance', // Event -> Artifact
  'anchors_to', // Artifact (anchor) -> same anchor at a higher horizon
  'cascades_to', // Artifact (container) -> container at the horizon below
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

export interface KnowledgeEdge {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  from_level: string | null;
  to_level: string | null;
}

// Read-only fetch of all typed edges. Phase 2 will resolve source/target to
// item slugs and wire this into the data layer and views.
export function useKnowledgeEdges() {
  return useQuery({
    queryKey: ['knowledge-edges'],
    queryFn: async (): Promise<KnowledgeEdge[]> => {
      const { data, error } = await supabase
        .from('knowledge_edges')
        .select('id, source_id, target_id, edge_type, from_level, to_level');
      if (error) throw error;
      return data || [];
    },
  });
}
