import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Question {
  id: string;
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
  reference: string | null;
  status: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export const useQuestions = (examId: string | undefined, filters?: { area?: string; status?: string }) => {
  return useQuery({
    queryKey: ['questions', examId, filters],
    enabled: !!examId,
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId!)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (filters?.area) {
        query = query.eq('area', filters.area);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Question[];
    },
  });
};

export const useQuestionAreas = (examId: string | undefined) => {
  return useQuery({
    queryKey: ['question-areas', examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('area')
        .eq('exam_id', examId!);
      if (error) throw error;
      const unique = [...new Set((data || []).map((q) => q.area))].sort();
      return unique;
    },
  });
};
