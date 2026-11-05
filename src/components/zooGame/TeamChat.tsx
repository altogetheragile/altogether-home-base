import { useYou } from './you';
import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import type { ZooGameState, ChatMessage, ChatWho } from './types';
import { SEAT } from './seats';
import { Person } from './board/Person';
import { personSize } from './board/personShape';
import { cn } from '@/lib/utils';

// The team, talking.
//
// The game was already full of people saying things, and every one of those lines flashed up on a
// card for a few seconds and was gone - in a shared session only, so a learner playing alone never
// saw a word of it. The rail underneath has always been the one place the game asks you for
// something; what it never had was the conversation the asking happens in.
//
// "I was expecting to see the SMS like chat between the team." So: bubbles. Other people on the
// left, you on the right, each wearing the board's own figure in their accountability's colour.
// The thread is this Sprint's and it is kept in game state, so it survives a reload, reads the
// same in every browser of a shared session, and is still there at the Retrospective to quote
// from.
//
// What is NOT here yet, and is in the spec: the named threads (Daily Scrum, Huddle, Review,
// Retrospective) and the seeded message deck. Those arrive with the events they belong to - a
// thread picker over one thread would be furniture.

/** The colour an accountability is drawn in, everywhere in the game. */
const HEX: Record<ChatWho, string> = {
  product_owner: SEAT.productOwner.hex,
  scrum_master: SEAT.scrumMaster.hex,
  developer: SEAT.developers.hex,
  stakeholder: SEAT.stakeholders.hex,
  // You are a Developer, and drawn as one. What tells your bubbles apart is which side of the
  // thread they are on, which is how every chat anybody has used says it.
  you: SEAT.developers.hex,
};

/** The figure's width, so a message that does not draw one still lines up under the one above. */
const FIGURE = 18;

export function Bubble({ msg, opens = true, loud = false }: { msg: ChatMessage; opens?: boolean;
  /** Somebody handing the team the next step, rather than a line in the conversation: said in a
   *  white bubble in ink, at reading size. Priya's handover was a pale bubble of 12px text on a tan
   *  page - "it is barely noticeable" - which is the wrong weight for the line that says what next. */
  loud?: boolean;
}) {
  const viewer = useYou();
  // Yours alone, or yours in a shared game: the line is stored as the person who said it.
  const mine = msg.who === 'you' || (!!viewer && msg.member === viewer);
  return (
    <li data-part="chat-message" data-who={msg.who} data-opens={opens ? 'yes' : 'no'}
      className={cn('flex items-end gap-1.5', mine && 'flex-row-reverse')}>
      {/* Said twice running by the same person, the name and the figure are furniture: they cost a
          row of their own every time and say nothing the line above did not. A run is one person
          talking, drawn as one person talking - the space where the figure would be is kept, so
          the bubbles still line up under each other. Reported from playing it, with a screenshot
          of four lines from two people: "can the messaging be combined?" */}
      {opens
        ? <Person hex={HEX[msg.who]} style={personSize(loud ? 30 : FIGURE)} className="mb-0.5 shrink-0" title={msg.from} />
        : <span aria-hidden className="shrink-0" style={{ width: FIGURE }} />}
      <div className={cn('min-w-0 max-w-[85%]', mine && 'text-right')}>
        {opens && (
          <span className={cn('block font-semibold uppercase tracking-wide', loud ? 'text-[11px]' : 'text-[10px] text-muted-foreground')}
            style={loud ? { color: HEX[msg.who] } : undefined}>
            {msg.from}
          </span>
        )}
        {/* The tail is the corner that is not rounded, on the side the speaker is. */}
        {/* Your own bubbles are filled, and filled in the Developers' teal rather than the brand
            orange a filled thing usually is here: the brand orange is the Product Owner's colour,
            and a thread where your own messages are the same colour as Priya's is a thread you
            have to read twice. You are a Developer, so you are teal like the rest of them. */}
        {/* `whitespace-pre-line`, because some messages are several lines of one thing said at
            once - a Developer's three lines at the Daily Scrum are one turn, not three. */}
        <span style={mine ? { backgroundColor: SEAT.developers.hex } : undefined}
          className={cn('mt-0.5 inline-block whitespace-pre-line rounded-2xl text-left',
            loud ? 'border-2 border-[hsl(var(--zoo-ink))] bg-white px-3.5 py-2 text-[15px] font-medium leading-snug shadow-[3px_3px_0_hsl(var(--zoo-ink))]'
              : 'px-2.5 py-1.5 text-[12px] leading-snug',
            loud && 'relative',
            mine ? 'rounded-br-sm text-white' : cn('rounded-bl-sm text-foreground', !loud && 'bg-muted'))}>
          {/* Said aloud, the bubble points at who said it. A rounded box in ink with a name over it
              read as one more card on a page of cards: "make it more like a speech bubble." */}
          {loud && !mine && (
            <span aria-hidden data-part="bubble-tail"
              className="absolute -left-[9px] bottom-2 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-[hsl(var(--zoo-ink))] bg-white" />
          )}
          {msg.text}
        </span>
      </div>
    </li>
  );
}

/** The day a run of messages belongs to, written once across the thread rather than on every
 *  bubble. A Sprint's conversation is several days long and the Retrospective reads it back. */
function DayLine({ day }: { day: number }) {
  return (
    <li data-part="chat-day" className="flex items-center gap-2 py-0.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Day {day}</span>
      <span className="h-px flex-1 bg-border" />
    </li>
  );
}

export function TeamChat({ state, rail, className }: {
  state: ZooGameState;
  /** The one place the game asks you for something, pinned under the thread: a reply in this
   *  conversation is a move in the game, never decoration. */
  rail: ReactNode;
  className?: string;
}) {
  // What needs answering sits ABOVE the conversation, pinned, and the thread has the rest of the
  // room. It was the other way round, under a thread squeezed into a third of the column, so the
  // one thing waiting on you was the last thing on the screen and the chat was cut off mid-line.
  const thread = state.chat ?? [];
  const list = useRef<HTMLDivElement>(null);
  // Follow the conversation. A chat that does not scroll to the newest line is a chat you have to
  // operate, and the newest line is the one somebody is waiting on you about.
  // The thread's own scroll, and nothing else's. It was `scrollIntoView`, which scrolls every
  // ancestor that can scroll to bring the line into view: at the Sprint Review, where the chat sits
  // beside a page, opening the event scrolled the page down past its own heading.
  useEffect(() => { const el = list.current; if (el) el.scrollTop = el.scrollHeight; }, [thread.length]);

  return (
    <div data-part="team-chat" className={cn('flex min-h-0 flex-col gap-2', className)}>
      {rail}
      <div ref={list} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {thread.length === 0 ? (
          <p className="py-2 text-[12px] text-muted-foreground">
            Nothing said yet. The team talks here while the Sprint runs.
          </p>
        ) : (
          <ul className="flex flex-col py-1">
            {thread.map((m, i) => {
              const newDay = i === 0 || thread[i - 1].day !== m.day;
              // A run is the same person, still on the same day. Only the first of a run is
              // introduced; the rest sit under it, closer together, because they are one turn.
              const opens = newDay || thread[i - 1].from !== m.from;
              return (
                <Fragment key={m.id}>
                  {newDay && <DayLine day={m.day} />}
                  <li className={opens ? 'h-2' : 'h-0.5'} aria-hidden />
                  <Bubble msg={m} opens={opens} />
                </Fragment>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
