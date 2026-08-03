import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

/** A contextual coaching note, shown when the learner hits (or risks) an anti-pattern -
 *  over-committing, high WIP, chasing output over outcome, ignoring a blocker. Turns a
 *  mistake into a lesson in the moment. */
export function CoachTip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-sky-300/70 bg-sky-50/70 px-3 py-2 text-[12px] leading-snug text-sky-900 dark:border-sky-800/40 dark:bg-sky-950/20 dark:text-sky-100">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
      <div><span className="font-semibold">Coach:</span> {children}</div>
    </div>
  );
}
