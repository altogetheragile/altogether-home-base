import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ActivityDomain {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useActivityDomains = () => {
  return useQuery({
    queryKey: ['activity-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_domains')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateActivityDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<ActivityDomain>) => {
      const { data: result, error } = await supabase
        .from('activity_domains')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-domains'] });
      toast({
        title: "Success",
        description: "Activity domain created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create activity domain",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateActivityDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ActivityDomain> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('activity_domains')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-domains'] });
      toast({
        title: "Success",
        description: "Activity domain updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update activity domain",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteActivityDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activity_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-domains'] });
      toast({
        title: "Success",
        description: "Activity domain deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete activity domain",
        variant: "destructive",
      });
    },
  });
};