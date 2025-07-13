import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RelatedTechnique {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  difficulty_level: string | null;
  relation_type: string;
  strength: number;
}

export const useTechniqueRelations = (techniqueId: string) => {
  return useQuery({
    queryKey: ['technique-relations', techniqueId],
    queryFn: async (): Promise<RelatedTechnique[]> => {
      const { data, error } = await supabase
        .from('technique_relations')
        .select(`
          relation_type,
          strength,
          related_technique:knowledge_techniques!technique_relations_related_technique_id_fkey(
            id,
            name,
            slug,
            summary,
            difficulty_level
          )
        `)
        .eq('source_technique_id', techniqueId)
        .order('strength', { ascending: false });

      if (error) throw error;

      return (data || [])
        .filter(relation => relation.related_technique)
        .map(relation => {
          const technique = relation.related_technique as any;
          return {
            id: technique.id,
            name: technique.name,
            slug: technique.slug,
            summary: technique.summary,
            difficulty_level: technique.difficulty_level,
            relation_type: relation.relation_type,
            strength: relation.strength,
          };
        });
    },
    enabled: !!techniqueId,
  });
};