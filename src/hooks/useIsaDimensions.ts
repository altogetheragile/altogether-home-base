import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IsaDimension {
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

export const useIsaDimensions = () => {
  return useQuery({
    queryKey: ['isa-dimensions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('isa_dimensions')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as IsaDimension[] || [];
    },
  });
};

export const useCreateIsaDimension = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<IsaDimension>) => {
      const { data: result, error } = await supabase
        .from('isa_dimensions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isa-dimensions'] });
      toast({
        title: "Success",
        description: "ISA dimension created successfully",
      });
    },
    onError: (_error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create ISA dimension",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateIsaDimension = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<IsaDimension> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('isa_dimensions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isa-dimensions'] });
      toast({
        title: "Success",
        description: "ISA dimension updated successfully",
      });
    },
    onError: (_error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update ISA dimension",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteIsaDimension = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('isa_dimensions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isa-dimensions'] });
      toast({
        title: "Success",
        description: "ISA dimension deleted successfully",
      });
    },
    onError: (_error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete ISA dimension",
        variant: "destructive",
      });
    },
  });
};
