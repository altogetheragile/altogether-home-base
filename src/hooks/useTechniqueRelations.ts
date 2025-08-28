import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TechniqueRelation {
  id: string;
  source_technique_id: string;
  related_technique_id: string;
  relation_type: string;
  strength: number;
  created_at: string;
}

interface CreateRelationData {
  source_technique_id: string;
  related_technique_id: string;
  relation_type: string;
  strength?: number;
}

export const useTechniqueRelations = (techniqueId: string) => {
  return useQuery({
    queryKey: ['technique-relations', techniqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_item_relations')
        .select(`
          *,
          knowledge_items!knowledge_item_relations_related_knowledge_item_id_fkey(
            id,
            name,
            slug,
            summary
          )
        `)
        .eq('knowledge_item_id', techniqueId)
        .order('strength', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTechniqueRelation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relationData: CreateRelationData) => {
      const { data, error } = await supabase
        .from('knowledge_item_relations')
        .insert({
          knowledge_item_id: relationData.source_technique_id,
          related_knowledge_item_id: relationData.related_technique_id,
          relation_type: relationData.relation_type,
          strength: relationData.strength || 1,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Relation created",
        description: "The technique relation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['technique-relations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create technique relation. Please try again.",
        variant: "destructive",
      });
      console.error('Relation creation error:', error);
    },
  });
};

export const useDeleteTechniqueRelation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('knowledge_item_relations')
        .delete()
        .eq('id', relationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Relation deleted",
        description: "The technique relation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['technique-relations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete technique relation. Please try again.",
        variant: "destructive",
      });
      console.error('Relation deletion error:', error);
    },
  });
};

export const useRelationTypes = () => {
  return [
    { value: 'prerequisite', label: 'Prerequisite' },
    { value: 'related', label: 'Related' },
    { value: 'advanced', label: 'Advanced Topic' },
    { value: 'alternative', label: 'Alternative Approach' },
    { value: 'complement', label: 'Complementary' },
  ];
};