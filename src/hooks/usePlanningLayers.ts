import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlanningLayer {
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

export const usePlanningLayers = () => {
  return useQuery({
    queryKey: ['planning-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_layers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreatePlanningLayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<PlanningLayer>) => {
      const { data: result, error } = await supabase
        .from('planning_layers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-layers'] });
      toast({
        title: "Success",
        description: "Planning layer created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create planning layer",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlanningLayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanningLayer> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('planning_layers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-layers'] });
      toast({
        title: "Success",
        description: "Planning layer updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update planning layer",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePlanningLayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planning_layers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-layers'] });
      toast({
        title: "Success",
        description: "Planning layer deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete planning layer",
        variant: "destructive",
      });
    },
  });
};