import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';
import type { ZooGameState } from './types';
import { valueMeasures, decisionsIn, whoIs, betLine } from './engine';
import { ScrumReferenceBody } from './ScrumTeaching';
import { ArtifactsBody } from './ArtifactsPanel';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import type { GameNote } from './notesDock';

// Everything the game can explain, behind one button.
//
// The screen keeps the work; the drawer keeps the words. Anything the learner acts on stays on the
// screen at a weight that matches how often they act on it - the clock is acted on every minute, so
// it is the biggest thing there. A definition of Time to Market is read once, so it is a card in
// here.
//
// What moved in: the Scrum reference drawer, the four value measures with an explanation each, the
// Artifacts drawer, and the notes the game has already said this Sprint. What went from the strip:
// four dials with no values, two drawer buttons, a help icon and a wordmark.

type Section = 'scrum' | 'value' | 'sprint' | 'notes';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'scrum', label: 'Scrum' },
  { key: 'value', label: 'Value' },
  { key: 'sprint', label: 'This Sprint' },
  { key: 'notes', label: 'Notes' },
];

/** One value measure, explained: what it is, how this zoo works it out, and what moves it.
 *  The number is here during the Sprint and on the screen at the Review, where it has a job. */
function MeasureCard({ m }: { m: ReturnType<typeof valueMeasures>[number] }) {
  return (
    <section className="rounded-lg border border-border bg-card px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-bold text-primary">{m.label}</h4>
        <span className="shrink-0 text-xl font-bold tabular-nums">{m.value === null ? '—' : `${m.value}${m.unit}`}</span>
      </div>
      <p className="text-xs">{m.what}</p>
      <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold">How:</span> {m.how}</p>
      <p className="text-[11px] text-muted-foreground"><span className="font-semibold">Moves:</span> {m.moves}</p>
      {m.value === null && <p className="mt-1 text-[11px] italic text-muted-foreground/80">{m.detail}</p>}
    </section>
  );
}

/** The one button in the strip, and everything behind it. */
export function LearnDrawer({ state, notes, teaching, onSetTeaching, onSetProductGoal, onSetDod, onSetDor }: {
  state: ZooGameState;
  /** What the game has said this Sprint - kept, because a note you dismissed is not a note you
   *  never needed. */
  notes?: GameNote[];
  teaching: boolean;
  onSetTeaching?: (on: boolean) => void;
  onSetProductGoal?: (g: string) => void;
  onSetDod?: (dod: string[]) => void;
  onSetDor?: (dor: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<Section>('scrum');
  const decisions = decisionsIn(state, state.sprintNumber);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-part="learn"
        title="Everything the game can explain: Scrum, the value measures, this Sprint, and what has been said"
        className={cn(FOCUS, 'flex shrink-0 items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20')}>
        <BookOpen className="h-3.5 w-3.5" /> Learn
      </button>

      {/* Portalled to the body, deliberately. The button stands on the dark strip, and the strip
          paints everything under it white-on-teal: rendered where it is triggered, the drawer came
          out as white words on a white card. It is also a full-height overlay, which has no business
          living inside a header. */}
      {open && typeof document !== 'undefined' && createPortal((
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setOpen(false)}>
          <aside role="dialog" aria-label="Learn" onClick={(e) => e.stopPropagation()}
            className="zoo-theme flex h-full w-[min(30rem,94vw)] flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-2xl">
            <header className="shrink-0 space-y-2 border-b border-border px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold leading-tight">Learn</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Everything the game can explain, in one place. The screen keeps the work; this keeps the words.
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close Learn"
                  className={cn(FOCUS, 'shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SECTIONS.map((s) => (
                  <button key={s.key} type="button" onClick={() => setAt(s.key)}
                    className={cn(FOCUS, 'rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                      at === s.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
              {at === 'scrum' && <ScrumReferenceBody teaching={teaching} onSetTeaching={onSetTeaching} />}

              {at === 'value' && (
                <div className="space-y-2">
                  <div className={cn(EYEBROW, 'text-primary')}>Key value measures · Evidence-Based Management</div>
                  <p className="text-[11px] text-muted-foreground">
                    Four numbers the Review reads. None of them is a score. Together they say whether the product is
                    worth more today than it was, and whether you could still make it worth more tomorrow.
                  </p>
                  {valueMeasures(state).map((m) => <MeasureCard key={m.key} m={m} />)}
                  <p className="text-[11px] text-muted-foreground">
                    They are here during the Sprint, where they are reference, and on the screen at the Review, where
                    they have numbers and a job.
                  </p>
                </div>
              )}

              {at === 'sprint' && (
                <div className="space-y-2.5">
                  <section className="rounded-lg border border-primary/30 bg-primary/[0.04] px-2.5 py-2">
                    <div className={cn(EYEBROW, 'text-primary')}>Sprint Goal · Sprint {state.sprintNumber}</div>
                    <p className="text-sm font-semibold leading-snug">
                      {state.sprintGoal.trim() || 'No Sprint Goal yet - the Scrum Team agrees one at Sprint Planning.'}
                    </p>
                    {state.sprintBet && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold">The bet:</span> {betLine(state.sprintBet)}
                      </p>
                    )}
                  </section>
                  <ArtifactsBody state={state} onSetProductGoal={onSetProductGoal} onSetDod={onSetDod} onSetDor={onSetDor} />
                  <section>
                    <div className={cn(EYEBROW, 'text-muted-foreground')}>Decision log · this Sprint</div>
                    {decisions.length ? (
                      <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
                        {decisions.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 px-2 py-1.5 text-xs">
                            <span className="mt-[1px] shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                              {whoIs(d.by).replace(/^The /, '')}
                            </span>
                            <span className="min-w-0">
                              <span>{d.what.replace(/^(The Developers|The Product Owner|The Scrum Master|You) /, '')}</span>
                              {d.cost && <span className="block text-[11px] text-amber-700 dark:text-amber-300">{d.cost}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Nothing decided yet this Sprint.</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">The Retrospective reads this back.</p>
                  </section>
                </div>
              )}

              {at === 'notes' && (
                <div className="space-y-2">
                  <div className={cn(EYEBROW, 'text-muted-foreground')}>What has been said</div>
                  {notes?.length ? notes.map((n) => (
                    <section key={n.id} className={cn('rounded-lg border px-2.5 py-2 text-xs',
                      n.tone === 'rule' ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30' : 'border-border bg-card')}>
                      <div className={cn(EYEBROW, 'text-muted-foreground')}>{n.title}</div>
                      <div className="mt-0.5 leading-snug">{n.body}</div>
                    </section>
                  )) : (
                    <p className="text-xs text-muted-foreground">
                      Nothing said yet. Anything the game tells you appears in the corner and is kept here for the
                      rest of the Sprint, so a note you dismissed is not a note you lost.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      ), document.body)}
    </>
  );
}
