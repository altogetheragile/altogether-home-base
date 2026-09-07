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

export function SeatBand({ state, seat, covering, observer, onWho, className }: {
  state: ZooGameState;
  seat?: SeatName | null;
  /** Seats nobody is holding and no AI is playing, so their work falls to whoever is here. Said on
   *  the band because a covered seat is work you did not think was yours. */
  covering?: SeatName[];
  /** Watching rather than playing. An observer holds nothing, and the band should not outline a
   *  seat as theirs. */
  observer?: boolean;
  /** Somebody was dragged who cannot be dragged, so the game says why rather than nothing. */
  onWho?: (why: string) => void;
  className?: string;
}) {
  const lines = seatLines(state);
  const sentence = whoDoesWhatNow(state);
  const mine = observer ? null : seat ?? null;
  const covered = new Set(observer ? [] : covering ?? []);

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
          return (
            <span key={s.id} {...drag} data-part="seat"
              title={yours || cover
                ? `${s.name} · ${s.doing}\n${cover ? 'Nobody is holding this seat, so its work falls to you. ' : ''}${YOURS[s.role][state.phase] ?? ''}`
                : `${s.name} · ${s.doing}`}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1',
                yours && 'border-2 border-primary bg-primary/5',
                cover && 'border-2 border-dashed border-primary/60',
                !s.present && 'opacity-40')}>
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', ROLE_COLOR[s.role])}>
                {s.initials}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-semibold">
                  {s.name}
                  {yours && <span className="ml-1 text-[10px] font-bold uppercase text-primary">you</span>}
                  {cover && <span className="ml-1 text-[10px] font-medium text-primary">covering</span>}
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
