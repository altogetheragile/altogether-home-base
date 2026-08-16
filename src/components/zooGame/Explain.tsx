import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TeachingCard } from './ScrumTeaching';
import { EventContractStrip } from './EventContract';

/** The one place words live on a screen.
 *
 *  The game's screens each ask one question and show one thing to act on. Everything that explains,
 *  qualifies or teaches sits behind this button beside the question: what the Guide says, what the
 *  event inspects and adapts, and the teaching card the first time through. The button pulses while
 *  there is something new in it, and is quiet afterwards - available in a breath, never in the way.
 */
export function ExplainButton({ title, body, phase, teachCard, onMarkTaught }: {
  /** What this screen is about, as a heading inside the panel. */
  title: string;
  /** A paragraph each - what the Scrum Guide says, in the game's words. */
  body: string[];
  /** The game phase, so the panel can say what this event inspects and adapts. */
  phase?: string;
  /** The teaching card for this phase, if the learner has not read it yet. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="What is this for?" aria-label="What is this for?"
          className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
            teachCard ? 'animate-pulse border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-96 overflow-y-auto">
        <div className="space-y-2.5">
          {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
          <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            {body.map((p) => <p key={p} className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{p}</p>)}
          </div>
          {phase && <EventContractStrip phase={phase} />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
