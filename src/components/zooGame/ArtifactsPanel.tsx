import { useState } from 'react';
import { Boxes, ClipboardList, ListTodo, Package, Pencil, Check, Eye, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ZooGameState } from './types';
import { artifactState } from './engine';
import { DodEditor } from './DodEditor';
import { ARTIFACT_NAME, ARTIFACT_PROVENANCE, roleFor, type ArtifactId } from './scrumContent';

// ============= The three artifacts, in one place =============
//
// Transparency means an artifact is available when you want it, not that all three shout from the
// header of every screen. This is the one control that holds them, and it holds their commitments
// too - because that is what a commitment IS: the Product Goal belongs to the Product Backlog, the
// Definition of Done belongs to the Increment. Keeping them together says so without a paragraph.

const ICON: Record<ArtifactId, typeof ClipboardList> = {
  'product-backlog': ClipboardList,
  'sprint-backlog': ListTodo,
  increment: Package,
};
const ROLE = {
  inspects: { label: 'Inspecting', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  adapts: { label: 'Adapting', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  creates: { label: 'Creating', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
};

/** A list the team owns - the Definition of Done, or their own Definition of Ready. */
function ListAgreement({ title, items, note, onSet }: { title?: string; items: string[]; note?: string; onSet?: (v: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={cn(title && 'rounded-md border border-border bg-muted/20 px-2 py-1.5')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{title ? `${title} (${items.length})` : `${items.length} things every item must be`}</span>
        {onSet && (
          <button type="button" onClick={() => setEditing((e) => !e)}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
            {editing ? <><Check className="h-3 w-3" /> Done</> : <><Pencil className="h-3 w-3" /> Edit</>}
          </button>
        )}
      </div>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">{note}</p>}
      {editing && onSet
        ? <div className="mt-1"><DodEditor dod={items} onSave={onSet} /></div>
        : <div className="mt-1 flex flex-wrap gap-1">
          {items.map((d) => <span key={d} className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>)}
        </div>}
    </div>
  );
}

/** The Product Goal: the Product Backlog's commitment, and the Product Owner's to change. */
function GoalEditor({ goal, onSetGoal }: { goal: string; onSetGoal?: (g: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);
  if (editing && onSetGoal) {
    return (
      <div className="space-y-1.5">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
          className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-primary"
          placeholder="One clear outcome: a park that [who] love, so that [outcome]." />
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="button" disabled={!draft.trim()} onClick={() => { onSetGoal(draft); setEditing(false); }}
            className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Save</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-1.5">
      <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug">{goal}</p>
      {onSetGoal && (
        <button type="button" onClick={() => { setDraft(goal); setEditing(true); }} title="Edit the Product Goal"
          className="shrink-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
      )}
    </div>
  );
}

/** One control for all three artifacts: what is in each, its commitment, and what this event is
 *  doing to it. The button carries a dot while an artifact is being adapted or created, so the
 *  transparency signal survives being folded away. */
export function ArtifactsPanel({ state, onSetProductGoal, onSetDod, onSetDor }: {
  state: ZooGameState;
  onSetProductGoal?: (g: string) => void;
  onSetDod?: (dod: string[]) => void;
  onSetDor?: (dor: string[]) => void;
}) {
  const artifacts = artifactState(state);
  const active = artifacts.some((a) => roleFor(state.phase, a.id) === 'creates' || roleFor(state.phase, a.id) === 'adapts');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="The three artifacts, what is in them, and their commitments"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Boxes className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Artifacts</span>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[75vh] w-96 overflow-y-auto">
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Scrum has three artifacts. Each holds one kind of truth about the work, and each carries a commitment that says
            what &ldquo;good&rdquo; means for it. This is all of it, whatever screen you are on.
          </p>
          {artifacts.map((a) => {
            const Icon = ICON[a.id];
            const role = roleFor(state.phase, a.id);
            const rs = role ? ROLE[role] : null;
            const prov = ARTIFACT_PROVENANCE[a.id];
            return (
              <section key={a.id} className={cn('rounded-lg border px-2.5 py-2', a.exists ? 'border-border bg-card' : 'border-dashed border-border/70')}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Icon className={cn('h-4 w-4 shrink-0', a.exists ? 'text-foreground' : 'text-muted-foreground/60')} />
                  <span className={cn('text-sm font-semibold', !a.exists && 'text-muted-foreground')}>{ARTIFACT_NAME[a.id]}</span>
                  {rs && (
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', rs.cls)}>
                      {role === 'inspects' ? <Eye className="mr-0.5 inline h-2.5 w-2.5" /> : role === 'creates' ? <Sparkles className="mr-0.5 inline h-2.5 w-2.5" /> : <Pencil className="mr-0.5 inline h-2.5 w-2.5" />}
                      {rs.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.exists ? a.summary : prov.born}</p>

                {/* The commitment, on the artifact it belongs to. */}
                <div className={cn('mt-1.5 rounded-md border px-2 py-1.5', a.commitmentMet ? 'border-primary/30 bg-primary/5' : 'border-dashed border-border')}>
                  <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Commitment &middot; {prov.commitment}</div>
                  {a.id === 'product-backlog'
                    ? <div className="mt-0.5"><GoalEditor goal={state.productGoal} onSetGoal={onSetProductGoal} /></div>
                    : a.id === 'increment'
                      ? <div className="mt-0.5"><ListAgreement items={state.definitionOfDone} onSet={onSetDod} /></div>
                      : <p className="mt-0.5 text-[12px] font-medium leading-snug">{a.commitment}</p>}
                </div>

                {a.id === 'product-backlog' && (
                  <div className="mt-1.5">
                    <ListAgreement title="Definition of Ready" items={state.definitionOfReady} onSet={onSetDor}
                      note="Your own agreement about what makes an item ready to forecast - Scrum does not require one. A conversation, not a gate." />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
