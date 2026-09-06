import type { ZooGameState, PbiDraft } from './types';
import type { Ask } from './engine';
import { asksNow, decisionsIn, whoIs, PLACEMENT_CHOICES } from './engine';
import { lookAhead } from './lookAhead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { MessageCircleQuestion, CheckCircle2, Rocket, Eye, AlertTriangle, ListChecks, Hammer, ArrowRight, Users, Megaphone, Lightbulb } from 'lucide-react';
import type { SeatName } from './useZooSessions';
import type { GameNote } from './notesDock';

// What is being asked of you, on the screen where the work is.
//
// "How do I know what to do as a PO? e.g. to tick off ACs?" - and the honest answer was that you
// did not. The game knew: the Developers had built something and were waiting on its criteria, a
// question about where a habitat goes had been put and not answered, work had met the Definition
// of Done and nobody had released it. It said none of it where the work was.
//
// So each line is one thing being asked, of one accountability, by somebody where the game knows a
// name - and it carries the doing of it. Not a feed of what happened: a list of what is yours.

const OF: Record<Ask['of'], { label: string; cls: string }> = {
  product_owner: { label: 'PO', cls: 'bg-primary text-primary-foreground' },
  scrum_master: { label: 'SM', cls: 'bg-violet-600 text-white' },
  developer: { label: 'Dev', cls: 'bg-sky-700 text-white' },
};

/** What kind of thing is being asked. The icon is the type of communication, not its urgency. */
const KIND: Record<Ask['kind'], { icon: typeof MessageCircleQuestion; what: string }> = {
  question: { icon: MessageCircleQuestion, what: 'a question' },
  accept: { icon: CheckCircle2, what: 'to accept' },
  release: { icon: Rocket, what: 'to release' },
  review: { icon: Eye, what: 'to review' },
  blocker: { icon: AlertTriangle, what: 'in the way' },
  ready: { icon: ListChecks, what: 'the Backlog' },
  start: { icon: Hammer, what: 'to start' },
};

export function Asks({ state, seat = null, notes = [], onOpenItem, onAnswerPlacement, onOpen, onAddProposal, onSplitEpic, onDeclineProposal, className }: {
  state: ZooGameState;
  /** Which accountability is looking. Theirs comes first; a solo player holds all three, so nothing
   *  is hidden - the badge is what says whose it is. */
  seat?: SeatName | null;
  /** ...and what has been said, under what is being asked. The dock flashes it; this keeps it. */
  notes?: GameNote[];
  /** Put an item on the bench, which is where its criteria are ticked. */
  onOpenItem?: (id: string) => void;
  onAnswerPlacement?: (id: string, choice: string) => void;
  /** Release Done work to visitors. */
  onOpen?: (id: string) => void;
  /** The Product Owner's look-ahead: take what the forecast implies into the Backlog, split what is
   *  hiding inside an epic, or turn it down. It was a card of its own on the board; it is an ask
   *  with two answers, so it belongs with the other asks. */
  onAddProposal?: (draft: PbiDraft) => void;
  onSplitEpic?: (id: string, memberIds: string[]) => void;
  onDeclineProposal?: (id: string) => void;
  className?: string;
}) {
  const asks = asksNow(state);
  // What the Product Owner is looking at next, where they will see it.
  const ahead = onDeclineProposal ? lookAhead(state) : [];
  // The last few things that actually happened, newest last as they were recorded. The log is the
  // Retrospective's record; this is its tail, so a learner meets it while it is still news.
  const said = decisionsIn(state, state.sprintNumber).slice(-4);
  // Yours first. In a solo game you hold all three, so this only decides the order.
  const mine = seat ? asks.filter((a) => a.of === seat) : asks;
  const theirs = seat ? asks.filter((a) => a.of !== seat) : [];

  const line = (a: Ask) => {
    const k = KIND[a.kind];
    const Icon = k.icon;
    const item = a.itemId ? state.backlog.find((it) => it.id === a.itemId) : undefined;
    return (
      <li key={a.id} className="rounded-lg border border-border bg-card px-2.5 py-2">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', OF[a.of].cls)}>{OF[a.of].label}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.what}</span>
              {a.from && <span className="text-[11px] text-muted-foreground">from {a.from}</span>}
            </div>
            <p className="mt-0.5 text-xs leading-snug">{a.text}</p>

            {/* ...and the doing of it, where the game can offer it here. A list of things being
                asked, with no way to answer any of them, is a nag. */}
            {a.kind === 'question' && item && onAnswerPlacement && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {PLACEMENT_CHOICES.map((c) => (
                  <button key={c.key} type="button" onClick={() => onAnswerPlacement(item.id, c.key)}
                    className={cn(FOCUS, 'rounded-md border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted/60')}>{c.label}</button>
                ))}
                <button type="button" onClick={() => onAnswerPlacement(item.id, 'them')}
                  className={cn(FOCUS, 'rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground')}>You choose</button>
              </div>
            )}
            {(a.kind === 'accept' || a.kind === 'review') && item && onOpenItem && (
              <Button size="sm" variant="outline" className="mt-1.5 h-7 px-2 text-xs" onClick={() => onOpenItem(item.id)}>
                {a.kind === 'accept' ? 'Check it against its criteria' : 'Open it'}
              </Button>
            )}
            {a.kind === 'release' && item && onOpen && (
              <Button size="sm" className="mt-1.5 h-7 px-2 text-xs" onClick={() => onOpen(item.id)}>Open it to visitors</Button>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <section data-part="asks" className={cn('rounded-lg border-2 border-border bg-background p-2.5', className)}>
      <h3 className="text-sm font-bold">Actions &amp; Messages</h3>
      <p className="mb-2 text-[11px] text-muted-foreground">
        What is being asked, and of whom. {seat ? 'Yours first.' : 'You hold all three, so all of it is yours.'}
      </p>

      {asks.length === 0 && notes.length === 0 && ahead.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing is waiting on anybody. Build something.</p>
      )}

      {asks.length > 0 && <ul className="space-y-1.5">{mine.map(line)}{theirs.map(line)}</ul>}

      {/* The Product Owner has been looking ahead. Two answers, and turning one down is a decision
          too - it will not be put again. */}
      {ahead.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          {ahead.slice(0, 1).map((p) => (
            <li key={p.id} className="rounded-lg border border-violet-400/50 bg-violet-500/[0.06] px-2.5 py-2">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', OF.product_owner.cls)}>PO</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">looking ahead</span>
                    {ahead.length > 1 && <span className="text-[11px] text-muted-foreground">{ahead.length - 1} more after this</span>}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug">{p.why}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Button size="sm" className="h-7 px-2 text-xs"
                      onClick={() => (p.kind === 'add' ? onAddProposal?.(p.draft) : onSplitEpic?.(p.epicId, p.memberIds))}>
                      {p.label}
                    </Button>
                    <button type="button" onClick={() => onDeclineProposal?.(p.id)}
                      className={cn(FOCUS, 'text-[11px] text-muted-foreground underline hover:text-foreground')}>
                      Not this one
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Turning it down is a decision too - it will not be put again.</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ...and what just happened. Half of what a panel like this is for is announcements - a task
          finished, work taken up, an event held - and the game already writes all of it down for the
          Retrospective. This is the tail of that same log, so the two are never out of step. */}
      {(notes.length > 0 || said.length > 0) && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          <div className={cn(EYEBROW, 'text-muted-foreground')}>Just happened</div>
          {notes.map((n) => (
            <p key={n.id} className="flex items-start gap-1.5 text-[11px]">
              <Megaphone className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <span><span className="font-semibold text-muted-foreground">{n.title}:</span>{' '}
                {n.text ?? (typeof n.body === 'string' ? n.body : '')}</span>
            </p>
          ))}
          {said.map((d, i) => {
            const Icon = d.kind === 'daily-scrum' ? Users : d.kind === 'moved' ? ArrowRight : Megaphone;
            return (
              <p key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Icon className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  <span className="font-semibold">{whoIs(d.by).replace(/^The /, '')}:</span>{' '}
                  {d.what.replace(/^(The Developers|The Product Owner|The Scrum Master|You) /, '')}
                  {d.cost && <span className="block text-amber-700 dark:text-amber-300">{d.cost}</span>}
                </span>
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}
