import { supabase } from '@/integrations/supabase/client';
import {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
} from '@/hooks/useOptimisticMutation';

interface ExamData {
  title: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  pass_mark: number;
  total_questions: number;
  status: string;
}

export const useCreateExam = () => {
  return useOptimisticCreate({
    queryKey: ['exams'],
    mutationFn: async (data: ExamData) => {
      const { data: exam, error } = await supabase
        .from('exams')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return exam;
    },
    successMessage: 'Exam created successfully',
    errorMessage: 'Failed to create exam',
    createTempItem: (data) => ({
      id: `temp-${Date.now()}`,
      ...data,
      question_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
};

export const useUpdateExam = () => {
  return useOptimisticUpdate({
    queryKey: ['exams'],
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExamData> }) => {
      const { data: exam, error } = await supabase
        .from('exams')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return exam;
    },
    successMessage: 'Exam updated successfully',
    errorMessage: 'Failed to update exam',
  });
};

export const useDeleteExam = () => {
  return useOptimisticDelete({
    queryKey: ['exams'],
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      return { id };
    },
    successMessage: 'Exam deleted successfully',
    errorMessage: 'Failed to delete exam',
  });
};
