import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Exam {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  pass_mark: number;
  total_questions: number;
  status: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
}

export const useExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch question counts per exam
      const examIds = (data || []).map((e) => e.id);
      if (examIds.length === 0) return [] as Exam[];

      const { data: counts, error: countError } = await supabase
        .from('questions')
        .select('exam_id')
        .in('exam_id', examIds);
      if (countError) throw countError;

      const countMap: Record<string, number> = {};
      (counts || []).forEach((q) => {
        countMap[q.exam_id] = (countMap[q.exam_id] || 0) + 1;
      });

      return (data || []).map((exam) => ({
        ...exam,
        question_count: countMap[exam.id] || 0,
      })) as Exam[];
    },
  });
};

export const useExam = (examId: string | undefined) => {
  return useQuery({
    queryKey: ['exams', examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId!)
        .single();
      if (error) throw error;
      return data as Exam;
    },
  });
};

export const useExamBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['exam-by-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as Exam;
    },
  });
};
