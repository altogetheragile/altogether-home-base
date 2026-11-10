import { useState } from 'react';
import type { ZooGameState, PbiDraft } from './types';
import type { SeatName } from './useZooSessions';
import { useYou } from './you';
import { asksNow, openQuestions, readyToOpen, theirsToAnswer, whoIs, QUESTION_PATIENCE, PLACEMENT_CHOICES, whatToPullNext, whatToHelpWith, yourDev, activeWipLimit, hatHolder } from './engine';
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
  /** How long it has waited, or that only you can answer it: said beside the count, not in the
   *  sentence, where it made the question twice as long. */
  meta?: string;
  answers: { label: string; act: () => void; primary?: boolean }[];
  /** What one of these answers costs, said on the row rather than in a tooltip nobody sees on a
   *  tablet. "Accept it" and "Send it back" are a thumb-width apart and one of them undoes finished
   *  work. */
  note?: string;
};

export function ActionRail({ state, seat, onAnswerPlacement, onStartItem, onLendAHand, onAnswerQuestion, onOpen, onAddProposal, onSplitEpic, onDeclineProposal, onAgreeMove, onDeclineMove, onAssignDev, className }: {
  state: ZooGameState;
  seat?: SeatName | null;
  onAnswerPlacement?: (id: string, choice: string) => void;
  /** Take a card into Doing. Only a Developer pulls - the Sprint Backlog is theirs - which is why
   *  this is the one action on the rail that is not somebody else waiting on an answer. */
  onStartItem?: (id: string) => void;
  /** Put your own hands on a card somebody else is already building. */
  onLendAHand?: (itemId: string, devId: string) => void;
  /** Answer a question addressed to an accountability. */
  onAnswerQuestion?: (id: string, choice: string) => void;
  onOpen?: (id: string) => void;
  onAddProposal?: (draft: PbiDraft) => void;
  onSplitEpic?: (id: string, memberIds: string[]) => void;
  onDeclineProposal?: (id: string) => void;
  /** Agree to the card movement a colleague is holding up, or tell them not yet. */
  onAgreeMove?: () => void;
  onDeclineMove?: () => void;
  /** Put a Developer on a card. Offered where the player is all of the Developers, so the second
   *  pair of eyes the Definition of Done asks for is somebody they choose. */
  onAssignDev?: (itemId: string, devId: string) => void;
  className?: string;
}) {
  const [at, setAt] = useState(0);
  const viewer = useYou();
  /** Which carried blocker has been read. It stays out of the way once you have seen it, and the
   *  cost it carries stays whether you have read it or not. */
  const [seen, setSeen] = useState<string | null>(null);
  const asks = asksNow(state);
  const actions: RailAction[] = [];

  // A colleague holding a card up, waiting on you. First on the rail and alone on it: the day
  // clock is held while this is open and nobody else is doing anything, so anything behind it is
  // a thing you cannot act on yet.
  //
  // Reported from playing it: "the pulling of the PBIs and the messages that pop up is very quick
  // and confusing. All card movements need to be at least prompted and agreed."
  const held = state.proposed;
  if (held && onAgreeMove && onDeclineMove) {
    const who = state.team.developers.find((d) => d.id === held.devId);
    const move = held.move;
    const card = move.kind === 'forecast' ? null : state.backlog.find((it) => it.id === move.itemId);
    actions.push({
      id: held.id, actor: who?.name ?? 'Developers',
      text: `${who?.name ?? 'A Developer'}: ${held.says}`,
      answers: [
        { label: move.kind === 'pull' ? 'Yes, take it'
          : move.kind === 'finish' ? 'Yes, move it to Done' : 'Yes, forecast those',
        primary: true, act: onAgreeMove },
        { label: 'Not yet', act: onDeclineMove },
      ],
      // Whose call this really is. A game that asks your permission for a colleague's pull has
      // taught the opposite of a Developer-owned Sprint Backlog unless it says so out loud.
      note: `The clock is held while you decide${card ? ` about ${card.name}` : ''}. In Scrum nobody would be asking: who takes what is the Developers' to settle between them. The game asks so that you see every move.`,
    });
  }

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
    // The clock belongs to the questions that have one. An acceptance does not expire - nobody
    // else may answer it - and counting it down to twenty-five was the rail saying something was
    // about to happen when nothing was.
    const theirs = theirsToAnswer(q);
    actions.push({
      id: q.id, actor: whoIs(q.of),
      text: `${q.from}: ${q.text}`,
      meta: theirs ? `waiting ${waited}s of ${QUESTION_PATIENCE}` : 'nobody else can answer it',
      answers: q.choices.map((c) => ({
        // Accepting is the answer that moves the work on, so it is the one that looks like the
        // action. The refusal is a real choice and not a mistake to make quickly.
        label: c.label, primary: c.key === 'theirs' || c.key === 'accept',
        act: () => onAnswerQuestion(q.id, c.key),
      })),
      note: q.choices.map((c) => (c.note ? `${c.label}: ${c.note}` : '')).filter(Boolean).join(' '),
    });
  }

  // Yesterday's blocker, landing on today. It is not a decision - that was taken at the Daily
  // Scrum - so it carries one answer: you have read it. Reported from playing it: "I should be able
  // to close this. Should it be in the bottom left message centre anyway?" It should, and now is.
  const carried = state.carriedImpediment;
  if (carried && seen !== carried.id) {
    const cut = Math.round((1 - (state.dayTimeMult ?? 1)) * 100);
    actions.push({
      id: `carried-${carried.id}`, actor: 'Developers',
      text: `Yesterday's blocker landed on you: ${carried.title}. ${carried.detail}${cut > 0 ? ` Today's build time is cut by about ${cut}%.` : ''}`,
      answers: [{ label: 'Got it', act: () => setSeen(carried.id) }],
    });
  }

  // A second pair of eyes, which the Definition of Done asks for. Playing alone there is nobody
  // beside you to give it - you are all of the Developers - so the rail asks which of them looks
  // it over. Asked rather than done for you, because who reviews what is the Developers' own call.
  const assign = onAssignDev;
  for (const ask of assign ? asks.filter((a) => a.kind === 'review') : []) {
    const item = state.backlog.find((it) => it.id === ask.itemId);
    if (!item) continue;
    const free = state.team.developers.filter((d) => !(item.assignedDevs ?? []).includes(d.id));
    if (!free.length) continue;
    actions.push({
      id: ask.id, actor: 'Developers',
      text: `${item.name} is built. Who gives it the second pair of eyes?`,
      answers: free.map((d, i) => ({ label: d.name, primary: i === 0, act: () => assign?.(item.id, d.id) })),
      note: 'Your Definition of Done asks for a review by another Developer. You are playing all of them, so choose who.',
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

  // ...and last of all, the one thing on this rail that is not somebody waiting on an answer: what
  // the Developers will pull next.
  //
  // Only when there is nothing in hand. A prompt that arrives while you are mid-build is a tap on
  // the shoulder, and the question it asks has already been answered. It is last in the list for
  // the same reason: a Product Owner waiting on a question outranks the board offering you work.
  //
  // The candidates are the first few that could actually start, in the Sprint Backlog's order. The
  // rest of the column is still there and still pullable - the point is that pulling is a choice,
  // and a choice nobody is told the stakes of is a guess.
  //
  // YOURS in hand, not anybody's. It used to be "has anybody started anything", which was the same
  // question back when the Developers were one set of hands - and once two colleagues were
  // building beside you it meant the prompt never came again: the board always had something on
  // it, and the person at the table was never asked what they wanted to do next.
  const you = yourDev(state, viewer);
  const yoursInHand = !!you && state.backlog.some((it) => it.status === 'committed' && it.started
    && !it.design && it.sprintNumber === state.sprintNumber && it.pulledBy === you.id);
  const inTheDay = state.phase === 'sprint' && state.dayStage === 'building' && !held;
  if (inTheDay && !yoursInHand && onStartItem) {
    const wip = activeWipLimit(state);
    const doing = state.backlog.filter((it) => it.status === 'committed' && it.started
      && it.sprintNumber === state.sprintNumber).length;
    const room = wip === 0 || doing < wip;
    const next = room ? whatToPullNext(state) : [];
    if (next.length) {
      actions.push({
        id: 'pull-next', actor: 'Developers',
        text: 'What will you pull next?',
        answers: next.map(({ item }, i) => ({
          label: item.name, primary: i === 0, act: () => onStartItem(item.id),
        })),
        note: next.map(({ item, why }) => `${item.name}: ${why}`).join('  \u00b7  '),
      });
    } else if (you && onLendAHand) {
      // Nothing to start is not nothing to do, and this is what the work-in-progress limit is
      // for: the answer to a full board is to help finish something rather than to start another.
      const hands = whatToHelpWith(state, you.id);
      if (hands.length) {
        actions.push({
          id: 'lend-a-hand', actor: 'Developers',
          text: room ? 'Nothing left to start. Lend a hand?' : 'No room to start anything. Lend a hand?',
          answers: hands.map((item, i) => ({
            label: item.name, primary: i === 0, act: () => onLendAHand(item.id, you.id),
          })),
          note: 'Two of you finish it sooner - about 1.6 times, not twice. Swarming is a practice teams bring to Scrum, not a word in the Guide.',
        });
      }
    }
  }

  // Yours first. In a shared game a question for somebody else is still worth seeing - it is
  // why the Sprint is waiting - but it is not the thing you are being asked to do.
  const mine = (a: RailAction) => isYours(a.actor, state, seat, viewer);
  const ordered = [...actions.filter(mine), ...actions.filter((a) => !mine(a))];
  const total = ordered.length;
  const idx = total ? Math.min(at, total - 1) : 0;
  const action = total ? ordered[idx] : null;
  const yours = !!action && mine(action);

  // Nothing waiting: the rail still says what the team is on, because a line that vanishes is a line
  // you stop reading.
  const building = state.backlog.filter((it) => it.status === 'committed' && it.started
    && it.sprintNumber === state.sprintNumber);
  const quiet = state.phase !== 'sprint'
    ? null
    : building.length
      ? `Building ${building.map((it) => it.name).join(' and ')}.`
      // Both ways in, because only one of them was ever named. A newcomer read "drag a card to
      // Doing", could not drag, and spent fifteen steps hunting for the other way without ever
      // being told there was one: "I cannot drag with these controls. There is no obvious way to
      // move a card into the Doing column."
      : 'Nothing in hand. Drag a card to Doing to start building, or open the card and start it from there.';

  // Three kinds of thing, drawn three ways, because they were one orange box and the one that needed
  // you looked like everything else on the screen. Reported from playing it: "The message board is
  // all messed up and unreadable. It is also hard to know there is an action required. Can
  // messages of different types be distinct?"
  //
  //   - YOUR MOVE: a solid card, labelled, with the answers on it. It stays until it is answered.
  //   - WAITING ON somebody else: the same card, quiet and dashed, with no buttons - it is theirs.
  //   - Nothing asked: one muted line saying what the team is on.
  //
  // ...and what else is waiting is listed under it rather than hidden behind "4 more".
  if (!action) {
    return quiet ? (
      <div data-part="action-rail" data-kind="quiet"
        className={cn('shrink-0 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground', className)}>
        {quiet}
      </div>
    ) : null;
  }

  const actor = action.actor.replace(/^The /, '');
  const rest = ordered.map((a, i) => ({ a, i })).filter(({ i }) => i !== idx);
  return (
    <div data-part="action-rail" data-kind={yours ? 'yours' : 'waiting'}
      // Yours is the loudest thing on the screen: a white card in orange, at reading size, with its
      // answers at button size. It was a pale orange box of 14px text with 12px buttons, the same
      // weight as the board and the chat beside it, and in a screen where most things were orange.
      className={cn('shrink-0 space-y-2 rounded-xl',
        yours ? 'border-[3px] border-primary bg-card px-4 py-3 shadow-[4px_4px_0_hsl(var(--zoo-ink))]' : 'border border-dashed border-border bg-muted/30 px-3 py-2.5',
        className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {yours ? (
          <span data-part="rail-yours" className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Your move
          </span>
        ) : (
          <span data-part="rail-waiting" className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Waiting on {actor}
          </span>
        )}
        {/* Who is asking, in their own colour: the Product Owner orange, the Scrum Master purple,
            the Developers teal - the colours they wear everywhere else in the game. */}
        <span data-part="rail-actor" className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', ACTOR)}>
          {actor}
        </span>
        {action.meta && <span data-part="rail-meta" className="text-[11px] text-muted-foreground">{action.meta}</span>}
        {total > 1 && (
          <span data-part="rail-count" className="ml-auto text-[10px] font-medium text-muted-foreground">
            {idx + 1} of {total}
          </span>
        )}
      </div>
      <p className={cn('leading-snug', yours ? 'text-base font-semibold text-foreground lg:text-lg' : 'text-sm text-muted-foreground')}>
        {action.text}
        {action.note && (
          <span className="mt-1 block text-xs font-normal leading-snug text-muted-foreground">{action.note}</span>
        )}
      </p>
      {/* An action with buttons is never dismissed: it is answered, or it waits. Somebody else's has
          no buttons here, because pressing them would be answering for them. */}
      {yours && action.answers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {action.answers.map((a) => (
            <button key={a.label} type="button" onClick={a.act}
              className={cn(FOCUS, 'shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors',
                a.primary ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-[hsl(var(--zoo-ink))] bg-card hover:bg-muted/60')}>
              {a.label}
            </button>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        // One line, not a row each: the queue is seen, and it does not push the board off the
        // screen. Each one is still a button that brings it up.
        <ul data-part="rail-rest" className="flex min-w-0 items-center gap-2 border-t border-border/70 pt-1.5">
          <li className="shrink-0 text-[11px] text-muted-foreground">Also waiting</li>
          {rest.slice(0, 3).map(({ a, i }) => (
            <li key={a.id} className="min-w-0 max-w-[32%] flex-1">
              <button type="button" onClick={() => setAt(i)}
                className={cn(FOCUS, 'flex w-full min-w-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 text-left text-[11px] hover:bg-muted/60')}>
                <span className={cn('shrink-0 font-semibold', mine(a) ? 'text-foreground' : 'text-muted-foreground')}>
                  {mine(a) ? 'Yours' : `${a.actor.replace(/^The /, '')}'s`}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.text}</span>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
          {rest.length > 3 && (
            <li className="shrink-0 text-[10px] text-muted-foreground">and {rest.length - 3} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Whoever is asking, as a quiet label. It wore their colour, which made the Product Owner's an
 *  orange chip beside an orange "Your move": two orange things where one says what to do. The
 *  person's colour stays on the person, in the chat and on the board. */
const ACTOR = 'bg-muted text-foreground';

/** Whether a thing on the rail is this player's to answer.
 *
 *  Alone, everything is: you are the Scrum Master and the Developers, and what the Product Owner is
 *  asked is left to you as well. In a shared game every player is a Developer, the Scrum Master's
 *  calls are whoever wears the hat, and the Product Owner's are the Product Owner seat's. */
function isYours(actor: string, state: ZooGameState, seat: SeatName | null | undefined, viewer: string | null): boolean {
  if (!seat) return true;
  const who = actor.replace(/^The /, '').toLowerCase();
  if (who === 'product owner') return seat === 'product_owner';
  if (who === 'scrum master') return seat === 'scrum_master' || (!!viewer && hatHolder(state)?.id === viewer);
  return true;   // the Developers, or a Developer by name: every player is one
}
