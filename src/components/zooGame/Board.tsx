import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft, SprintTask } from './types';
import { availableItems, isSignOffTask, notReady, readyHorizon, suggestTasks } from './engine';
import { checkCriterion } from './parkChecks';
import { PlanningPoker } from './PlanningPoker';
import { PbiEditor } from './PbiEditor';
import { Toolbox } from './Toolbox';
import { toolboxDraft } from './toolboxItems';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Pencil, HelpCircle, FilePlus, GripVertical, ChevronUp, ChevronDown, Check, X, Wand2, ListChecks, Star, Boxes, Scissors, CopyPlus, Trash2, AlertCircle, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ICONS, iconKey } from './itemIcons';
import { PbiCard, CategoryChip } from './PbiCard';
import { Chip } from './ui/Chip';
import { Workspace } from './ui/Workspace';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';

/** The icon that reads for what the item IS - a cat for a tiger, a route for a pathway - so a long
 *  Backlog can be scanned by shape as well as by name. See itemIcons.ts for the mapping. */
export function CategoryIcon({ item, className }: { item: BacklogItem; className?: string }) {
  const Icon = ICONS[iconKey(item)];
  return <Icon className={className} />;
}

/** Refine an epic: tick the members to split out into their own PBIs (each animal becomes
 *  an enclosure + the animal that depends on it; each facility becomes an amenity). */
export function SplitEpicPanel({ epic, onSplit }: { epic: BacklogItem; onSplit: (memberIds: string[]) => void }) {
  const members = epic.epicMembers ?? [];
  const [picked, setPicked] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const toggle = (id: string) => setPicked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const count = members.filter((m) => picked.has(m.id)).reduce((n, m) => n + (m.kind === 'exhibit' ? 2 : 1), 0);
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Each animal becomes an enclosure plus the animal that lives in it (the animal can&rsquo;t be built until its enclosure is). Untick anything you don&rsquo;t want yet - the epic stays for the rest.</p>
      <p className="text-[11px] text-muted-foreground/70">
        &ldquo;Epic&rdquo; and splitting are common practice, not Scrum. The Guide has one kind of thing on a Product Backlog and
        asks only that an item you forecast can be Done inside a Sprint - splitting is how you get there.
      </p>
      <ul className="space-y-1.5">
        {members.map((mem) => (
          <li key={mem.id}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={picked.has(mem.id)} onChange={() => toggle(mem.id)} />
              <span className="font-medium">{mem.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{mem.kind === 'exhibit' ? 'animal + enclosure' : 'facility'}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button size="sm" disabled={count === 0} onClick={() => onSplit(members.filter((m) => picked.has(m.id)).map((m) => m.id))}>Create {count} Product Backlog item{count === 1 ? '' : 's'}</Button>
      </div>
    </div>
  );
}

/** One board column - To Do / Doing / Done - with a header count and an empty hint. When
 *  `limit` is set (a WIP limit) the header shows count/limit and flags when it is full. */
export function BoardColumn({ title, count, hint, tone = 'default', limit, note, children }: { title: string; count: number; hint?: string; tone?: 'default' | 'done'; limit?: number; note?: ReactNode; children?: ReactNode }) {
  const full = limit != null && count >= limit;
  return (
    <div className="flex min-w-0 flex-col">
      <div className={cn('flex items-center justify-between rounded-t-lg border border-b-0 border-border px-3 py-2',
        tone === 'done' ? 'bg-emerald-100/60 dark:bg-emerald-950/30' : full ? 'bg-amber-100/70 dark:bg-amber-950/30' : 'bg-muted')}>
        <h3 className="text-sm font-semibold">{title} <span className={cn('font-normal', full ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>({count}{limit != null ? `/${limit}` : ''})</span></h3>
        <span className="flex items-center gap-1">
          {limit != null && <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground" title="Work-in-progress limit - Lean thinking that supports Scrum, not a Scrum Guide rule">WIP</span>}
          {note}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 rounded-b-lg border border-border bg-card/40 p-2" style={{ minHeight: 84 }}>
        {count === 0 && <div className="py-5 text-center text-[11px] text-muted-foreground/50">{hint ?? '—'}</div>}
        {children}
      </div>
    </div>
  );
}

/** Plan-time task decomposition for one PBI (Sprint Planning's "how"): a coached
 *  breakdown you can suggest, then add / edit / remove. Optionally shows a goal-critical
 *  star, so the Scrum Team marks which items the Sprint Goal truly depends on. */
export function TaskEditor({ item, onSetTasks, onToggleGoalCritical, onClose }: { item: BacklogItem; onSetTasks: (id: string, tasks: SprintTask[]) => void; onToggleGoalCritical?: (id: string) => void; onClose?: () => void }) {
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
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.estimate} pts</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleGoalCritical && (
            <button type="button" onClick={() => onToggleGoalCritical(item.id)}
              title={item.goalCritical ? 'Essential to the Sprint Goal - click to unmark' : 'Mark essential to the Sprint Goal'}
              className={cn(FOCUS, 'flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors',
                item.goalCritical ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600')}>
              <Star className={cn('h-3.5 w-3.5', item.goalCritical && 'fill-amber-400')} /> Goal
            </button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => set(suggestTasks(item))}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest tasks
          </Button>
          {/* The way out, where you would look for it: on the thing you opened, not under it. */}
          {onClose && (
            <button type="button" onClick={onClose} title="Close this plan" aria-label={`Close the plan for ${item.name}`}
              className={cn(FOCUS, "rounded-md border border-border p-1 text-muted-foreground transition-colors hover:text-foreground")}>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {tasks.length === 0 && <p className="text-[11px] text-muted-foreground/70">No tasks yet - suggest a breakdown or add your own steps for how this gets built.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <input value={t.label} onChange={(e) => edit(t.id, e.target.value)} placeholder="A step to build it"
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
            <button type="button" onClick={() => remove(t.id)} className={cn(FOCUS, "shrink-0 text-muted-foreground hover:text-foreground")} aria-label="Remove task"><X className="h-3.5 w-3.5" /></button>
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
        {tasks.map((t) => {
          // The Product Owner's sign-off is not the Developers' to tick: it follows the acceptance
          // criteria, and the placement ones cannot be met until the item is on the park. So it is
          // shown, greyed, with what it is still waiting for.
          const signOff = isSignOffTask(t.label);
          return (
            <label key={t.id} className={cn('flex items-start gap-1.5 text-[11px]', !readOnly && !signOff && 'cursor-pointer')}>
              <input type="checkbox" checked={t.done} disabled={readOnly || signOff} onChange={() => onToggle(item.id, t.id)} className="mt-0.5 h-3 w-3 shrink-0" />
              <span className={cn(t.done && 'text-muted-foreground line-through', signOff && !t.done && 'text-muted-foreground')}>
                {t.label}
                {signOff && !t.done && <span className="block text-[11px] text-muted-foreground/70">Once every acceptance criterion is met, including where it stands on the park.</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** A board card's detail (acceptance criteria + the task plan), collapsed behind a one-line
 *  toggle by default so cards stay short in narrow columns. `defaultOpen` keeps the active
 *  (Build) card expanded; `interactive` allows ticking tasks. A criterion is green only once
 *  somebody has ticked it; a card
 *  still in Build/To Do shows them pending. Each card keeps its own open state. */
export function CardDetail({ item, state, showAcceptance = false, interactive = false, defaultOpen = false, bare = false, onToggleTask, onConfirmAc }:
  { item: BacklogItem;
    /** Given, the park answers the criteria it can answer for itself, and shows its working. */
    state?: ZooGameState;
    showAcceptance?: boolean; interactive?: boolean; defaultOpen?: boolean;
    /** On the design bench there is nothing to save by collapsing this - it IS the work, and a row
     *  of pips you have to open to act on is a step between you and the only thing on the screen. */
    bare?: boolean; onToggleTask: (id: string, taskId: string) => void;
    /** Accepting a criterion. It belongs HERE, on the item's own card, not on a toolbar floating
     *  over the park or in a banner - the card is the Product Backlog item, and accepting is
     *  something you do to the item. */
    onConfirmAc?: (id: string, index: number, value: boolean) => void }) {
  const tasks = (item.tasks ?? []).filter((t) => t.label.trim());
  const criteria = showAcceptance ? item.acceptance.filter(Boolean) : [];
  const [ownOpen, setOpen] = useState(defaultOpen);
  const open = bare || ownOpen;
  if (tasks.length === 0 && criteria.length === 0) return null;
  const done = tasks.filter((t) => t.done).length;
  // Met means somebody said so. Nothing here ticks itself: the game used to mark the build criteria
  // green the moment an item had a design, on the reasoning that it could not have left the studio
  // otherwise - but there is no studio now, you build on the park, and a criterion nobody looked at
  // is not a criterion that has been met. This count is what the Product Owner's sign-off waits on.
  const met = (_label: string, i: number) => !!item.acConfirmed?.[i];
  const acMet = criteria.filter(met).length;
  const acAll = criteria.length > 0 && acMet === criteria.length;
  return (
    <div className={bare ? undefined : 'mt-1.5'}>
      {/* Progress as pips, the way the Flow Game shows it: you can read how far a card has got
          without opening it, and the numbers only matter when you are working on it. Shape carries
          the ownership - squares are the Developers' plan, circles are the Product Owner's criteria -
          so two rows of the same colour do not read as one long row. */}
      {!bare && <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={ownOpen}
        className={cn(FOCUS, "flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground")}>
        <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', !ownOpen && '-rotate-90')} />
        {tasks.length > 0 && (
          <span className="flex items-center gap-1" title={`Plan: ${done} of ${tasks.length} steps done`}>
            <ListChecks className={cn('h-3 w-3 shrink-0', done === tasks.length && 'text-emerald-600 dark:text-emerald-400')} />
            <span className="flex gap-0.5">
              {tasks.map((t, i) => (
                // Emerald means done, everywhere in this game. Orange is the thing to do NEXT, and a
                // finished step wearing it read as "act on me".
                <span key={t.id ?? i} className={cn('h-2 w-1.5 rounded-[1px]', t.done ? 'bg-emerald-500' : 'bg-muted-foreground/25')} />
              ))}
            </span>
          </span>
        )}
        {criteria.length > 0 && (
          <span className="flex items-center gap-1" title={`Acceptance criteria: ${acMet} of ${criteria.length} met`}>
            <Check className={cn('h-3 w-3 shrink-0', acAll && 'text-emerald-600 dark:text-emerald-400')} />
            <span className="flex gap-0.5">
              {criteria.map((c, i) => (
                <span key={i} className={cn('h-2 w-2 rounded-full', met(c, i) ? 'bg-emerald-500' : 'border border-muted-foreground/30')} />
              ))}
            </span>
          </span>
        )}
      </button>}
      {open && (
        <div className={cn('space-y-1.5', !bare && 'mt-1')}>
          {criteria.length > 0 && (
            <div>
              <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Acceptance criteria{interactive && onConfirmAc ? ' - tick what your build meets' : ''}
                {state && criteria.some((c) => checkCriterion(state, item, c)) && (
                  <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/70">the park answers the ones it can</span>
                )}
              </div>
              <ul className="space-y-0.5">
                {criteria.map((c, i) => {
                  const ok = met(c, i);
                  // The park's own answer, where it has one. A fact is not something you agree to,
                  // so it is not a button - it is a reading, with what it read beside it.
                  const v = state ? checkCriterion(state, item, c) : null;
                  const canTick = interactive && !!onConfirmAc && !v;
                  const body = (
                    <>
                      <span className={cn('mt-[1px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full',
                        ok ? 'bg-emerald-500 text-white' : 'border border-border')}>{ok && <Check className="h-2 w-2" />}</span>
                      <span className={cn(ok ? 'text-muted-foreground line-through decoration-emerald-500/40' : 'text-muted-foreground')}>{c}</span>
                      {v && (
                        <span className={cn('ml-auto shrink-0 rounded px-1 text-[9px] font-medium',
                          v.met ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400')}
                          title="The park measured this one - it is not yours to tick">
                          {v.evidence}
                        </span>
                      )}
                    </>
                  );
                  return (
                    <li key={i}>
                      {v
                        ? <span className="flex w-full items-start gap-1.5 text-left text-[11px]">{body}</span>
                        : (
                          <button type="button" disabled={!canTick} onClick={(e) => { e.stopPropagation(); onConfirmAc!(item.id, i, !item.acConfirmed?.[i]); }}
                            className={cn(FOCUS, "flex w-full items-start gap-1.5 text-left text-[11px] disabled:cursor-default")}>
                            {body}
                          </button>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {tasks.length > 0 && <TaskChecklist item={item} onToggle={onToggleTask} readOnly={!interactive} />}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  state: ZooGameState;
  mode: 'plan' | 'sprint' | 'refine' | 'view';
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onSetUseStories: (on: boolean) => void;
  /** plan mode: estimate an unsized item; select/deselect for the forecast. */
  onEstimate?: (id: string, points: number) => void;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onReorder?: (id: string, dir: 'up' | 'down') => void;
  /** Move a whole zone (a themed epic and all its PBIs) up/down among the zones. */
  onMoveZone?: (zone: string, dir: 'up' | 'down') => void;
  onMoveBefore?: (id: string, beforeId: string) => void;
  /** Tells the page how wide the panel wants to be, so the layout can follow it. */
  onWidth?: (wide: boolean) => void;
  /** sprint mode: pull a Ready item into the running Sprint. */
  onPull?: (id: string) => void;
  /** Refine an epic by splitting the chosen members into their own PBIs. */
  onSplitEpic?: (id: string, memberIds: string[]) => void;
  /** Delete or duplicate a Backlog PBI. */
  onDeletePbi?: (id: string) => void;
  onDuplicatePbi?: (id: string) => void;
}

/** The persistent Product Backlog: the whole undone-work list, ordered by the PO.
 *  You add and refine PBIs here, estimate unsized ones by planning poker, and either
 *  forecast them into the Sprint (Planning) or pull them in mid-Sprint (the board). */
export function ProductBacklogSidebar({ state, mode, onWidth, onAddPbi, onRefinePbi, onSetUseStories, onEstimate, selected, onToggle, onReorder, onMoveZone, onMoveBefore, onPull, onSplitEpic, onDeletePbi, onDuplicatePbi }: SidebarProps) {
  const [editingPbi, setEditingPbi] = useState<BacklogItem | 'new' | null>(null);
  const [estimating, setEstimating] = useState<string | null>(null);
  const [splitting, setSplitting] = useState<BacklogItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showToolbox, setShowToolbox] = useState(false);
  const [wide, setWide] = useState(false); // a narrow rail by default, widened to read comfortably
  useEffect(() => { onWidth?.(wide); }, [wide, onWidth]);
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());
  // PBIs render collapsed (one neat line) by default; expand on demand for the detail.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const toggleItem = (id: string) => setExpandedItems((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // two-step delete guard
  const items = availableItems(state);
  const horizon = readyHorizon(state); // Sprints' worth of Ready work - refinement aims to keep 1-3
  // Existing enclosures an animal can be assigned to (animals and enclosures are separate PBIs).
  const enclosures = state.backlog.filter((it) => it.category === 'enclosure').map((it) => ({ id: it.id, name: it.name }));
  const estimatingItem = estimating ? items.find((i) => i.id === estimating) : null;

  // Group the Backlog by zone (in first-appearance order) so a long list stays scannable;
  // reorder/drag still act on the whole ordered Backlog underneath.
  const flatIndex = new Map(items.map((it, i) => [it.id, i]));
  const zoneOrder: string[] = [];
  const byZone = new Map<string, BacklogItem[]>();
  for (const it of items) {
    if (!byZone.has(it.zone)) { byZone.set(it.zone, []); zoneOrder.push(it.zone); }
    byZone.get(it.zone)!.push(it);
  }
  const toggleZone = (z: string) => setCollapsedZones((prev) => { const n = new Set(prev); if (n.has(z)) n.delete(z); else n.add(z); return n; });

  const renderItem = (it: BacklogItem, idx: number) => {
    const on = selected?.has(it.id);
    const why = notReady(it); // null once it meets the Definition of Ready
    const isOpen = expandedItems.has(it.id);
    // Whether the item is Ready is a fact ABOUT the item, so it reads with the badges; what you can
    // do about it is a button, and sits with the actions. Keeping them apart is what lets a row fit
    // in the narrow Backlog rail. In Planning an unready item cannot be forecast until it is put
    // right - the Guide allows refining here ("The Scrum Team may refine these items during this
    // process"), but a Backlog refined during the last Sprint would not need it.
    const status = why ? (
      <span title={mode === 'plan' ? `${why}. You can put that right here, but a Backlog refined during the last Sprint would not need it - and this is Planning's time.` : why}
        className={cn(TONE.attention.text, "flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide")}>
        <AlertCircle className="h-3 w-3" /> Not ready
      </span>
    ) : mode === 'view' || mode === 'refine' ? (
      <span className={cn(TONE.done.text, "flex shrink-0 items-center gap-1 text-[11px] font-medium")}><Check className="h-3.5 w-3.5" /> Ready</span>
    ) : null;
    const action =
      // This Backlog is being discussed, not worked on: no splitting, sizing or selecting here.
      mode === 'view' ? null
      : it.category === 'epic' ? (
        // An outline button beside a grey "Not ready" chip reads as an option. Splitting an epic is
        // the work this screen is asking for, so it asks.
        <Button size="sm" className={cn(TONE.reflect.solid, "h-7 shrink-0 px-2 text-xs text-white hover:bg-rose-700")} onClick={() => setSplitting(it)}><Scissors className="mr-1 h-3.5 w-3.5" /> Split it up</Button>
      ) : it.unsized ? (
        <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => setEstimating(it.id)}><HelpCircle className="mr-1 h-3.5 w-3.5" /> Estimate</Button>
      ) : mode === 'refine' ? null
      : mode === 'plan' ? (
        // Sizing is refinement, not planning, so an item that is not ready for another reason has
        // no button here: it is fixed by refining it.
        why ? null : (
          <Button size="sm" variant={on ? 'secondary' : 'default'} className="h-7 shrink-0 px-2 text-xs" onClick={() => onToggle?.(it.id)}>
            {on ? 'In Sprint ✓' : <><Plus className="mr-1 h-3.5 w-3.5" /> Pull in</>}
          </Button>
        )
      ) : (
        <Button size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => onPull?.(it.id)}><Plus className="mr-1 h-3.5 w-3.5" /> Pull in</Button>
      );
    return (
      <div key={it.id}
        draggable={!!onMoveBefore}
        onDragStart={onMoveBefore ? (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.id); setDragId(it.id); } : undefined}
        onDragEnd={onMoveBefore ? () => setDragId(null) : undefined}
        onDragOver={onMoveBefore ? (e) => e.preventDefault() : undefined}
        onDrop={onMoveBefore ? (e) => { e.preventDefault(); const from = e.dataTransfer?.getData('text/plain') || dragId; if (from && from !== it.id) onMoveBefore(from, it.id); setDragId(null); } : undefined}
        className={cn(dragId === it.id && 'opacity-50')}>
        {/* The same card as everywhere else, with this screen's controls on it: re-order handles
            and an expand toggle in front, the action behind. */}
        {/* Red, amber, green down the left edge: an epic nobody has split is red, an item waiting to
            be sized is amber, an item that meets the Definition of Ready is green. One glance tells
            you what is left to do, which is the question this screen is asking. */}
        <PbiCard item={it} state={why ? 'locked' : on ? 'forecast' : 'backlog'}
          className={mode === 'refine' || mode === 'plan'
            ? cn('border-2', it.category === 'epic' ? 'border-rose-400 bg-rose-500/[0.04]'
              : why ? 'border-amber-400 bg-amber-500/[0.05]'
              : 'border-emerald-400 bg-emerald-500/[0.04]')
            : undefined}
          lead={<>
            {onReorder && (
              <div className="flex shrink-0 flex-col items-center leading-none text-muted-foreground" title="Drag the card, or use the arrows, to reorder">
                <button type="button" title="Move up" disabled={idx === 0} onClick={() => onReorder(it.id, 'up')} className={cn(FOCUS, "disabled:opacity-30 hover:text-foreground")}><ChevronUp className="h-3 w-3" /></button>
                <GripVertical className="h-3 w-3 cursor-grab opacity-50" />
                <button type="button" title="Move down" disabled={idx === items.length - 1} onClick={() => onReorder(it.id, 'down')} className={cn(FOCUS, "disabled:opacity-30 hover:text-foreground")}><ChevronDown className="h-3 w-3" /></button>
              </div>
            )}
            <button type="button" onClick={() => toggleItem(it.id)} title={isOpen ? 'Collapse' : 'Expand'} aria-expanded={isOpen}
              className={cn(FOCUS, "shrink-0 text-muted-foreground hover:text-foreground")}>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
            </button>
          </>}
          badges={<>
            <CategoryChip item={it} />
            {it.carriedOver && <Chip tone="attention" title={`Carried over unfinished - re-estimate the work that's left (was ${it.estimate} pts)`}>carried over</Chip>}
            {status}
          </>}
          trailing={action}
          detail={
            isOpen ? (
          <div className="mt-1.5 space-y-1.5 border-t border-border/60 pt-1.5 pl-5">
            {/* Read-only view of the PBI: story, acceptance criteria and where it lives - so you
                can inspect an item without opening the editor (Refine). */}
            {it.story && <div className="text-[11px] italic text-muted-foreground">{it.story}</div>}
            {it.acceptance && it.acceptance.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Acceptance criteria</div>
                <ul className="mt-0.5 space-y-0.5">
                  {it.acceptance.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px] text-muted-foreground"><span className="text-muted-foreground/50">&bull;</span><span>{c}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {it.category === 'exhibit' && (
              <div className="text-[11px] text-muted-foreground">Lives in: <span className="font-medium text-foreground">{enclosures.find((e) => e.id === it.enclosureId)?.name ?? 'an enclosure (set when refining)'}</span></div>
            )}
            {(() => { const t = (it.tasks ?? []).filter((x) => x.label.trim()); return t.length > 0 ? (
              <div className="text-[11px] text-muted-foreground">Plan: <span className="font-medium text-foreground">{t.filter((x) => x.done).length}/{t.length}</span> task{t.length === 1 ? '' : 's'}</div>
            ) : null; })()}
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              <button type="button" onClick={() => setEditingPbi(it)} className={cn(FOCUS, "flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground")}><Pencil className="h-3.5 w-3.5" /> Refine</button>
              {onDuplicatePbi && (
                <button type="button" onClick={() => onDuplicatePbi(it.id)} className={cn(FOCUS, "flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground")}><CopyPlus className="h-3.5 w-3.5" /> Duplicate</button>
              )}
              {onDeletePbi && (confirmDelete === it.id ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span className="text-muted-foreground">Delete?</span>
                  <button type="button" onClick={() => { onDeletePbi(it.id); setConfirmDelete(null); }} className={cn(FOCUS, "text-destructive hover:underline")}>Yes</button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className={cn(FOCUS, "text-muted-foreground hover:text-foreground")}>No</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(it.id)} className={cn(FOCUS, "flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              ))}
            </div>
          </div>
        ) : undefined} />
      </div>
    );
  };

  return (
    <section className={cn(SURFACE.quiet, PADDING.default, 'space-y-2')}>
      {showToolbox && <Toolbox onPick={(t) => onAddPbi(toolboxDraft(t))} onClose={() => setShowToolbox(false)} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <button type="button" onClick={() => setWide((w) => !w)}
            title={wide ? 'Narrow the Product Backlog' : 'Widen the Product Backlog to read it'}
            aria-label={wide ? 'Narrow the Product Backlog' : 'Widen the Product Backlog'}
            className={cn(FOCUS, "rounded border border-border p-0.5 text-muted-foreground transition-colors hover:text-foreground")}>
            {wide ? <ChevronsLeft className="h-3 w-3" /> : <ChevronsRight className="h-3 w-3" />}
          </button>
          Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span>
          {mode === 'sprint' && (
            // How far ahead the Backlog is prepared. Refining here costs the day's build time, and
            // what it prepares is for LATER Sprints - this Sprint's plan is already settled.
            <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
              horizon > 3 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                : horizon >= 1 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground')}
              title="Sprints' worth of Ready work waiting. Refine ahead during this Sprint - it costs build time - so the next Planning has something to choose from. Aim for one to three.">
              {horizon} ready
            </span>
          )}
        </h3>
        {mode !== 'view' && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setShowToolbox(true)}><Boxes className="mr-1 h-3.5 w-3.5" /> Toolbox</Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingPbi('new')}><FilePlus className="mr-1 h-3.5 w-3.5" /> New PBI</Button>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {mode === 'view'
          ? 'Ordered by the Product Owner, most valuable first. This is what a Sprint Goal is built from - read it, then select the work in topic two.'
          : mode === 'refine'
          ? 'Ordered by you (the PO). Estimate the unsized items and order the list, so the top items are Ready to plan. Refining now is free; later it happens on the board and costs the Sprint a little time.'
          : mode === 'plan'
            ? 'Ordered by you (the PO). The Developers select the ready ones they forecast they can finish, and those become the Sprint Backlog.'
            : 'Pull a Ready item in by agreement, if it will not put the Sprint Goal at risk. Refining here is the whole Scrum Team\u2019s work and costs the day\u2019s build time - what it prepares is later Sprints.'}
      </p>

      {/* Each of these is its own conversation, so each takes over rather than being squeezed into
          the top of a list that scrolls inside a fixed height. */}
      {editingPbi && (
        <Workspace title={editingPbi === 'new' ? 'A new Product Backlog item' : `Refine ${editingPbi.name}`}
          subtitle="What it is, who it is for, and how you will know it is done."
          onClose={() => setEditingPbi(null)}>
          <PbiEditor zones={state.zones} item={editingPbi === 'new' ? undefined : editingPbi} enclosures={enclosures}
            useStories={state.useUserStories} onToggleStories={onSetUseStories}
            onSave={(d) => { if (editingPbi === 'new') onAddPbi(d); else onRefinePbi(editingPbi.id, d); setEditingPbi(null); }}
            onEstimate={editingPbi !== 'new' ? (pts) => onEstimate?.(editingPbi.id, pts) : undefined}
            onCancel={() => setEditingPbi(null)} />
        </Workspace>
      )}
      {splitting && (
        <Workspace wide title={`Split ${splitting.name}`}
          subtitle="Too big to finish in a Sprint, so break it into pieces you could actually build."
          onClose={() => setSplitting(null)}>
          <SplitEpicPanel epic={splitting}
            onSplit={(ids) => { onSplitEpic?.(splitting.id, ids); setSplitting(null); }} />
        </Workspace>
      )}
      {estimatingItem && (
        <Workspace title={`Size ${estimatingItem.name}`}
          subtitle="The Developers size the work, because they are the ones who will do it."
          onClose={() => setEstimating(null)}>
          <PlanningPoker item={estimatingItem} state={state} seed={state.gameSeed}
            onCommit={(pts) => { onEstimate?.(estimatingItem.id, pts); setEstimating(null); }} />
        </Workspace>
      )}

      <div className="space-y-2.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing left in the Backlog. Add a PBI{mode === 'sprint' ? ' or accept a signal at the Review' : ''}.</p>}
        {zoneOrder.map((zone, zi) => {
          const zoneItems = byZone.get(zone)!;
          const collapsed = collapsedZones.has(zone);
          return (
            <div key={zone} className="space-y-1.5">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => toggleZone(zone)}
                  className={cn(FOCUS, "flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground")}>
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', collapsed && '-rotate-90')} />
                  <span className="truncate">{zone}</span> <span className="font-normal text-muted-foreground/60">({zoneItems.length})</span>
                </button>
                {/* Move the whole theme (epic) up or down among the zones - the PO ordering by
                    value. A labelled, bordered pill so it reads as a reorder control, distinct
                    from the collapse chevron on the left. */}
                {onMoveZone && zoneOrder.length > 1 && (
                  <div className={cn(SURFACE.inset, 'flex shrink-0 items-center gap-0.5 px-1 py-0.5 text-muted-foreground')} title={`Move the ${zone} theme up or down`}>
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Move</span>
                    <button type="button" aria-label={`Move ${zone} up`} title={`Move ${zone} up`} disabled={zi === 0} onClick={() => onMoveZone(zone, 'up')} className={cn(FOCUS, "rounded disabled:opacity-30 hover:text-foreground")}><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Move ${zone} down`} title={`Move ${zone} down`} disabled={zi === zoneOrder.length - 1} onClick={() => onMoveZone(zone, 'down')} className={cn(FOCUS, "rounded disabled:opacity-30 hover:text-foreground")}><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              {!collapsed && <div className="space-y-1.5">{zoneItems.map((it) => renderItem(it, flatIndex.get(it.id)!))}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
