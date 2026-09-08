import { useState } from 'react';
import type { ZooGameState, PbiDraft } from './types';
import type { SeatName } from './useZooSessions';
import { asksNow, openQuestions, readyToOpen, whoIs, QUESTION_PATIENCE, PLACEMENT_CHOICES } from './engine';
import { lookAhead } from './lookAhead';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { ChevronRight } from 'lucide-react';

// The rail: one line at the foot of the screen, and the only place the game asks you for anything.
//
// There was a panel of "actions and messages" that did three jobs at once - things to answer, things
// to know, and a log of what had happened - and it took a quarter of the screen to do them badly.
// The three have gone three ways. What needs a click is here, one at a time, with the buttons on the
// line. What needs no click is a note, kept in Learn. What already happened is the decision log,
// also in Learn, where the Retrospective reads it back.
//
// An action with buttons is never dismissed. It is answered, or it waits - which is the honest
// model of somebody waiting on you, and it is how the game shows the cost of not answering.

/** One thing being asked, with the answers that settle it. */
type RailAction = {
  id: string;
  /** Whose call it is, in the words the game uses for accountabilities. */
  actor: string;
  text: string;
  answers: { label: string; act: () => void; primary?: boolean }[];
};

export function ActionRail({ state, seat, onAnswerPlacement, onAnswerQuestion, onOpen, onAddProposal, onSplitEpic, onDeclineProposal, className }: {
  state: ZooGameState;
  seat?: SeatName | null;
  onAnswerPlacement?: (id: string, choice: string) => void;
  /** Answer a question addressed to an accountability. */
  onAnswerQuestion?: (id: string, choice: string) => void;
  onOpen?: (id: string) => void;
  onAddProposal?: (draft: PbiDraft) => void;
  onSplitEpic?: (id: string, memberIds: string[]) => void;
  onDeclineProposal?: (id: string) => void;
  className?: string;
}) {
  const [at, setAt] = useState(0);
  const asks = asksNow(state);
  const actions: RailAction[] = [];

  // A question put to an accountability, with the clock running on it. The Developers are standing
  // still while it is open; past the threshold they answer it themselves and the guess is logged.
  // Work waiting to be accepted comes first. A finished Increment sitting behind "rounded or
  // square?" is the Developers standing still on a question about a corner, and the acceptance is
  // the one answer that lets something reach Done.
  const queue = [...openQuestions(state)].sort((a, z) =>
    Number(z.id.startsWith('check-')) - Number(a.id.startsWith('check-')));
  for (const q of queue) {
    if (!onAnswerQuestion) break;
    const waited = Math.max(0, q.askedAt - state.daySecondsLeft);
    actions.push({
      id: q.id, actor: whoIs(q.of),
      text: `${q.from}: ${q.text}  ·  waiting ${waited}s of ${QUESTION_PATIENCE}`,
      answers: q.choices.map((c) => ({
        label: c.label, primary: c.key === 'theirs',
        act: () => onAnswerQuestion(q.id, c.key),
      })),
    });
  }

  // Where a thing goes is a product decision, and the Developers are standing still while it is
  // unanswered. They get on with it if nobody answers, and that costs you the say.
  const question = asks.find((a) => a.kind === 'question');
  const asked = question?.itemId ? state.backlog.find((it) => it.id === question.itemId) : undefined;
  if (asked && onAnswerPlacement) {
    actions.push({
      id: `place-${asked.id}`, actor: whoIs('product_owner'),
      text: `Where should ${asked.name} go? It is what visitors walk up to.`,
      answers: [
        ...PLACEMENT_CHOICES.map((c) => ({ label: c.label, act: () => onAnswerPlacement(asked.id, c.key) })),
        { label: 'You choose', act: () => onAnswerPlacement(asked.id, 'them') },
      ],
    });
  }

  // Done and shut. Releasing is the Product Owner's call and it is not the Review's to make: work
  // can go live the day it is Done, or wait, and both are decisions.
  for (const it of state.backlog) {
    if (it.status !== 'done' || !readyToOpen(it) || !onOpen) continue;
    actions.push({
      id: `open-${it.id}`, actor: whoIs('product_owner'),
      text: `${it.name} is Done and visitors cannot see it. Open it now, or later?`,
      answers: [{ label: 'Open it now', act: () => onOpen(it.id), primary: true }],
    });
  }

  // The Product Owner looking ahead: what the forecast implies, and what is hiding inside an epic.
  // Turning one down is a decision too, and it will not be put again.
  if (onDeclineProposal) {
    for (const p of lookAhead(state).slice(0, 2)) {
      actions.push({
        id: `ahead-${p.id}`, actor: whoIs('product_owner'), text: p.why,
        answers: [
          { label: p.label, primary: true, act: () => (p.kind === 'add' ? onAddProposal?.(p.draft) : onSplitEpic?.(p.epicId, p.memberIds)) },
          { label: 'Not this one', act: () => onDeclineProposal(p.id) },
        ],
      });
    }
  }

  const total = actions.length;
  const idx = total ? Math.min(at, total - 1) : 0;
  const action = total ? actions[idx] : null;

  // Nothing waiting: the rail still says what the team is on, because a line that vanishes is a line
  // you stop reading.
  const building = state.backlog.filter((it) => it.status === 'committed' && it.started
    && it.sprintNumber === state.sprintNumber);
  const quiet = state.phase !== 'sprint'
    ? null
    : building.length
      ? `Building ${building.map((it) => it.name).join(' and ')}.`
      : 'Nothing in hand. Drag a card to Doing to start building.';

  return (
    <div data-part="action-rail"
      className={cn('flex min-h-[3rem] shrink-0 flex-wrap items-center gap-2 rounded-lg border-2 px-3 py-2',
        action ? 'border-primary bg-primary/[0.05]' : 'border-border bg-muted/30', className)}>
      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        action ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
        {action ? action.actor.replace(/^The /, '') : 'Developers'}
      </span>
      <span className="min-w-0 flex-1 text-sm">{action ? action.text : quiet}</span>
      {action?.answers.map((a) => (
        <button key={a.label} type="button" onClick={a.act}
          className={cn(FOCUS, 'shrink-0 rounded-md border px-2 py-1 text-xs font-semibold transition-colors',
            a.primary ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border-border bg-card hover:bg-muted/60')}>
          {a.label}
        </button>
      ))}
      {/* One at a time, with a count if more are waiting. Nothing here is dismissed: it is answered
          or it waits, and the waiting is the lesson. */}
      {total > 1 && (
        <button type="button" onClick={() => setAt((i) => (i + 1) % total)}
          className={cn(FOCUS, 'flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground')}>
          {total - 1} more <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
      {seat && action && (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          {action.actor.replace(/^The /, '').toLowerCase().startsWith(seat.replace('_', ' ').slice(0, 4)) ? 'yours' : 'waiting on them'}
        </span>
      )}
    </div>
  );
}
