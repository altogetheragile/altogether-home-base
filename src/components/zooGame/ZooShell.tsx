import type { ReactNode } from 'react';
import type { ZooGameState } from './types';
import { ParkView, type ParkArrange } from './ParkView';
import { Target, Trophy } from 'lucide-react';

const PHASE_LABEL: Record<string, string> = { planning: 'Planning', sprint: 'Sprint', review: 'Review', retro: 'Retrospective' };

function GoalChip({ icon: Icon, label, text, tone }: { icon: typeof Target; label: string; text: string; tone: 'product' | 'sprint' }) {
  return (
    <div className={tone === 'product' ? 'rounded-lg border border-primary/30 bg-primary/5 px-4 py-2' : 'rounded-lg border border-border bg-card px-4 py-2'}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <p className="line-clamp-2 text-sm font-medium leading-snug">{text}</p>
    </div>
  );
}

/** The consistent app frame, tablet-app style: the Product Goal and Sprint Goal are
 *  always visible at the top, the park is the main area (always on show, arrange-able),
 *  and the current phase's controls live in a panel beside it. */
export function ZooShell({ state, arrange, children }: { state: ZooGameState; arrange: ParkArrange; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 pb-28 sm:px-4">
      {/* Persistent goals + phase */}
      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <GoalChip icon={Trophy} label="Product Goal" text={state.productGoal} tone="product" />
        <GoalChip icon={Target} label="Sprint Goal" text={state.sprintGoal.trim() || 'Not set yet - agree one at Planning'} tone="sprint" />
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/40 px-4 py-2 text-center text-sm font-semibold">
          Sprint {state.sprintNumber}<span className="mx-1.5 text-muted-foreground">·</span>{PHASE_LABEL[state.phase] ?? ''}
        </div>
      </div>

      {/* Park (main) + phase panel */}
      <div className="lg:grid lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-5">
        <div className="lg:sticky lg:top-4">
          <ParkView state={state} arrange={arrange} />
        </div>
        <div className="mt-4 space-y-5 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
