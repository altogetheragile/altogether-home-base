
import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type LocationData = {
  name: string;
  address: string;
  virtual_url: string;
};

export const useCreateLocation = () => {
  return useOptimisticCreate({
    queryKey: ['locations'],
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
    successMessage: "Location created successfully",
    errorMessage: "Failed to create location",
    createTempItem: (data: LocationData) => ({
      id: `temp-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
  });
};

export const useUpdateLocation = () => {
  return useOptimisticUpdate({
    queryKey: ['locations'],
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
    successMessage: "Location updated successfully",
    errorMessage: "Failed to update location",
  });
};

export const useDeleteLocation = () => {
  return useOptimisticDelete({
    queryKey: ['locations'],
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
    successMessage: "Location deleted successfully",
    errorMessage: "Failed to delete location",
  });
};
