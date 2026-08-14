import { useMemo, useState } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { pokerHand, estimateSuggestion, refinementTalk } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FIB = [1, 2, 3, 5, 8, 13, 21];

interface PlanningPokerProps {
  item: BacklogItem;
  /** The Scrum Team, so refinement can be the conversation it is rather than a number box. */
  state: ZooGameState;
  seed: number;
  onCommit: (points: number) => void;
  onCancel: () => void;
}

/** Estimate a Backlog item by planning poker: the Developers each reveal a card, and the
 *  forecast is the most common value (ties rounding up). The Product Owner commits a
 *  size - a shared forecast from size and complexity, not a promise. */
export function PlanningPoker({ item, state, seed, onCommit, onCancel }: PlanningPokerProps) {
  const hand = useMemo(() => pokerHand(item, seed), [item, seed]);
  const suggestion = useMemo(() => estimateSuggestion(hand), [hand]);
  const [pick, setPick] = useState(suggestion);
  const talk = useMemo(() => refinementTalk(state, item), [state, item]);

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Estimate {item.name}</h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      {/* Product Backlog refinement is a conversation. The Scrum Guide: "The Developers who will be
          doing the work are responsible for the sizing. The Product Owner may influence the
          Developers by helping them understand and select trade-offs." */}
      <div className="mb-3 space-y-1.5">
        <div className="rounded-md border border-amber-300/60 bg-amber-50/60 px-2.5 py-1.5 text-[11px] dark:border-amber-800/40 dark:bg-amber-950/20">
          <span className="font-semibold text-amber-900 dark:text-amber-200">{talk.po.name}</span>
          <span className="ml-1 text-amber-900/90 dark:text-amber-100/90">{talk.po.line}</span>
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
        <p className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-300">
          Carried over unfinished (was {item.estimate} pts). Estimate the work that is <b>left</b>, not the whole item again - the build progress is kept. Velocity only counts it once, in the Sprint it is finished.
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
              className={cn('h-8 w-9 rounded-md border font-mono text-sm', pick === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => onCommit(pick)}>Commit {pick} pts</Button>
      </div>
    </div>
  );
}
