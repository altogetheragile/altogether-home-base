import type { ZooGameState, BacklogItem } from './types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './Board';
import { answerable, checkCriterion } from './parkChecks';
import { isSignOffTask, readyToOpen, enclosureReady, enclosureOf, activeWipLimit } from './engine';
import { EYEBROW, FOCUS } from './ui/tokens';
import { Check, Users, Fence, MoveHorizontal, Home, PawPrint, Footprints, Droplets, Trees, Circle, Undo2 } from 'lucide-react';

// One item, in the one place its detail lives.
//
// The board used to carry all of it on the cards: the plan, the criteria, the buttons, the reasons.
// Four cards of that is a wall, and a wall is not a board - you cannot see the work move through it.
// So a card carries four things and this dialog carries the rest, opened when you ask for it.
//
// Two columns, and they are never merged. Steps are the Developers' plan: how this gets built.
// "What this needs to be" is the item's acceptance criteria: whether it is the right thing at all.
// The Definition of Done is neither - it is the product's bar, the same for every item, and it lives
// in Learn where it applies to all of them rather than pretending to belong to this one.

/** A glyph per criterion, so a list of questions reads as a checklist of things rather than prose.
 *  Matched on what the criterion asks about; anything unrecognised keeps a plain bullet. */
const GLYPHS: { rx: RegExp; icon: typeof Fence }[] = [
  { rx: /fence|no way out|escape/i, icon: Fence },
  { rx: /room|space|move about/i, icon: MoveHorizontal },
  { rx: /lives here|shed|shelter|home/i, icon: Home },
  { rx: /animal|group|them\b/i, icon: PawPrint },
  { rx: /walk|path|round it|get to/i, icon: Footprints },
  { rx: /water|drink|pool/i, icon: Droplets },
  { rx: /plant|foliage|tree/i, icon: Trees },
];
const glyphFor = (label: string) => GLYPHS.find((g) => g.rx.test(label))?.icon ?? Circle;

/** Why this cannot be taken into Doing yet, or null when it can. */
function whyNotStart(state: ZooGameState, item: BacklogItem): string | null {
  if (!enclosureReady(state, item)) {
    return `${enclosureOf(state, item)?.name ?? 'Its habitat'} has to be built first - an animal goes in once its habitat is ready.`;
  }
  const limit = activeWipLimit(state);
  const doing = state.backlog.filter((it) => it.status === 'committed' && it.started
    && it.sprintNumber === state.sprintNumber).length;
  if (limit && doing >= limit) {
    return `Work in progress is limited to ${limit}. Finish something before starting this.`;
  }
  return null;
}

export function CardDialog({ state, item, onClose, onStart, onBuilding, onOpen, onAskToCheck, onHandBack, onToggleTask }: {
  state: ZooGameState;
  item: BacklogItem | null;
  onClose: () => void;
  /** Take it into Doing. The Developers pull; nothing here assigns it to anybody. */
  onStart?: (id: string) => void;
  /** Put it in your hands, which opens the park on it. */
  onBuilding?: (id: string) => void;
  /** Release Done work to visitors. */
  onOpen?: (id: string) => void;
  /** Ask the Product Owner to look at work that is built. Reported from playing it: "I still cannot
   *  complete the enclosure - how does Priya approve the last AC?" The only route was a pill on the
   *  park, which is not where anybody looks when they are reading the card. */
  onAskToCheck?: (id: string) => void;
  /** Handing work back to the Product Backlog. The board does it by carrying the card onto the
   *  hand-back strip, which is a pointer gesture and the only way there was: a keyboard could start
   *  work and finish it and never give it back. */
  onHandBack?: (id: string) => void;
  /** Tick a step of the plan. The plan ticks itself off as the work is done, but it is the
   *  Developers' own plan and they can say a step is finished - a plan nobody can finish is a plan
   *  that can hold finished work out of Done for ever. */
  onToggleTask?: (id: string, taskId: string) => void;
}) {
  if (!item) return null;
  const steps = (item.tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label));
  const criteria = item.acceptance.filter(Boolean);
  const po = state.team.productOwner.name.replace(/\s*\(PO\)$/i, '');
  const devs = state.team.developers.filter((d) => (item.assignedDevs ?? []).includes(d.id));
  // The park only speaks about a thing that has been built. Before that its verdicts are about the
  // preset the item would start from, and a criterion ticked green on work nobody has begun is a
  // lie the whole game rests on not telling.
  // ...and green means the park said YES. It used to mean the park had an OPINION - `isChecked` is
  // "does the park answer this one", not "is it met" - so a habitat with no water wore a tick for a
  // criterion it was failing.
  const met = (label: string, i: number) =>
    !!item.acConfirmed?.[i] || (!!item.design && !!checkCriterion(state, item, label)?.met);

  const todo = item.status === 'committed' && !item.started;
  // ...and why it cannot start, where it cannot: an animal waits for its habitat, and the WIP limit
  // is the Developers' own agreement. A button that is refused when pressed teaches nothing.
  const blocked = todo ? whyNotStart(state, item) : null;
  const doing = item.status === 'committed' && item.started;
  const canOpen = item.status === 'done' && readyToOpen(item);
  // Built, with every fact the park checks answered, and nothing left but somebody's judgement.
  const asked = (state.questions ?? []).some((q) => q.id === `check-${item.id}`);
  // ...and only where the Definition of Done asks for the Product Owner's word. Take that line out
  // of the agreement and there is nothing to ask for: the facts the park checks are the whole of
  // Done. The button is the agreement, not a fixture.
  const wantsSignOff = (item.tasks ?? []).some((t) => isSignOffTask(t.label));
  // ...and not once she has already accepted it. Asking a question that has been answered is what
  // "I get multiple ask Priya to check" was: the same offer in the dialog, on the card and on the
  // park, none of them noticing the sign-off had come in.
  const signedOff = (item.tasks ?? []).some((t) => isSignOffTask(t.label) && t.done);
  const canAsk = doing && wantsSignOff && !signedOff && !!item.design && criteria.length > 0
    && criteria.every((c, i) => !answerable(c) || met(c, i));

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent data-part="card-dialog" className="max-w-[min(96vw,1000px)] p-0">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <CategoryIcon item={item} className="h-6 w-6 shrink-0 text-muted-foreground" />
            <h2 className="min-w-0 flex-1 truncate text-2xl font-bold leading-tight">{item.name}</h2>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-sm font-bold tabular-nums">{item.estimate} pts</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {devs.length ? devs.map((d) => d.name).join(' · ') : 'nobody yet'}
          </p>
        </div>

        <div className="grid gap-6 px-5 py-4 sm:grid-cols-2">
          <section>
            <h3 className="flex items-baseline gap-2 text-base font-bold">
              Steps <span className={cn(EYEBROW, 'font-normal text-muted-foreground')}>the Developers&rsquo; plan</span>
            </h3>
            <ol className="mt-2 space-y-2">
              {steps.map((t, i) => {
                const tick = doing && onToggleTask ? () => onToggleTask(item.id, t.id) : undefined;
                const body = (
                  <>
                    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                      t.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                      {t.done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className={cn(t.done && 'text-muted-foreground line-through decoration-emerald-500/40')}>{t.label}</span>
                  </>
                );
                return (
                  <li key={t.id} className="text-sm">
                    {tick
                      ? <button type="button" onClick={tick} title={t.done ? 'Not finished after all' : 'Mark this step finished'}
                          className={cn(FOCUS, 'flex w-full items-start gap-2 rounded-md p-0.5 text-left hover:bg-muted/60')}>{body}</button>
                      : <span className="flex items-start gap-2">{body}</span>}
                  </li>
                );
              })}
              {!steps.length && <li className="text-sm text-muted-foreground">No plan yet. The Developers write one at Planning, or as they go.</li>}
            </ol>
          </section>

          <section className="sm:border-l sm:border-border sm:pl-6">
            <h3 className="flex items-baseline gap-2 text-base font-bold">
              What this needs to be <span className={cn(EYEBROW, 'font-normal text-muted-foreground')}>the park checks what it can</span>
            </h3>
            <ul className="mt-2 space-y-2">
              {criteria.map((c, i) => {
                const Glyph = glyphFor(c);
                const ok = met(c, i);
                // A criterion the park cannot answer says so. Without that, a line that never went
                // green looked like work still to do, and the item looked stuck when it was
                // finished and waiting for somebody to look at it.
                const theirs = !ok && !answerable(c);
                const verdict = ok ? null : checkCriterion(state, item, c);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Glyph className={cn('mt-0.5 h-4 w-4 shrink-0', ok ? 'text-emerald-600' : 'text-muted-foreground')} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block', ok && 'text-muted-foreground line-through decoration-emerald-500/40')}>{c}</span>
                      {/* What the park saw. Without it an unmet criterion is a closed door: "can I
                          get to this zone without crossing the grass?" with nothing to say a path
                          has to be drawn, and no way to tell that from a criterion that is stuck. */}
                      {!ok && verdict?.evidence && (
                        <span className="block text-[11px] text-muted-foreground">{verdict.evidence}</span>
                      )}
                    </span>
                    {ok && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                    {theirs && <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{po} judges this</span>}
                  </li>
                );
              })}
              {!criteria.length && <li className="text-sm text-muted-foreground">Nothing written yet. Criteria are the Product Owner&rsquo;s, refined with the Developers.</li>}
            </ul>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          {todo && onStart && (
            <span className="flex items-center gap-2.5">
              <Button disabled={!!blocked} title={blocked ?? undefined}
                onClick={() => { onStart(item.id); onBuilding?.(item.id); onClose(); }}>Start it &rarr;</Button>
              {blocked && <span className="text-xs text-muted-foreground">{blocked}</span>}
            </span>
          )}
          {doing && onBuilding && (
            <span className="flex flex-wrap items-center gap-2.5">
              <Button variant={canAsk ? 'outline' : 'default'} onClick={() => { onBuilding(item.id); onClose(); }}>Pick it up &rarr;</Button>
              {canAsk && onAskToCheck && (asked
                ? <span className="text-xs text-muted-foreground">Waiting on {po} to look at it.</span>
                : <Button data-part="ask-to-check" onClick={() => { onAskToCheck(item.id); onClose(); }}>
                    Ask {po} to check it
                  </Button>)}
            </span>
          )}
          {canOpen && onOpen && (
            <Button onClick={() => { onOpen(item.id); onClose(); }}>Open it to visitors</Button>
          )}
          {/* The same move as carrying the card onto the hand-back strip, for anybody not using a
              pointer. The Product Owner is told either way, and the points come back out of the
              forecast either way - it is the gesture that differs, not the decision. */}
          {(todo || doing) && onHandBack && (
            <Button size="sm" variant="ghost" data-part="hand-back"
              className={cn(FOCUS, 'h-7 px-2 text-xs text-muted-foreground hover:text-foreground')}
              onClick={() => { onHandBack(item.id); onClose(); }}>
              <Undo2 className="mr-1 h-3.5 w-3.5" /> Hand it back to the Product Backlog
            </Button>
          )}
          {!todo && !doing && !canOpen && <span className="text-xs text-muted-foreground">Nothing to do here yet.</span>}
          {/* One line about the Definition of Done, and no more: it is the product's bar, the same
              for every item, so it is not part of this one. It is read in Learn, where it applies
              to all of them. */}
          <span className="text-xs text-muted-foreground">
            The Definition of Done is the same for every item &middot; read it in Learn
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
