import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DecisionLevel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useDecisionLevels = () => {
  return useQuery({
    queryKey: ['decision-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decision_levels')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as DecisionLevel[] || [];
    },
  });
};

export const useCreateDecisionLevel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<DecisionLevel>) => {
      const { data: result, error } = await supabase
        .from('decision_levels')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-levels'] });
      toast({
        title: "Success",
        description: "Decision level created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create decision level",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDecisionLevel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DecisionLevel> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('decision_levels')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-levels'] });
      toast({
        title: "Success",
        description: "Decision level updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update decision level",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDecisionLevel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('decision_levels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision-levels'] });
      toast({
        title: "Success",
        description: "Decision level deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete decision level",
        variant: "destructive",
      });
    },
  });
};
