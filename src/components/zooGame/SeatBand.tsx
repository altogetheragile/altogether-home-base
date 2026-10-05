import type { ZooGameState, ScrumTeamMember } from './types';
import type { SeatName } from './useZooSessions';
import { seatLines, whoDoesWhatNow } from './header';
import { yourDev } from './engine';
import { MEMBER_DRAG } from './ScrumTeam';
import { YOURS } from './seatCopy';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEAT } from './seats';
import { Person } from './board/Person';
import { FOCUS } from './ui/tokens';

// The band: one sentence on who does what now, and the five people with what each is doing.
//
// The accountabilities were invisible. There was a row of name chips that said who was on the team
// and nothing about what any of them were for, and a Product Owner could sit idle for three days
// without the game ever saying that was the problem. This row says it continuously: who is doing
// what, right now, and who is not in the room for what is on the screen.

// What each of the five is drawn in: their accountability's colour, and every Developer the same
// one. They each carry their own name on the line beside them, which is what tells them apart.
const colourOf = (role: string): string =>
  (role === 'product_owner' ? SEAT.productOwner.hex
    : role === 'scrum_master' ? SEAT.scrumMaster.hex
      : SEAT.developers.hex);

/** Which seat on the band is the one this player holds.
 *
 *  In a shared game it is the seat they took. Playing alone it is a PERSON: you hold the first
 *  Developer and the game plays the other two beside you, which is the whole shape of the Sprint
 *  and was nowhere on the screen. "Three Devs are mentioned. Which is the human player?" - the band
 *  said "Ada - building Bridge" exactly as it said "Ben - building Lion Enclosure", so there was
 *  no way to know. */
const isMine = (
  s: { role: string; id: string },
  seat: SeatName | null | undefined,
  you: ScrumTeamMember | undefined,
): boolean => (seat ? s.role === seat : s.id === you?.id);

/** Your own name, changed where it is written.
 *
 *  The band is on every screen of the game, which is why it is here: Meet the Team has the same
 *  field and most players never see that screen - "Start building" goes straight to a planned
 *  Sprint 1 and skips it.
 *
 *  A button until you press it, so the band stays a band. It stops the pointer from reaching the
 *  seat around it, which is draggable: dragging a Developer onto a card is how work gets picked
 *  up, and a rename that started a drag would be worse than no rename. */
function RenameMe({ id, name, onRename }: {
  id: string; name: string; onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button type="button" data-part="rename-me" title="Call yourself whatever you like"
        aria-label="Change your name"
        draggable={false}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className={cn(FOCUS, 'ml-1 rounded p-0.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground hover:opacity-100')}>
        <Pencil className="h-3 w-3" />
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={name}
      data-part="your-name"
      aria-label="Your name"
      maxLength={24}
      draggable={false}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => onRename(id, e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
      onBlur={(e) => { if (!e.target.value.trim()) onRename(id, name); setEditing(false); }}
      className={cn(FOCUS, 'ml-1 w-24 rounded border border-primary bg-background px-1 text-[11px] font-semibold outline-none')}
    />
  );
}

export function SeatBand({ state, seat, covering, away, observer, onWho, onRename, className }: {
  state: ZooGameState;
  seat?: SeatName | null;
  /** Seats nobody is holding and no AI is playing, so their work falls to whoever is here. Said on
   *  the band because a covered seat is work you did not think was yours. */
  covering?: SeatName[];
  /** Seats whose holder is not connected right now. A subset of `covering` - the work falls to
   *  whoever is here either way, and this is the difference between a chair nobody took and a
   *  person who has gone. The lobby has always said it; in the game the seat just quietly became
   *  yours to cover, which is the same news with the reason taken out. */
  away?: SeatName[];
  /** Watching rather than playing. An observer holds nothing, and the band should not outline a
   *  seat as theirs. */
  observer?: boolean;
  /** Somebody was dragged who cannot be dragged, so the game says why rather than nothing. */
  onWho?: (why: string) => void;
  /** Put your own name on your own person. Offered here because the band is on every screen.
   *  "Maybe people do not want to be called Ada." */
  onRename?: (memberId: string, name: string) => void;
  className?: string;
}) {
  const lines = seatLines(state);
  // The Developer whose hands you have, for a game with nobody else at the table.
  const you = yourDev(state);
  const sentence = whoDoesWhatNow(state, observer ? null : seat ?? null);
  const mine = observer ? null : seat ?? null;
  const covered = new Set(observer ? [] : covering ?? []);
  // An observer covers nothing, but they should still see who has dropped out: they are often the
  // one running the room.
  const gone = new Set(away ?? []);

  return (
    <div data-part="seat-band"
      className={cn('flex shrink-0 items-center gap-3 overflow-x-auto border-b border-border bg-muted/40 px-3 py-1.5', className)}>
      <p className="min-w-0 shrink-0 text-xs font-medium text-foreground">
        {observer && <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">watching</span>}
        {sentence}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {lines.map((s) => {
          // The Developers take work by being dragged onto it; the Product Owner and the Scrum
          // Master take part as Developers only when they are working on Sprint Backlog items, so
          // dragging them says so rather than doing nothing.
          const drag = s.role === 'developer'
            ? {
              draggable: true,
              onDragStart: (e: React.DragEvent) => {
                e.dataTransfer.effectAllowed = 'copy';
                try { e.dataTransfer.setData('text/plain', MEMBER_DRAG + s.id); } catch { /* some browsers */ }
              },
            }
            : {
              draggable: true,
              onDragStart: (e: React.DragEvent) => {
                e.preventDefault();
                onWho?.(`The ${s.role === 'product_owner' ? 'Product Owner' : 'Scrum Master'} takes part as a Developer only when they are working on Sprint Backlog items. ${s.name} has their own accountability here.`);
              },
            };
          const yours = isMine(s, mine, observer ? undefined : you);
          const cover = !yours && covered.has(s.role as SeatName);
          const absent = gone.has(s.role as SeatName);
          return (
            <span key={s.id} {...drag} data-part="seat"
              title={yours || cover || absent
                ? `${s.name} · ${s.doing}\n${absent ? 'Whoever holds this seat is not here, so its work falls to the rest of you. '
                  : cover ? 'Nobody is holding this seat, so its work falls to you. ' : ''}${YOURS[s.role][state.phase] ?? ''}`
                : `${s.name} · ${s.doing}`}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1',
                yours && 'border-2 border-primary bg-primary/5',
                cover && !absent && 'border-2 border-dashed border-primary/60',
                absent && 'border-2 border-dashed border-amber-400/70 bg-amber-500/[0.04]',
                !s.present && 'opacity-40')}>
              {/* The board's person, not a coloured disc with a letter in it. Taller than it is
                  wide, because a person is - so it is given height rather than a square. */}
              {/* No letters on a Developer: the name is right there, and "A" beside "Ada" is the
                  word said twice. The two seats there is only one of keep theirs - "PO" and "SM"
                  are the accountability rather than the person, and they are what the board writes
                  on them. */}
              <Person hex={colourOf(s.role)} initials={s.role === 'developer' ? undefined : s.initials}
                className="h-7 w-[1.45rem] shrink-0" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-semibold">
                  {s.name}
                  {yours && <span data-part="seat-you" className="ml-1 text-[10px] font-bold uppercase text-primary">you</span>}
                  {yours && onRename && <RenameMe id={s.id} name={s.name} onRename={onRename} />}
                  {/* One word, because the band is one line and this is the whole news. Said in
                      words as well as in colour: a faded chip is not a message, and dimming was all
                      this had. */}
                  {absent
                    ? <span data-part="seat-away" className="ml-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">away</span>
                    : cover && <span className="ml-1 text-[10px] font-medium text-primary">covering</span>}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">{s.doing}</span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
