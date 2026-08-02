import { useState } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft } from './types';
import { availableItems, productGoalProgress, suggestSprintGoal } from './engine';
import { zooCapacity } from './config';
import { PlanningPoker } from './PlanningPoker';
import { PbiEditor } from './PbiEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, Fish, Coffee, Trees, Lightbulb, ChevronUp, ChevronDown, HelpCircle, Target, Wand2, Pencil, FilePlus, GripVertical } from 'lucide-react';

interface SprintPlanningProps {
  state: ZooGameState;
  onPlan: (ids: string[]) => void;
  onEstimate: (id: string, points: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSetSprintGoal: (goal: string) => void;
  onTakeSignal: (index: number) => void;
}

/** Sprint Planning panel: set the Sprint Goal, refine the Backlog (estimate unsized
 *  items by planning poker, order it), then commit sized items up to a
 *  velocity-driven capacity. The park and goals live in the surrounding shell. */
export function SprintPlanning({ state, onPlan, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveBefore, onSetUseStories, onSetSprintGoal, onTakeSignal }: SprintPlanningProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [estimating, setEstimating] = useState<string | null>(null);
  const [editingPbi, setEditingPbi] = useState<BacklogItem | 'new' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const items = availableItems(state);
  const estimatingItem = estimating ? items.find((i) => i.id === estimating) : null;
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const progress = Math.round(productGoalProgress(state) * 100);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Plan the Sprint</h2>
        <span className="text-xs text-muted-foreground">Product Goal {progress}%</span>
      </div>

      {/* Sprint Goal: the single objective for this Sprint (coached, editable). */}
      <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={chosen.length === 0} onClick={() => onSetSprintGoal(suggestSprintGoal(chosen))}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest from selection
          </Button>
        </div>
        <textarea
          value={state.sprintGoal}
          onChange={(e) => onSetSprintGoal(e.target.value)}
          rows={2}
          placeholder="One outcome for this Sprint - e.g. &ldquo;Open the Savanna so families have more to see.&rdquo; Or pick some items and let the coach suggest one."
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* The visitors' signals: candidate backlog items the Product Owner decides on. */}
      {state.signals.length > 0 && (
        <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="h-4 w-4" /> Signals from your visitors
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70">Suggestions from the last Review. You decide what to build - ignored ones get louder.</p>
          <div className="space-y-1.5">
            {state.signals.map((sig, i) => (
              <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-sm dark:border-amber-900/50">
                <span className="flex-1">{sig.suggestion}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                  sig.estimatedValue === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : sig.estimatedValue === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground')}>{sig.estimatedValue}</span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onTakeSignal(i)}>Add to Backlog</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Capacity */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">This Sprint</span>
          <span className={cn('font-mono', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, capacity ? (committed / capacity) * 100 : 0)}%` }} />
        </div>
        {over && <p className="text-[11px] text-destructive">Over capacity of ~{capacity}. Prefer finishing fewer things to the Definition of Done over starting more and not finishing.</p>}
        <p className="text-[11px] text-muted-foreground">{state.velocity.length ? `Capacity is your average velocity over ${state.velocity.length} Sprint${state.velocity.length > 1 ? 's' : ''}.` : 'First-Sprint guess. Velocity will replace it after Sprint 1.'}</p>
      </div>

      {/* Product Backlog + refinement */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span></h3>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingPbi('new')}><FilePlus className="mr-1 h-3.5 w-3.5" /> New PBI</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">You own the Backlog: add and refine PBIs (animals, facilities and flora), estimate them by planning poker, and order them. Only estimated items can be committed.</p>

        {editingPbi && (
          <PbiEditor zones={state.zones} item={editingPbi === 'new' ? undefined : editingPbi}
            useStories={state.useUserStories} onToggleStories={onSetUseStories}
            onSave={(d) => { if (editingPbi === 'new') onAddPbi(d); else onRefinePbi(editingPbi.id, d); setEditingPbi(null); }}
            onCancel={() => setEditingPbi(null)} />
        )}

        {estimatingItem && (
          <PlanningPoker item={estimatingItem} seed={state.gameSeed}
            onCommit={(pts) => { onEstimate(estimatingItem.id, pts); setEstimating(null); }}
            onCancel={() => setEstimating(null)} />
        )}

        <div className="space-y-1.5">
          {items.length === 0 && <p className="text-xs text-muted-foreground/60">Everything is planned or built. Accept a signal to add more.</p>}
          {items.map((it, idx) => {
            const on = selected.has(it.id);
            const Icon = it.category === 'flora' ? Trees : it.category === 'amenity' ? (it.services === 'food' ? Coffee : Plus) : Fish;
            return (
              <div key={it.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.id); setDragId(it.id); }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = e.dataTransfer?.getData('text/plain') || dragId; if (from && from !== it.id) onMoveBefore(from, it.id); setDragId(null); }}
                className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors', on ? 'border-primary bg-primary/5' : it.unsized ? 'border-dashed border-border bg-muted/20' : 'border-border bg-card', dragId === it.id && 'opacity-50')}>
                <div className="flex flex-col text-muted-foreground" title="Drag to reorder, or use the arrows">
                  <GripVertical className="mb-0.5 h-3.5 w-3.5 cursor-grab opacity-50" />
                  <button type="button" title="Move up" disabled={idx === 0} onClick={() => onReorder(it.id, 'up')} className="disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Move down" disabled={idx === items.length - 1} onClick={() => onReorder(it.id, 'down')} className="disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" disabled={it.unsized} onClick={() => toggle(it.id)} className="flex flex-1 items-start gap-2 text-left disabled:cursor-not-allowed">
                  {on ? <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> : <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <span className="flex-1">
                    <span className="font-medium">{it.name}</span>
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{it.zone}</span>
                    {it.story && <span className="mt-0.5 block text-[11px] italic text-muted-foreground">{it.story}</span>}
                  </span>
                </button>
                {it.unsized ? (
                  <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => setEstimating(it.id)}><HelpCircle className="mr-1 h-3.5 w-3.5" /> Estimate</Button>
                ) : (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{it.estimate} pts</span>
                )}
                <button type="button" title="Refine this PBI" onClick={() => setEditingPbi(it)} className="shrink-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" disabled={chosen.length === 0} onClick={() => onPlan([...selected])}>Start Sprint {state.sprintNumber}</Button>
      </div>
    </div>
  );
}
