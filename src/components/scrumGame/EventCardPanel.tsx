import type { EventCard } from './theme';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface EventCardPanelProps {
  card: EventCard;
  onChoose: (index: number) => void;
  disabled?: boolean;
}

/** A mid-Sprint dilemma. Two or three choices, no right answer - each has a
 *  consequence and a lesson. The team decides together. */
export function EventCardPanel({ card, onChoose, disabled }: EventCardPanelProps) {
  return (
    <div className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">Event · {card.name}</div>
          <p className="text-sm font-medium">{card.narrative}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {card.choices.map((c, i) => (
              <Button key={i} size="sm" variant={i === 0 ? 'default' : 'outline'} disabled={disabled} onClick={() => onChoose(i)}>
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
