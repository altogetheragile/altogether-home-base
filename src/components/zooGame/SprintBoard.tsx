import { useState, useEffect, useRef } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import type { ItemDesign } from './design';
import { openZoo, availableItems } from './engine';
import { DAY_SECONDS } from './config';
import { DesignStudio, type CopySource } from './DesignStudio';
import { DailyScrum } from './DailyScrum';
import { ParkView } from './ParkView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Palette, DoorOpen, Check, AlertTriangle, Clock, Plus, ChevronDown, ChevronRight, Pencil, CopyPlus } from 'lucide-react';

interface SprintBoardProps {
  state: ZooGameState;
  onBuild: (id: string, design?: ItemDesign) => void;
  onEditBuild: (id: string, design: ItemDesign) => void;
  onAddAnother: (id: string) => void;
  onPull: (id: string) => void;
  onOpen: (id: string) => void;
  onEndDay: () => void;
  onHoldDailyScrum: () => void;
  onSkipDailyScrum: () => void;
}

/** The countdown for a single timed day. Runs while the day is being worked; when it
 *  reaches zero the day ends and the Daily Scrum opens. When a day is shortened -
 *  by the Daily Scrum's timebox, or (much more) by a blocker that slipped through -
 *  it says so, so the cost of impediments is obvious. */
function DayTimer({ dayNumber, dayTimeMult, impeded, onExpire }: { dayNumber: number; dayTimeMult: number; impeded: boolean; onExpire: () => void }) {
  const total = Math.round(DAY_SECONDS * dayTimeMult);
  const [left, setLeft] = useState(total);
  const fired = useRef(false);

  // Reset for each new day (dayNumber changes) and count down once per second.
  useEffect(() => {
    fired.current = false;
    setLeft(total);
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!fired.current) { fired.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // total is derived from dayNumber+dayTimeMult; reset on a genuinely new day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber]);

  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const low = pct <= 25;
  const cut = Math.round((1 - dayTimeMult) * 100);
  return (
    <div className="w-full max-w-[240px]">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Day time</span>
        <span className={cn('tabular-nums', low && 'text-red-600 dark:text-red-400')}>{mm}:{ss}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-linear', impeded ? 'bg-red-500' : low ? 'bg-red-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      {dayTimeMult < 1 && (
        <div className={cn('mt-1 text-[10px] font-semibold', impeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`}
        </div>
      )}
    </div>
  );
}

/** The Sprint board: a run of timed days. Each day you build committed items to the
 *  Definition of Done and open (release) them whenever you like; the day ends on the
 *  timer or when you call it, opening the Daily Scrum. After the last day's Daily
 *  Scrum the Review opens. */
export function SprintBoard({ state, onBuild, onEditBuild, onAddAnother, onPull, onOpen, onEndDay, onHoldDailyScrum, onSkipDailyScrum }: SprintBoardProps) {
  const [designing, setDesigning] = useState<string | null>(null);
  // In-progress design, kept here (the board stays mounted through the Daily Scrum)
  // so an unfinished animal survives the day ending and resumes the next day.
  const [draft, setDraft] = useState<{ id: string; design: ItemDesign } | null>(null);
  const [showBacklog, setShowBacklog] = useState(false);
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'));
  const available = availableItems(state);
  const open = openZoo(state);
  const designItem = designing ? committed.find((it) => it.id === designing) : null;
  const editing = !!designItem && designItem.status !== 'committed';
  const cut = Math.round((1 - state.dayTimeMult) * 100);

  // Built animals you can copy from when designing another of the same kind.
  const copySources: CopySource[] = designItem
    ? state.backlog.filter((it) => it.id !== designItem.id && it.category === designItem.category && it.design).map((it) => ({ id: it.id, name: it.name, design: it.design! }))
    : [];

  if (state.dayStage === 'dailyScrum') {
    return <DailyScrum state={state} onHold={onHoldDailyScrum} onSkip={onSkipDailyScrum} />;
  }

  const StatusButton = ({ it }: { it: BacklogItem }) => {
    if (it.status === 'committed') return <Button size="sm" onClick={() => setDesigning(it.id)}><Palette className="mr-1.5 h-3.5 w-3.5" /> Design and build</Button>;
    return (
      <div className="flex items-center gap-1.5">
        {it.status === 'done' && <Button size="sm" variant="outline" onClick={() => onOpen(it.id)}><DoorOpen className="mr-1.5 h-3.5 w-3.5" /> Open to visitors</Button>}
        {it.status === 'open' && <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> Open</span>}
        <Button size="sm" variant="ghost" className="h-8 px-2" title="Edit" onClick={() => setDesigning(it.id)}><Pencil className="h-3.5 w-3.5" /></Button>
        {it.category === 'exhibit' && <Button size="sm" variant="ghost" className="h-8 px-2" title={`Add another ${it.name.replace(/ \d+$/, '')} PBI`} onClick={() => onAddAnother(it.id)}><CopyPlus className="h-3.5 w-3.5" /></Button>}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 pb-28">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] lg:items-start lg:gap-8">
        {/* Left: the Sprint's work */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Sprint {state.sprintNumber}</h1>
              <p className="text-xs text-muted-foreground">Day {state.dayNumber} of {state.sprintDays} &middot; {open.length} open to visitors</p>
            </div>
            <DayTimer dayNumber={state.dayNumber} dayTimeMult={state.dayTimeMult} impeded={!!state.carriedImpediment} onExpire={onEndDay} />
          </div>

          {state.carriedImpediment && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">Yesterday's blocker landed on you: {state.carriedImpediment.title}</div>
                  <div className="text-sm text-amber-800/90 dark:text-amber-200/80">{state.carriedImpediment.detail} <span className="font-semibold">Today's build time is cut by ~{cut}%</span> while you deal with it.</div>
                  {state.carriedImpediment.tip && (
                    <div className="mt-1 text-xs italic text-amber-700/80 dark:text-amber-300/70">Tip: {state.carriedImpediment.tip}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
            Build each item to the Definition of Done, then open it to visitors. You can open Done work at any
            time - you do not have to wait for the Review. Finishing fewer items well beats starting many.
          </p>

          {designItem ? (
            <DesignStudio
              item={designItem}
              editing={editing}
              copySources={copySources}
              initial={draft && draft.id === designItem.id ? draft.design : undefined}
              onChange={(d) => setDraft({ id: designItem.id, design: d })}
              onFinish={(d) => { if (editing) onEditBuild(designItem.id, d); else onBuild(designItem.id, d); setDesigning(null); setDraft(null); }}
              onCancel={() => setDesigning(null)}
            />
          ) : (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">This Sprint's work</h2>
            <div className="space-y-1.5">
              {committed.map((it) => (
                <div key={it.id} className={cn('flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2', it.status === 'open' && 'bg-emerald-50/50 dark:bg-emerald-950/20')}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{it.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{it.zone}</span>
                      <span className="font-mono text-xs text-muted-foreground">{it.estimate} pts</span>
                      {draft && draft.id === it.id && it.status === 'committed' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">in progress</span>}
                    </div>
                    {it.status === 'committed' && <div className="text-[11px] text-muted-foreground">Not built yet - meet: {it.acceptance.join(', ')}</div>}
                  </div>
                  <StatusButton it={it} />
                </div>
              ))}
            </div>
          </section>
          )}

          {/* The Product Backlog stays visible: you can pull more in mid-Sprint. */}
          {!designItem && (
            <section className="space-y-2">
              <button type="button" onClick={() => setShowBacklog((s) => !s)} className="flex items-center gap-1.5 text-sm font-semibold">
                {showBacklog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Product Backlog <span className="font-normal text-muted-foreground">({available.length})</span>
              </button>
              {showBacklog && (
                <div className="space-y-1.5">
                  {available.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing left in the Backlog. Accept a signal at the Review to add more.</p>}
                  {available.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{it.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{it.zone}</span>
                          <span className="font-mono text-xs text-muted-foreground">{it.estimate} pts</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => onPull(it.id)}><Plus className="mr-1 h-3.5 w-3.5" /> Add to Sprint</Button>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">Pulling in more work mid-Sprint is fine by agreement, as long as it will not put the Sprint's goal at risk.</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right: the live park, growing as you open items. Sticky so it stays in view. */}
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
          <h2 className="mb-2 text-sm font-semibold">Your zoo</h2>
          <ParkView state={state} fill />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur">
        <span className="text-xs font-medium text-muted-foreground">Definition of Done: {state.definitionOfDone.length} criteria</span>
        <Button size="sm" onClick={onEndDay}>
          {state.dayNumber === state.sprintDays ? 'End last day' : `End Day ${state.dayNumber}`} &rarr; Daily Scrum
        </Button>
      </div>
    </div>
  );
}
