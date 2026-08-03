import { useState, type ReactNode } from 'react';
import type { ZooGameState } from './types';
import { ParkView } from './ParkView';
import { cn } from '@/lib/utils';
import { Target, Trophy, Trees, ClipboardList, ClipboardCheck, ChevronDown, Users } from 'lucide-react';

const PHASE_LABEL: Record<string, string> = { refine: 'Refinement', planning: 'Planning', sprint: 'Sprint', review: 'Review', retro: 'Retrospective' };
/** The work tab's label per phase - what you are actually doing there. */
const WORK_TAB: Record<string, string> = { refine: 'Refine', planning: 'Plan', sprint: 'Build', review: 'Review', retro: 'Retro' };
/** Which Scrum accountabilities you are wearing in each phase - a solo game plays all
 *  three, so naming the "hat" keeps who-does-what visible (the most-tested concept). */
const ROLE_HINT: Record<string, string> = {
  refine: 'Hats: Product Owner (orders the Backlog) + Developers (estimate)',
  planning: 'Hats: the whole Scrum Team - PO proposes value, Developers forecast & plan',
  sprint: 'Hats: Developers (do the work) - the Scrum Master keeps the way clear',
  review: 'Hats: the Scrum Team + your visitors (the stakeholders) inspect the Increment',
  retro: 'Hats: the Scrum Team inspects how it works and adapts',
};

function GoalChip({ icon: Icon, label, text, tone }: { icon: typeof Target; label: string; text: string; tone: 'product' | 'sprint' }) {
  return (
    <div className={tone === 'product' ? 'rounded-lg border border-primary/30 bg-primary/5 px-4 py-2' : 'rounded-lg border border-border bg-card px-4 py-2'}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <p className="line-clamp-2 text-sm font-medium leading-snug">{text}</p>
    </div>
  );
}

/** The product-wide Definition of Done, always in view (collapsible). It is edited at
 *  the Retrospective; here it is read-only so the bar every item clears is never hidden. */
function DodBar({ dod }: { dod: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/20 px-3 py-1.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
        <ClipboardCheck className="h-3.5 w-3.5" /> Definition of Done <span className="text-muted-foreground/70">({dod.length})</span>
        <ChevronDown className={cn('ml-auto h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {dod.map((d) => <span key={d} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>)}
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: typeof Target; label: string; badge?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors',
        active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
      <Icon className="h-4 w-4" /> {label}
      {badge && <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">{badge}</span>}
    </button>
  );
}

/** The consistent app frame, tablet-app style: the Product Goal and Sprint Goal stay
 *  at the top, and two tabs sit below - the phase's work (backlogs and studio) and the
 *  Park, which gets the full width so it can be big and impressive. Laying the park out
 *  is Backlog work: each PBI names its zone, so the park changes by refining PBIs, not
 *  by dragging things around here. */
export function ZooShell({ state, children }: { state: ZooGameState; children: ReactNode }) {
  const [tab, setTab] = useState<'work' | 'park'>('work');
  const open = state.backlog.filter((it) => it.status === 'open').length;

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

      {/* Definition of Done - always visible; refined at the Retrospective. */}
      <DodBar dod={state.definitionOfDone} />

      {/* Which accountabilities you're wearing this phase (a solo game plays all three). */}
      {ROLE_HINT[state.phase] && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" /> {ROLE_HINT[state.phase]}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <Tab active={tab === 'work'} onClick={() => setTab('work')} icon={ClipboardList} label={WORK_TAB[state.phase] ?? 'Work'} />
        <Tab active={tab === 'park'} onClick={() => setTab('park')} icon={Trees} label="Park" badge={open ? String(open) : undefined} />
      </div>

      {tab === 'work' ? (
        // The board phases (Plan, Build) want the full width for the sidebar +
        // columns; Refine, Review and Retro read better in a narrower column.
        <div className={cn('space-y-5', state.phase === 'planning' || state.phase === 'sprint' ? 'w-full' : 'mx-auto max-w-3xl')}>{children}</div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            The park shows the work you have delivered. To lay it out - what goes where, or a new zone - refine a Backlog item&rsquo;s zone or add a PBI, then build and open it in a Sprint.
          </p>
          <ParkView state={state} large />
        </div>
      )}
    </div>
  );
}
