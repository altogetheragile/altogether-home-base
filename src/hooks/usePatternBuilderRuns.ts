import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatternFeedback {
  id: string;
  rating: 'up' | 'down' | string;
  comment: string | null;
  created_at: string;
}

export interface PatternRun {
  id: string;
  scenario: string;
  primary_horizon: string | null;
  result: {
    diagnosis?: string;
    steps?: Array<{ artifactId: string; techniqueIds?: string[] }>;
    cautions?: string[];
  } | null;
  assessment: {
    reviewed?: boolean;
    revised?: boolean;
    verdict?: string;
    summary?: string;
    repairNote?: string;
  } | null;
  was_revised: boolean;
  created_at: string;
  feedback: PatternFeedback[];
}

// Admin-only (RLS gates SELECT to is_admin()). Fetches recent runs and their
// feedback in two queries, then joins client-side.
export function usePatternBuilderRuns(limit = 200) {
  return useQuery({
    queryKey: ['pattern-builder-runs', limit],
    queryFn: async (): Promise<PatternRun[]> => {
      const { data: runs, error: runsErr } = await supabase
        .from('pattern_builder_runs')
        .select('id, scenario, primary_horizon, result, assessment, was_revised, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (runsErr) throw runsErr;

      const { data: feedback, error: fbErr } = await supabase
        .from('pattern_builder_feedback')
        .select('id, run_id, rating, comment, created_at')
        .order('created_at', { ascending: false });
      if (fbErr) throw fbErr;

      const byRun = new Map<string, PatternFeedback[]>();
      for (const f of feedback || []) {
        const list = byRun.get(f.run_id) || [];
        list.push({ id: f.id, rating: f.rating, comment: f.comment, created_at: f.created_at });
        byRun.set(f.run_id, list);
      }

      return (runs || []).map((r) => ({
        ...(r as Omit<PatternRun, 'feedback'>),
        feedback: byRun.get(r.id) || [],
      }));
    },
  });
}
