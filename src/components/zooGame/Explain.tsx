import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TeachingCard, ExplainCard } from './ScrumTeaching';
import { EventContractStrip } from './EventContract';
import { FOCUS } from './ui/tokens';

/** The one place words live on a screen.
 *
 *  The game's screens each ask one question and show one thing to act on. Everything that explains,
 *  qualifies or teaches sits behind this button beside the question: what the Guide says, what the
 *  event inspects and adapts, and the teaching card the first time through. The button pulses while
 *  there is something new in it, and is quiet afterwards - available in a breath, never in the way.
 */
export function ExplainButton({ cards, phase, teachCard, onMarkTaught, compact }: {
  /** The teaching, by card id. Every screen's "?" reads from the Teaching Cards rather than holding
   *  its own prose: the screens had drifted into saying the same things in slightly different words,
   *  and only one of those copies was editable. One concept, one wording, one place to change it. */
  cards: string[];
  /** The game phase, so the panel can say what this event inspects and adapts. */
  phase?: string;
  /** The teaching card for this phase, if the learner has not read it yet. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
  /** Icon only. For a narrow rail, where the label is the widest thing on the row and pushes
   *  everything else onto a second line. A viewport breakpoint is the wrong ruler for that - the
   *  rail is 460px however wide the window is - so the screen says so. */
  compact?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* Unread teaching used to pulse a bare icon, which nobody noticed. It now says what it is
            and how many cards are waiting - a button you can read beats an animation you cannot. */}
        <button type="button" title={teachCard ? 'New teaching about this screen' : 'What is this for?'} aria-label="What is this for?"
          className={cn(FOCUS, 'flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 text-xs font-semibold transition-colors',
            compact ? 'px-1.5' : 'px-2.5',
            teachCard ? 'animate-pulse border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!compact && (teachCard ? 'What is this?' : <span className="hidden sm:inline">What is this?</span>)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-96 overflow-y-auto">
        <div className="space-y-2.5">
          {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
          {cards.filter((id) => id !== teachCard).map((id) => <ExplainCard key={id} id={id} />)}
          {phase && <EventContractStrip phase={phase} />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
