import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type CertificationBodyData = {
  name: string;
};

export const useCreateCertificationBody = () => {
  return useOptimisticCreate({
    queryKey: ['certification_bodies'],
    mutationFn: async (data: CertificationBodyData) => {
      const { data: certBody, error } = await supabase
        .from('certification_bodies')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return certBody;
    },
    successMessage: "Certification body created successfully",
    errorMessage: "Failed to create certification body",
    createTempItem: (data: CertificationBodyData) => ({
      id: `temp-${Date.now()}`,
      ...data,
    }),
  });
};

export const useUpdateCertificationBody = () => {
  return useOptimisticUpdate({
    queryKey: ['certification_bodies'],
    mutationFn: async ({ id, data }: { id: string; data: CertificationBodyData }) => {
      const { data: certBody, error } = await supabase
        .from('certification_bodies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return certBody;
    },
    successMessage: "Certification body updated successfully",
    errorMessage: "Failed to update certification body",
  });
};

export const useDeleteCertificationBody = () => {
  return useOptimisticDelete({
    queryKey: ['certification_bodies'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('certification_bodies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    successMessage: "Certification body deleted successfully",
    errorMessage: "Failed to delete certification body",
  });
};
