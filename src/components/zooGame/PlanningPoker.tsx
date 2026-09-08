import { useMemo, useState } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { pokerHand, handSpread, estimateSuggestion, refinementTalk } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FOCUS, TONE } from './ui/tokens';

const FIB = [1, 2, 3, 5, 8, 13, 21];

interface PlanningPokerProps {
  item: BacklogItem;
  /** The Scrum Team, so refinement can be the conversation it is rather than a number box. */
  state: ZooGameState;
  seed: number;
  onCommit: (points: number) => void;
  /** Whether to carry the refinement conversation. Off where the screen already shows it: the same
   *  three lines twice, one above the other, is the panel arguing with itself. */
  talk?: boolean;
}

/** Estimate a Backlog item by planning poker: the Developers each reveal a card, and the
 *  forecast is the most common value (ties rounding up). The Product Owner commits a
 *  size - a shared forecast from size and complexity, not a promise. */
export function PlanningPoker({ item, state, seed, onCommit, talk: withTalk = true }: PlanningPokerProps) {
  const hand = useMemo(() => pokerHand(item, seed, state.dodAgreed), [item, seed, state.dodAgreed]);
  const suggestion = useMemo(() => estimateSuggestion(hand), [hand]);
  const [pick, setPick] = useState(suggestion);
  const talk = useMemo(() => refinementTalk(state, item), [state, item]);
  const spread = useMemo(() => handSpread(hand), [hand]);

  return (
    <div className="space-y-2">
      {/* Product Backlog refinement is a conversation. The Scrum Guide: "The Developers who will be
          doing the work are responsible for the sizing. The Product Owner may influence the
          Developers by helping them understand and select trade-offs." */}
      {withTalk && (
        <div className="mb-3 space-y-1.5">
          <div className="rounded-md border border-amber-300/60 bg-amber-50/60 px-2.5 py-1.5 text-[11px] dark:border-amber-800/40 dark:bg-amber-950/20">
            <span className={cn(TONE.attention.text, 'font-semibold')}>{talk.po.name.replace(/\s*\(PO\)$/i, '')}</span>
            <span className={cn(TONE.attention.text, 'ml-1')}>{talk.po.line}</span>
          </div>
          {talk.devs.map((d, i) => (
            <div key={i} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px]">
              <span className="font-semibold">{d.name}</span>
              <span className="ml-1 text-muted-foreground">{d.line}</span>
            </div>
          ))}
        </div>
      )}
      {/* One line. The rest of it - why poker, why it is a forecast - is in Learn, where somebody
          who wants it can read it without it sitting between them and the cards every time. */}
      <p className="mb-2 text-[11px] text-muted-foreground">
        The Developers size it; the Product Owner helps with the trade-offs. Size and complexity, not time.
      </p>

      {item.carriedOver && (
        <p className={cn(TONE.attention.text, "mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px]")}>
          Carried over unfinished, and already cut to the <b>{item.estimate} pts left</b> of it - the Developers size the work remaining every day, which is what the burndown is drawn from, so nobody has to size it twice. Change it if you disagree. The build progress is kept, and velocity counts it once, in the Sprint it is finished.
        </p>
      )}

      {/* Four people costing four different pieces of work. Without an agreed Definition of Done
          nobody knows what finished means, so one of them is sizing a fence and another is sizing a
          fence that has been reviewed, placed and released. The spread is the evidence. */}
      {!state.dodAgreed && spread >= 3 && (
        <div data-part="no-dod-spread" className={cn(TONE.attention.text, 'mb-3 rounded-md border border-amber-400/60 bg-amber-500/10 px-2.5 py-2 text-[11px]')}>
          <span className="font-semibold">The cards are {Math.round(spread)}&times; apart.</span>{' '}
          Nobody has agreed a Definition of Done, so &ldquo;finished&rdquo; means something different to each of them -
          one is costing the build, another the build reviewed, placed and open. Agree one and the same item settles.
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        {hand.map((c, i) => (
          <span key={i} className="flex h-12 w-9 items-center justify-center rounded-md border border-border bg-card font-mono text-lg font-bold shadow-sm">{c}</span>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">team suggests <span className="font-semibold text-foreground">{suggestion}</span></span>
      </div>

      <div className="mb-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Commit an estimate</div>
        <div className="flex flex-wrap gap-1.5">
          {FIB.map((f) => (
            <button key={f} type="button" onClick={() => setPick(f)}
              className={cn(FOCUS, 'h-8 w-9 rounded-md border font-mono text-sm', pick === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => onCommit(pick)}>Commit {pick} pts</Button>
      </div>
    </div>
  );
}
