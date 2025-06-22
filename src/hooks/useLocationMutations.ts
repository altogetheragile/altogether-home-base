
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type LocationData = {
  name: string;
  address: string;
  virtual_url: string;
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LocationData) => {
      const { data: location, error } = await supabase
        .from('locations')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating location:', error);
        throw error;
      }

      return location;
    },
    onMutate: async (newLocation) => {
      await queryClient.cancelQueries({ queryKey: ['locations'] });
      
      const previousLocations = queryClient.getQueryData(['locations']);
      
      const tempLocation = {
        id: `temp-${Date.now()}`,
        ...newLocation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      queryClient.setQueryData(['locations'], (old: any) => 
        old ? [...old, tempLocation] : [tempLocation]
      );

      return { previousLocations, tempLocation };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(['locations'], context.previousLocations);
      }
      
      console.error('Error creating location:', error);
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LocationData }) => {
      const { data: location, error } = await supabase
        .from('locations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }

      return location;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['locations'] });
      
      const previousLocations = queryClient.getQueryData(['locations']);
      
      queryClient.setQueryData(['locations'], (old: any) =>
        old?.map((location: any) =>
          location.id === id 
            ? { ...location, ...data, updated_at: new Date().toISOString() }
            : location
        )
      );

      return { previousLocations };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(['locations'], context.previousLocations);
      }
      
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting location:', error);
        throw error;
      }

      return { success: true };
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['locations'] });
      
      const previousLocations = queryClient.getQueryData(['locations']);
      
      queryClient.setQueryData(['locations'], (old: any) =>
        old?.filter((location: any) => location.id !== deletedId)
      );

      return { previousLocations };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousLocations) {
        queryClient.setQueryData(['locations'], context.previousLocations);
      }
      
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};
