import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  useOptimisticCreate,
  useOptimisticUpdate,
  useOptimisticDelete,
} from '@/hooks/useOptimisticMutation';

interface QuestionData {
  exam_id: string;
  area: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  option_f: string;
  option_g: string;
  correct_answer: string;
  reference?: string;
  status: string;
  sort_order?: number;
}

export const useCreateQuestion = (examId: string) => {
  return useOptimisticCreate({
    queryKey: ['questions', examId],
    mutationFn: async (data: QuestionData) => {
      const { data: question, error } = await supabase
        .from('questions')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return question;
    },
    successMessage: 'Question created successfully',
    errorMessage: 'Failed to create question',
    createTempItem: (data) => ({
      id: `temp-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
};

export const useUpdateQuestion = (examId: string) => {
  return useOptimisticUpdate({
    queryKey: ['questions', examId],
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuestionData> }) => {
      const { data: question, error } = await supabase
        .from('questions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return question;
    },
    successMessage: 'Question updated successfully',
    errorMessage: 'Failed to update question',
  });
};

export const useDeleteQuestion = (examId: string) => {
  return useOptimisticDelete({
    queryKey: ['questions', examId],
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      return { id };
    },
    successMessage: 'Question deleted successfully',
    errorMessage: 'Failed to delete question',
  });
};

export const useBulkImportQuestions = (examId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (questions: Omit<QuestionData, 'exam_id'>[]) => {
      const rows = questions.map((q) => ({ ...q, exam_id: examId }));
      // Insert in batches of 50 to avoid payload size limits
      const BATCH_SIZE = 50;
      const allData: typeof rows = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('questions')
          .insert(batch)
          .select();
        if (error) {
          console.error('Supabase insert error (batch ' + Math.floor(i / BATCH_SIZE) + '):', JSON.stringify(error));
          throw error;
        }
        if (data) allData.push(...data);
      }
      return allData;
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Imported ${data.length} questions successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['questions', examId] });
      queryClient.invalidateQueries({ queryKey: ['question-areas', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error: Error) => {
      console.error('Bulk import error:', error);
      toast({
        title: 'Error',
        description: `Failed to import questions: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
