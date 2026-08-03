import { useState, useRef, type ReactNode } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft, SprintTask } from './types';
import { availableItems, suggestTasks } from './engine';
import { PlanningPoker } from './PlanningPoker';
import { PbiEditor } from './PbiEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Fish, Coffee, Trees, Plus, Pencil, HelpCircle, FilePlus, GripVertical, ChevronUp, ChevronDown, Check, X, Wand2, ListChecks, Star } from 'lucide-react';

/** The icon that reads for an item's kind (rendered directly so it stays stable). */
export function CategoryIcon({ item, className }: { item: BacklogItem; className?: string }) {
  if (item.category === 'flora') return <Trees className={className} />;
  if (item.category === 'amenity') return item.services === 'food' ? <Coffee className={className} /> : <Plus className={className} />;
  return <Fish className={className} />;
}

/** One board column - To Do / Doing / Done - with a header count and an empty hint. */
export function BoardColumn({ title, count, hint, tone = 'default', children }: { title: string; count: number; hint?: string; tone?: 'default' | 'done'; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className={cn('flex items-center justify-between rounded-t-lg border border-b-0 border-border px-3 py-2',
        tone === 'done' ? 'bg-emerald-100/60 dark:bg-emerald-950/30' : 'bg-muted')}>
        <h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({count})</span></h3>
      </div>
      <div className="flex-1 space-y-1.5 rounded-b-lg border border-border bg-card/40 p-2" style={{ minHeight: 84 }}>
        {count === 0 && <div className="py-5 text-center text-[11px] text-muted-foreground/50">{hint ?? '—'}</div>}
        {children}
      </div>
    </div>
  );
}

/** An item as a board card: kind icon, name, zone pill, points, plus optional badge,
 *  a subtitle line and a row of actions. */
export function ItemCard({ item, badge, subtitle, actions, onClick, selectable, className }:
  { item: BacklogItem; badge?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; onClick?: () => void; selectable?: boolean; className?: string }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('rounded-md border border-border bg-card p-2 text-sm', onClick && 'cursor-pointer hover:border-primary/60 hover:bg-primary/5', selectable && 'ring-2 ring-primary/50', className)}>
      <div className="flex min-w-0 items-start gap-1.5">
        <CategoryIcon item={item} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{item.zone}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{item.unsized ? '? pts' : `${item.estimate} pts`}</span>
            {badge}
          </div>
        </div>
      </div>
      {subtitle}
      {actions && <div className="mt-1.5 flex items-center justify-end gap-1.5">{actions}</div>}
    </div>
  );
}

/** Plan-time task decomposition for one PBI (Sprint Planning's "how"): a coached
 *  breakdown you can suggest, then add / edit / remove. Optionally shows a goal-critical
 *  star, so the team marks which items the Sprint Goal truly depends on. */
export function TaskEditor({ item, onSetTasks, onToggleGoalCritical }: { item: BacklogItem; onSetTasks: (id: string, tasks: SprintTask[]) => void; onToggleGoalCritical?: (id: string) => void }) {
  const tasks = item.tasks ?? [];
  const uid = useRef(0);
  const set = (next: SprintTask[]) => onSetTasks(item.id, next);
  const add = () => set([...tasks, { id: `${item.id}-u${uid.current++}`, label: '', done: false }]);
  const edit = (tid: string, label: string) => set(tasks.map((t) => (t.id === tid ? { ...t, label } : t)));
  const remove = (tid: string) => set(tasks.filter((t) => t.id !== tid));

  return (
    <div className={cn('rounded-lg border bg-card p-3', item.goalCritical ? 'border-amber-400/70' : 'border-border')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <CategoryIcon item={item} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{item.name}</span>
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{item.zone}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{item.estimate} pts</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleGoalCritical && (
            <button type="button" onClick={() => onToggleGoalCritical(item.id)}
              title={item.goalCritical ? 'Essential to the Sprint Goal - click to unmark' : 'Mark essential to the Sprint Goal'}
              className={cn('flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors',
                item.goalCritical ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600')}>
              <Star className={cn('h-3.5 w-3.5', item.goalCritical && 'fill-amber-400')} /> Goal
            </button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => set(suggestTasks(item))}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest tasks
          </Button>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {tasks.length === 0 && <p className="text-[11px] text-muted-foreground/70">No tasks yet - suggest a breakdown or add your own steps for how this gets built.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <input value={t.label} onChange={(e) => edit(t.id, e.target.value)} placeholder="A step to build it"
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] outline-none focus:border-primary" />
            <button type="button" onClick={() => remove(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Remove task"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Add task</Button>
      </div>
    </div>
  );
}

/** The plan on a board card: the tasks, ticked off as the Developers work through them.
 *  `readOnly` shows the plan without checkboxes (To Do preview, or a finished Done item). */
export function TaskChecklist({ item, onToggle, readOnly }: { item: BacklogItem; onToggle: (id: string, taskId: string) => void; readOnly?: boolean }) {
  const tasks = (item.tasks ?? []).filter((t) => t.label.trim());
  if (!tasks.length) return null;
  const done = tasks.filter((t) => t.done).length;
  return (
    <div className="mt-1.5 rounded-md border border-border/70 bg-muted/30 p-1.5">
      <div className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        <ListChecks className="h-3 w-3" /> Plan {done}/{tasks.length}
      </div>
      <div className="space-y-0.5">
        {tasks.map((t) => (
          <label key={t.id} className={cn('flex items-start gap-1.5 text-[11px]', !readOnly && 'cursor-pointer')}>
            <input type="checkbox" checked={t.done} disabled={readOnly} onChange={() => onToggle(item.id, t.id)} className="mt-0.5 h-3 w-3 shrink-0" />
            <span className={cn(t.done && 'text-muted-foreground line-through')}>{t.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface SidebarProps {
  state: ZooGameState;
  mode: 'plan' | 'sprint' | 'refine';
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onSetUseStories: (on: boolean) => void;
  /** plan mode: estimate an unsized item; select/deselect for the forecast. */
  onEstimate?: (id: string, points: number) => void;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onReorder?: (id: string, dir: 'up' | 'down') => void;
  onMoveBefore?: (id: string, beforeId: string) => void;
  /** sprint mode: pull a Ready item into the running Sprint. */
  onPull?: (id: string) => void;
}

/** The persistent Product Backlog: the whole undone-work list, ordered by the PO.
 *  You add and refine PBIs here, estimate unsized ones by planning poker, and either
 *  forecast them into the Sprint (Planning) or pull them in mid-Sprint (the board). */
export function ProductBacklogSidebar({ state, mode, onAddPbi, onRefinePbi, onSetUseStories, onEstimate, selected, onToggle, onReorder, onMoveBefore, onPull }: SidebarProps) {
  const [editingPbi, setEditingPbi] = useState<BacklogItem | 'new' | null>(null);
  const [estimating, setEstimating] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const items = availableItems(state);
  const estimatingItem = estimating ? items.find((i) => i.id === estimating) : null;

  return (
    <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span></h3>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingPbi('new')}><FilePlus className="mr-1 h-3.5 w-3.5" /> New PBI</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {mode === 'refine'
          ? 'Ordered by you (the PO). Estimate the unsized items and order the list, so the top items are Ready to plan. Refining now is free; later it happens on the board and costs the Sprint a little time.'
          : mode === 'plan'
            ? 'Ordered by you (the PO). Select the Ready ones to forecast into the Sprint (estimate any that are still unsized).'
            : 'Pull a Ready item into the Sprint by agreement, as long as it will not put the Sprint Goal at risk.'}
      </p>

      {editingPbi && (
        <PbiEditor zones={state.zones} item={editingPbi === 'new' ? undefined : editingPbi}
          useStories={state.useUserStories} onToggleStories={onSetUseStories}
          onSave={(d) => { if (editingPbi === 'new') onAddPbi(d); else onRefinePbi(editingPbi.id, d); setEditingPbi(null); }}
          onCancel={() => setEditingPbi(null)} />
      )}
      {estimatingItem && (
        <PlanningPoker item={estimatingItem} seed={state.gameSeed}
          onCommit={(pts) => { onEstimate?.(estimatingItem.id, pts); setEstimating(null); }}
          onCancel={() => setEstimating(null)} />
      )}

      <div className="space-y-1.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing left in the Backlog. Add a PBI{mode === 'sprint' ? ' or accept a signal at the Review' : ''}.</p>}
        {items.map((it, idx) => {
          const on = selected?.has(it.id);
          return (
            <div key={it.id}
              draggable={!!onMoveBefore}
              onDragStart={onMoveBefore ? (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.id); setDragId(it.id); } : undefined}
              onDragEnd={onMoveBefore ? () => setDragId(null) : undefined}
              onDragOver={onMoveBefore ? (e) => e.preventDefault() : undefined}
              onDrop={onMoveBefore ? (e) => { e.preventDefault(); const from = e.dataTransfer?.getData('text/plain') || dragId; if (from && from !== it.id) onMoveBefore(from, it.id); setDragId(null); } : undefined}
              className={cn('rounded-md border p-2 text-sm transition-colors', on ? 'border-primary bg-primary/5' : it.unsized ? 'border-dashed border-border bg-background/60' : 'border-border bg-card', dragId === it.id && 'opacity-50')}>
              <div className="flex items-start gap-1.5">
                {onReorder && (
                  <div className="flex flex-col items-center text-muted-foreground" title="Drag, or use the arrows, to reorder">
                    <button type="button" title="Move up" disabled={idx === 0} onClick={() => onReorder(it.id, 'up')} className="disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3 w-3" /></button>
                    <GripVertical className="h-3 w-3 cursor-grab opacity-50" />
                    <button type="button" title="Move down" disabled={idx === items.length - 1} onClick={() => onReorder(it.id, 'down')} className="disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3 w-3" /></button>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{it.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{it.zone}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{it.unsized ? '? pts' : `${it.estimate} pts`}</span>
                  </div>
                  {it.story && <div className="mt-0.5 truncate text-[10px] italic text-muted-foreground">{it.story}</div>}
                </div>
                <button type="button" title="Refine this PBI" onClick={() => setEditingPbi(it)} className="shrink-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                {it.unsized ? (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEstimating(it.id)}><HelpCircle className="mr-1 h-3.5 w-3.5" /> Estimate</Button>
                ) : mode === 'refine' ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Ready</span>
                ) : mode === 'plan' ? (
                  <Button size="sm" variant={on ? 'secondary' : 'default'} className="h-7 px-2 text-xs" onClick={() => onToggle?.(it.id)}>
                    {on ? 'In Sprint ✓' : <><Plus className="mr-1 h-3.5 w-3.5" /> Add to Sprint</>}
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => onPull?.(it.id)}><Plus className="mr-1 h-3.5 w-3.5" /> Add to Sprint</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
