import type { ZooGameState } from './types';
import type { SeatName } from './useZooSessions';
import { seatLines, whoDoesWhatNow } from './header';
import { MEMBER_DRAG } from './ScrumTeam';
import { YOURS } from './seatCopy';
import { cn } from '@/lib/utils';

// The band: one sentence on who does what now, and the five people with what each is doing.
//
// The accountabilities were invisible. There was a row of name chips that said who was on the team
// and nothing about what any of them were for, and a Product Owner could sit idle for three days
// without the game ever saying that was the problem. This row says it continuously: who is doing
// what, right now, and who is not in the room for what is on the screen.

const ROLE_COLOR: Record<string, string> = {
  product_owner: 'bg-primary text-primary-foreground',
  scrum_master: 'bg-teal-700 text-white',
  developer: 'bg-sky-600 text-white',
};

/** Which seat on the band is the one this player holds. A solo player holds all three
 *  accountabilities, so nothing is outlined - there is nobody else to tell them apart from. */
const isMine = (role: string, seat: SeatName | null | undefined): boolean => !!seat && role === seat;

export function SeatBand({ state, seat, covering, away, observer, onWho, className }: {
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
  className?: string;
}) {
  const lines = seatLines(state);
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
          const yours = isMine(s.role, mine);
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
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', ROLE_COLOR[s.role])}>
                {s.initials}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-semibold">
                  {s.name}
                  {yours && <span className="ml-1 text-[10px] font-bold uppercase text-primary">you</span>}
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
