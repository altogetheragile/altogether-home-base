import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlanningFocus {
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

export const usePlanningFocuses = () => {
  return useQuery({
    queryKey: ['planning-focuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_focuses')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreatePlanningFocus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<PlanningFocus>) => {
      const { data: result, error } = await supabase
        .from('planning_focuses')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-focuses'] });
      toast({
        title: "Success",
        description: "Planning focus created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create planning focus",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlanningFocus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanningFocus> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('planning_focuses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-focuses'] });
      toast({
        title: "Success",
        description: "Planning focus updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update planning focus",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePlanningFocus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planning_focuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-focuses'] });
      toast({
        title: "Success",
        description: "Planning focus deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete planning focus",
        variant: "destructive",
      });
    },
  });
};