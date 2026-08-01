import { useMemo, useState } from 'react';
import type { BacklogItem } from './types';
import { pokerHand, estimateSuggestion } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FIB = [1, 2, 3, 5, 8, 13, 21];

interface PlanningPokerProps {
  item: BacklogItem;
  seed: number;
  onCommit: (points: number) => void;
  onCancel: () => void;
}

/** Estimate a Backlog item by planning poker: the team each reveal a card, and the
 *  forecast is the most common value (ties rounding up). The Product Owner commits a
 *  size - a shared forecast from size and complexity, not a promise. */
export function PlanningPoker({ item, seed, onCommit, onCancel }: PlanningPokerProps) {
  const hand = useMemo(() => pokerHand(item, seed), [item, seed]);
  const suggestion = useMemo(() => estimateSuggestion(hand), [hand]);
  const [pick, setPick] = useState(suggestion);

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Estimate {item.name}</h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">The team each show a card. The forecast is the most common value, ties rounding up. Estimate the size and complexity - it is a shared forecast, not a promise.</p>

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
