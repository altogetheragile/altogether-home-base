import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rewordProductGoal } from './engine';
import type { GoalShape } from './types';

// The wand on the Product Goal.
//
// It was a regular expression, which reshaped text without reading it: an objective and key
// results from work came back as "Open the people who start BestU carry on after an initial
// two-week period ... so that visitors love it and come back." Al had assumed a wand meant AI.
// It does now.
//
// The mechanical reword stays, as the fallback. The game is playable without an account and the
// coach is auth-gated and rate-limited, so for a signed-out player, an offline one, or one who
// has used their hour's worth, the wand still does something honest rather than nothing. What it
// must never do is pretend: `coached` says which answered, and the screen says so too.

export type Coached = {
  goal: string;
  note: string;
  /** Whether a coach read it, or the old reword tidied it. The screen says which. */
  coached: boolean;
};

/** Whatever went wrong - signed out, offline, no key, rate limited, a shape we did not expect -
 *  the answer is the same: tidy it the old way and say that is what happened. A wand that fails
 *  visibly on a training game is worse than one that quietly does less. */
async function askTheCoach(goal: string, shape: GoalShape): Promise<Coached | null> {
  try {
    const { data, error } = await supabase.functions.invoke('zoo-goal-coach', { body: { goal, shape } });
    if (error || !data?.success || !data.data) return null;
    const { goal: out, note } = data.data as { goal?: string; note?: string };
    if (!out?.trim() || !note?.trim()) return null;
    return { goal: out.trim(), note: note.trim(), coached: true };
  } catch {
    return null;
  }
}

/** Ask the coach, and tidy it the old way if the coach cannot answer.
 *
 *  Outside the hook, because none of this needs React and a test should not have to render a
 *  component to find out what the wand does. */
export async function rewordWithCoach(goal: string, shape: GoalShape = 'outcome'): Promise<Coached> {
  const said = goal.trim();
  if (!said) return { goal: '', note: '', coached: false };

  const coached = await askTheCoach(said, shape);
  if (coached) return coached;

  // The fallback can only handle one sentence. It splits on full stops and newlines and keeps the
  // first part, which on an objective with key results throws the measures away - the part worth
  // having. So it does not touch those shapes; it says why instead.
  if (shape !== 'outcome') {
    return {
      goal: said,
      note: 'I could not reach the coach, and the tidy-up here only understands a single sentence - '
        + 'run over an objective with key results it would keep the objective and drop the measures. '
        + 'So I have left yours exactly as it is. Sign in and press it again for the coached version.',
      coached: false,
    };
  }

  return { ...rewordProductGoal(said), coached: false };
}

export function useGoalCoach() {
  const [isCoaching, setIsCoaching] = useState(false);

  const reword = async (goal: string, shape: GoalShape = 'outcome'): Promise<Coached> => {
    setIsCoaching(true);
    try {
      return await rewordWithCoach(goal, shape);
    } finally {
      setIsCoaching(false);
    }
  };

  return { reword, isCoaching };
}
