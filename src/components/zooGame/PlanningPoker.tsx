import { useMemo, useState } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { pokerHand, estimateSuggestion, refinementTalk } from './engine';
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
}

/** Estimate a Backlog item by planning poker: the Developers each reveal a card, and the
 *  forecast is the most common value (ties rounding up). The Product Owner commits a
 *  size - a shared forecast from size and complexity, not a promise. */
export function PlanningPoker({ item, state, seed, onCommit }: PlanningPokerProps) {
  const hand = useMemo(() => pokerHand(item, seed), [item, seed]);
  const suggestion = useMemo(() => estimateSuggestion(hand), [hand]);
  const [pick, setPick] = useState(suggestion);
  const talk = useMemo(() => refinementTalk(state, item), [state, item]);

  return (
    <div className="space-y-2">
      {/* Product Backlog refinement is a conversation. The Scrum Guide: "The Developers who will be
          doing the work are responsible for the sizing. The Product Owner may influence the
          Developers by helping them understand and select trade-offs." */}
      <div className="mb-3 space-y-1.5">
        <div className="rounded-md border border-amber-300/60 bg-amber-50/60 px-2.5 py-1.5 text-[11px] dark:border-amber-800/40 dark:bg-amber-950/20">
          <span className={cn(TONE.attention.text, "font-semibold")}>{talk.po.name}</span>
          <span className={cn(TONE.attention.text, "ml-1")}>{talk.po.line}</span>
        </div>
        {talk.devs.map((d, i) => (
          <div key={i} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px]">
            <span className="font-semibold">{d.name}</span>
            <span className="ml-1 text-muted-foreground">{d.line}</span>
          </div>
        ))}
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        The Developers size it, because they will do the work; the Product Owner helps them understand the
        trade-offs. Each shows a card and the size is the most common value, ties rounding up. Size and
        complexity, not time - and a forecast, not a promise. (Planning poker is a common practice, not part of Scrum.)
      </p>

      {item.carriedOver && (
        <p className={cn(TONE.attention.text, "mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px]")}>
          Carried over unfinished, and already cut to the <b>{item.estimate} pts left</b> of it - the Developers size the work remaining every day, which is what the burndown is drawn from, so nobody has to size it twice. Change it if you disagree. The build progress is kept, and velocity counts it once, in the Sprint it is finished.
        </p>
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
