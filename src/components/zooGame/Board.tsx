import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft, SprintTask } from './types';
import { availableItems, suggestTasks } from './engine';
import { PlanningPoker } from './PlanningPoker';
import { PbiEditor } from './PbiEditor';
import { Toolbox } from './Toolbox';
import { toolboxDraft } from './toolboxItems';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Fish, Coffee, Trees, Plus, Pencil, HelpCircle, FilePlus, GripVertical, ChevronUp, ChevronDown, Check, X, Wand2, ListChecks, Star, Boxes, Layers, Scissors, CopyPlus, Trash2 } from 'lucide-react';

/** The icon that reads for an item's kind (rendered directly so it stays stable). */
export function CategoryIcon({ item, className }: { item: BacklogItem; className?: string }) {
  if (item.category === 'epic') return <Layers className={className} />;
  if (item.category === 'enclosure') return <Boxes className={className} />;
  if (item.category === 'flora') return <Trees className={className} />;
  if (item.category === 'amenity') return item.services === 'food' ? <Coffee className={className} /> : <Plus className={className} />;
  return <Fish className={className} />;
}

/** Refine an epic: tick the members to split out into their own PBIs (each animal becomes
 *  an enclosure + the animal that depends on it; each facility becomes an amenity). */
function SplitEpicPanel({ epic, onSplit, onCancel }: { epic: BacklogItem; onSplit: (memberIds: string[]) => void; onCancel: () => void }) {
  const members = epic.epicMembers ?? [];
  const [picked, setPicked] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const toggle = (id: string) => setPicked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const count = members.filter((m) => picked.has(m.id)).reduce((n, m) => n + (m.kind === 'exhibit' ? 2 : 1), 0);
  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold"><Scissors className="mr-1 inline h-3.5 w-3.5" />Split &ldquo;{epic.name}&rdquo; into PBIs</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Each animal becomes an enclosure plus the animal that lives in it (the animal can&rsquo;t be built until its enclosure is). Untick anything you don&rsquo;t want yet - the epic stays for the rest.</p>
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
        <Button size="sm" disabled={count === 0} onClick={() => onSplit(members.filter((m) => picked.has(m.id)).map((m) => m.id))}>Create {count} PBI{count === 1 ? '' : 's'}</Button>
      </div>
    </div>
  );
}

/** One board column - To Do / Doing / Done - with a header count and an empty hint. When
 *  `limit` is set (a WIP limit) the header shows count/limit and flags when it is full. */
export function BoardColumn({ title, count, hint, tone = 'default', limit, children }: { title: string; count: number; hint?: string; tone?: 'default' | 'done'; limit?: number; children?: ReactNode }) {
  const full = limit != null && count >= limit;
  return (
    <div className="flex min-w-0 flex-col">
      <div className={cn('flex items-center justify-between rounded-t-lg border border-b-0 border-border px-3 py-2',
        tone === 'done' ? 'bg-emerald-100/60 dark:bg-emerald-950/30' : full ? 'bg-amber-100/70 dark:bg-amber-950/30' : 'bg-muted')}>
        <h3 className="text-sm font-semibold">{title} <span className={cn('font-normal', full ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>({count}{limit != null ? `/${limit}` : ''})</span></h3>
        {limit != null && <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground" title="Work-in-progress limit">WIP</span>}
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

/** A board card's detail (acceptance criteria + the task plan), collapsed behind a one-line
 *  toggle by default so cards stay short in narrow columns. `defaultOpen` keeps the active
 *  (Build) card expanded; `interactive` allows ticking tasks. `built` marks the acceptance
 *  criteria green (met) - an item that has been built to the studio has met them all; a card
 *  still in Build/To Do shows them pending. Each card keeps its own open state. */
export function CardDetail({ item, showAcceptance = false, interactive = false, defaultOpen = false, built = false, onToggleTask }:
  { item: BacklogItem; showAcceptance?: boolean; interactive?: boolean; defaultOpen?: boolean; built?: boolean; onToggleTask: (id: string, taskId: string) => void }) {
  const tasks = (item.tasks ?? []).filter((t) => t.label.trim());
  const criteria = showAcceptance ? item.acceptance.filter(Boolean) : [];
  const [open, setOpen] = useState(defaultOpen);
  if (tasks.length === 0 && criteria.length === 0) return null;
  const done = tasks.filter((t) => t.done).length;
  const acMet = built ? criteria.length : 0;
  const acAll = criteria.length > 0 && acMet === criteria.length;
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', !open && '-rotate-90')} />
        {tasks.length > 0 && <span className="flex items-center gap-0.5"><ListChecks className="h-3 w-3" /> Plan {done}/{tasks.length}</span>}
        {criteria.length > 0 && <span className={cn(acAll && 'text-emerald-600 dark:text-emerald-400')}>{tasks.length > 0 ? '· ' : ''}AC {acMet}/{criteria.length}</span>}
      </button>
      {open && (
        <div className="mt-1 space-y-1.5">
          {criteria.length > 0 && (
            <div>
              <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Acceptance criteria</div>
              <ul className="space-y-0.5">
                {criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px]">
                    <span className={cn('mt-[1px] flex h-3 w-3 shrink-0 items-center justify-center rounded-full', built ? 'bg-emerald-500 text-white' : 'border border-border')}>{built && <Check className="h-2 w-2" />}</span>
                    <span className={cn(built ? 'text-muted-foreground line-through decoration-emerald-500/40' : 'text-muted-foreground')}>{c}</span>
                  </li>
                ))}
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
  mode: 'plan' | 'sprint' | 'refine';
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
export function ProductBacklogSidebar({ state, mode, onAddPbi, onRefinePbi, onSetUseStories, onEstimate, selected, onToggle, onReorder, onMoveZone, onMoveBefore, onPull, onSplitEpic, onDeletePbi, onDuplicatePbi }: SidebarProps) {
  const [editingPbi, setEditingPbi] = useState<BacklogItem | 'new' | null>(null);
  const [estimating, setEstimating] = useState<string | null>(null);
  const [splitting, setSplitting] = useState<BacklogItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showToolbox, setShowToolbox] = useState(false);
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());
  // PBIs render collapsed (one neat line) by default; expand on demand for the detail.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const toggleItem = (id: string) => setExpandedItems((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // two-step delete guard
  // The estimate/refine/split panels open at the top of the list; if the clicked item was
  // scrolled down, bring the panel into view so you don't have to scroll up to find it.
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editingPbi || estimating || splitting) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [editingPbi, estimating, splitting]);
  const items = availableItems(state);
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
    const isOpen = expandedItems.has(it.id);
    const action =
      it.category === 'epic' ? (
        <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => setSplitting(it)}><Scissors className="mr-1 h-3.5 w-3.5" /> Split</Button>
      ) : it.unsized ? (
        <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => setEstimating(it.id)}><HelpCircle className="mr-1 h-3.5 w-3.5" /> Estimate</Button>
      ) : mode === 'refine' ? (
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Ready</span>
      ) : mode === 'plan' ? (
        <Button size="sm" variant={on ? 'secondary' : 'default'} className="h-7 shrink-0 px-2 text-xs" onClick={() => onToggle?.(it.id)}>
          {on ? 'In Sprint ✓' : <><Plus className="mr-1 h-3.5 w-3.5" /> Pull in</>}
        </Button>
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
        className={cn('rounded-md border px-2 py-1.5 text-sm transition-colors', on ? 'border-primary bg-primary/5' : it.unsized ? 'border-dashed border-border bg-background/60' : 'border-border bg-card', dragId === it.id && 'opacity-50')}>
        {/* Collapsed by default: one line - reorder handle, expand toggle, name, points, primary action.
            Reorder stays visible while collapsed (drag the card, or use the arrows). */}
        <div className="flex items-center gap-1.5">
          {onReorder && (
            <div className="flex shrink-0 flex-col items-center leading-none text-muted-foreground" title="Drag the card, or use the arrows, to reorder">
              <button type="button" title="Move up" disabled={idx === 0} onClick={() => onReorder(it.id, 'up')} className="disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3 w-3" /></button>
              <GripVertical className="h-3 w-3 cursor-grab opacity-50" />
              <button type="button" title="Move down" disabled={idx === items.length - 1} onClick={() => onReorder(it.id, 'down')} className="disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3 w-3" /></button>
            </div>
          )}
          <button type="button" onClick={() => toggleItem(it.id)} title={isOpen ? 'Collapse' : 'Expand'} aria-expanded={isOpen}
            className="shrink-0 text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
          </button>
          <CategoryIcon item={it} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <button type="button" onClick={() => toggleItem(it.id)} className="min-w-0 flex-1 truncate text-left font-medium hover:text-foreground">{it.name}</button>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{it.unsized ? '? pts' : `${it.estimate} pts`}</span>
          {action}
        </div>
        {isOpen && (
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
              <button type="button" onClick={() => setEditingPbi(it)} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /> Refine</button>
              {onDuplicatePbi && (
                <button type="button" onClick={() => onDuplicatePbi(it.id)} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"><CopyPlus className="h-3.5 w-3.5" /> Duplicate</button>
              )}
              {onDeletePbi && (confirmDelete === it.id ? (
                <span className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span className="text-muted-foreground">Delete?</span>
                  <button type="button" onClick={() => { onDeletePbi(it.id); setConfirmDelete(null); }} className="text-destructive hover:underline">Yes</button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className="text-muted-foreground hover:text-foreground">No</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(it.id)} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      {showToolbox && <Toolbox onPick={(t) => onAddPbi(toolboxDraft(t))} onClose={() => setShowToolbox(false)} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span></h3>
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setShowToolbox(true)}><Boxes className="mr-1 h-3.5 w-3.5" /> Toolbox</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingPbi('new')}><FilePlus className="mr-1 h-3.5 w-3.5" /> New PBI</Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {mode === 'refine'
          ? 'Ordered by you (the PO). Estimate the unsized items and order the list, so the top items are Ready to plan. Refining now is free; later it happens on the board and costs the Sprint a little time.'
          : mode === 'plan'
            ? 'Ordered by you (the PO). The Developers pull the Ready ones they will commit to into the Sprint (estimate any that are still unsized).'
            : 'Pull a Ready item into the Sprint by agreement, as long as it will not put the Sprint Goal at risk. Refining here (estimating, splitting, adding) is ongoing work - it takes time from the day’s build.'}
      </p>

      <div ref={editorRef}>
      {editingPbi && (
        <PbiEditor zones={state.zones} item={editingPbi === 'new' ? undefined : editingPbi} enclosures={enclosures}
          useStories={state.useUserStories} onToggleStories={onSetUseStories}
          onSave={(d) => { if (editingPbi === 'new') onAddPbi(d); else onRefinePbi(editingPbi.id, d); setEditingPbi(null); }}
          onEstimate={editingPbi !== 'new' ? (pts) => onEstimate?.(editingPbi.id, pts) : undefined}
          onCancel={() => setEditingPbi(null)} />
      )}
      {splitting && (
        <SplitEpicPanel epic={splitting}
          onSplit={(ids) => { onSplitEpic?.(splitting.id, ids); setSplitting(null); }}
          onCancel={() => setSplitting(null)} />
      )}
      {estimatingItem && (
        <PlanningPoker item={estimatingItem} seed={state.gameSeed}
          onCommit={(pts) => { onEstimate?.(estimatingItem.id, pts); setEstimating(null); }}
          onCancel={() => setEstimating(null)} />
      )}
      </div>

      <div className="space-y-2.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing left in the Backlog. Add a PBI{mode === 'sprint' ? ' or accept a signal at the Review' : ''}.</p>}
        {zoneOrder.map((zone, zi) => {
          const zoneItems = byZone.get(zone)!;
          const collapsed = collapsedZones.has(zone);
          return (
            <div key={zone} className="space-y-1.5">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => toggleZone(zone)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                  <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', collapsed && '-rotate-90')} />
                  <span className="truncate">{zone}</span> <span className="font-normal text-muted-foreground/60">({zoneItems.length})</span>
                </button>
                {/* Move the whole theme (epic) up or down among the zones - the PO ordering by
                    value. A labelled, bordered pill so it reads as a reorder control, distinct
                    from the collapse chevron on the left. */}
                {onMoveZone && zoneOrder.length > 1 && (
                  <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 text-muted-foreground" title={`Move the ${zone} theme up or down`}>
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Move</span>
                    <button type="button" aria-label={`Move ${zone} up`} title={`Move ${zone} up`} disabled={zi === 0} onClick={() => onMoveZone(zone, 'up')} className="rounded disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Move ${zone} down`} title={`Move ${zone} down`} disabled={zi === zoneOrder.length - 1} onClick={() => onMoveZone(zone, 'down')} className="rounded disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3.5 w-3.5" /></button>
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
