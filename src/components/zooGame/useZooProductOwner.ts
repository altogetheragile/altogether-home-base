import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ZooGameState, PoDecisions } from './types';

// Client for the single-player AI Product Owner (zoo-po-refine edge function). Sends a
// compact view of the current game and returns the PO's refinement decisions, which the
// reducer applies via PO_REFINE. Auth-gated + rate-limited server-side.

/** The compact context the PO needs - just the Backlog it can refine, plus goals/signals. */
function contextOf(state: ZooGameState) {
  const backlog = state.backlog
    .filter((it) => it.status === 'backlog')
    .map((it) => ({
      id: it.id, name: it.name, category: it.category, zone: it.zone,
      unsized: !!it.unsized,
      acceptance: it.acceptance,
      ...(it.category === 'epic' ? { members: (it.epicMembers ?? []).map((m) => ({ id: m.id, name: m.name, kind: m.kind })) } : {}),
    }));
  return {
    productGoal: state.productGoal,
    sprintNumber: state.sprintNumber,
    sprintGoal: state.sprintGoal,
    signals: state.signals.map((s) => ({ drivenBy: s.drivenBy, estimatedValue: s.estimatedValue })),
    backlog,
  };
}

export function useZooProductOwner() {
  const [isRefining, setIsRefining] = useState(false);

  const refine = async (state: ZooGameState): Promise<PoDecisions> => {
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoo-po-refine', { body: contextOf(state) });
      if (error) throw error;
      if (!data?.success || !data.data) throw new Error(data?.error || 'The Product Owner could not refine the Backlog.');
      return data.data as PoDecisions;
    } finally {
      setIsRefining(false);
    }
  };

  return { refine, isRefining };
}
