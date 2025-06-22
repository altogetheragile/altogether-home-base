
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type InstructorData = {
  name: string;
  bio: string;
};

export const useCreateInstructor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InstructorData) => {
      const { data: instructor, error } = await supabase
        .from('instructors')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating instructor:', error);
        throw error;
      }

      return instructor;
    },
    onMutate: async (newInstructor) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['instructors'] });

      // Snapshot previous value
      const previousInstructors = queryClient.getQueryData(['instructors']);

      // Optimistically update with temporary data
      const tempInstructor = {
        id: `temp-${Date.now()}`,
        ...newInstructor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      queryClient.setQueryData(['instructors'], (old: any) => 
        old ? [...old, tempInstructor] : [tempInstructor]
      );

      return { previousInstructors, tempInstructor };
    },
    onSuccess: (data, variables, context) => {
      toast({
        title: "Success",
        description: "Instructor created successfully",
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousInstructors) {
        queryClient.setQueryData(['instructors'], context.previousInstructors);
      }
      
      console.error('Error creating instructor:', error);
      toast({
        title: "Error",
        description: "Failed to create instructor",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
  });
};

export const useUpdateInstructor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InstructorData }) => {
      const { data: instructor, error } = await supabase
        .from('instructors')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating instructor:', error);
        throw error;
      }

      return instructor;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['instructors'] });
      
      const previousInstructors = queryClient.getQueryData(['instructors']);
      
      queryClient.setQueryData(['instructors'], (old: any) =>
        old?.map((instructor: any) =>
          instructor.id === id 
            ? { ...instructor, ...data, updated_at: new Date().toISOString() }
            : instructor
        )
      );

      return { previousInstructors };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instructor updated successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousInstructors) {
        queryClient.setQueryData(['instructors'], context.previousInstructors);
      }
      
      console.error('Error updating instructor:', error);
      toast({
        title: "Error",
        description: "Failed to update instructor",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
  });
};

export const useDeleteInstructor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting instructor:', error);
        throw error;
      }

      return { success: true };
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['instructors'] });
      
      const previousInstructors = queryClient.getQueryData(['instructors']);
      
      queryClient.setQueryData(['instructors'], (old: any) =>
        old?.filter((instructor: any) => instructor.id !== deletedId)
      );

      return { previousInstructors };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instructor deleted successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousInstructors) {
        queryClient.setQueryData(['instructors'], context.previousInstructors);
      }
      
      console.error('Error deleting instructor:', error);
      toast({
        title: "Error",
        description: "Failed to delete instructor",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
  });
};
