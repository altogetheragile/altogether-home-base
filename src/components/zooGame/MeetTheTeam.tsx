import type { ZooGameState } from './types';
import type { SeatName } from './useZooSessions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { sprintCapacity } from './engine';

// Five seats, three accountabilities, no manager.
//
// The roles were invisible. The game had a Scrum Team from the first Sprint and never introduced
// them, so a learner met the Product Owner as a name on a chip and found out what a Scrum Master
// was for by never needing one. This screen is the introduction: who each of them is, what they do
// in this game, and one line of character so they are people rather than labels.
//
// It also says where capacity comes from, because that is the answer to the question the next
// screen provokes: three Developers times a three-day Sprint is about what a Sprint holds, and the
// number moves if the team or the Sprint changes. Nobody assigns work. The Developers pull it.

type Seat = {
  seat: SeatName;
  role: string;
  does: string;
  character: string;
  colour: string;
};

const ROLES: Record<SeatName, { role: string; does: string }> = {
  product_owner: {
    role: 'Product Owner',
    does: 'Orders the Backlog. Writes what each item needs to be, answers questions about it while you build, and decides when Done work opens to visitors.',
  },
  scrum_master: {
    role: 'Scrum Master',
    does: 'Keeps the events to their timebox. Removes what is in the way, and coaches the team to manage itself rather than managing it.',
  },
  developer: {
    role: 'Developer',
    does: 'Pulls work, builds it, and holds the Daily Scrum. The plan for the Sprint is theirs to change.',
  },
};

/** A line of character each, so they are people rather than labels - and so the anti-patterns have
 *  somebody to belong to. */
const CHARACTER: Record<string, string> = {
  po: 'Fast and opinionated. Will tell you why.',
  sm: 'Quiet. Asks questions instead of answering them.',
  dev0: 'Likes fences. Sizes things generously.',
  dev1: 'Cautious. Sizes small and asks the Product Owner first.',
  dev2: 'Fast. Will start a second item if nobody stops her.',
};

export function MeetTheTeam({ state, seat = null, onNext }: {
  state: ZooGameState;
  /** In a shared game, the seat this player holds. Playing alone you hold all three. */
  seat?: SeatName | null;
  onNext: () => void;
}) {
  const cap = sprintCapacity(state);
  // The card says the accountability under the name, so a name carrying it too says it twice.
  const plain = (name: string) => name.replace(/\s*\((PO|SM|Dev)\)\s*$/i, '');
  const seats: (Seat & { name: string; initials: string })[] = [
    { ...ROLES.product_owner, seat: 'product_owner', name: plain(state.team.productOwner.name), initials: 'PO',
      character: CHARACTER.po, colour: 'bg-primary text-primary-foreground' },
    { ...ROLES.scrum_master, seat: 'scrum_master', name: plain(state.team.scrumMaster.name), initials: 'SM',
      character: CHARACTER.sm, colour: 'bg-teal-700 text-white' },
    ...state.team.developers.map((d, i) => ({
      ...ROLES.developer, seat: 'developer' as SeatName, name: plain(d.name),
      initials: plain(d.name).slice(0, 1).toUpperCase(), character: CHARACTER[`dev${i}`] ?? 'Gets on with it.',
      colour: 'bg-sky-600 text-white',
    })),
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 overflow-y-auto pr-1">
      <header>
        <div className={cn(EYEBROW, 'text-primary')}>Before there is a Backlog</div>
        <h2 className="text-3xl font-bold leading-tight tracking-tight">Meet the Scrum Team</h2>
        <p className="text-sm text-muted-foreground">
          {seat
            ? 'Five seats, three accountabilities, no manager. Yours is outlined.'
            : 'Five seats, three accountabilities, no manager. Playing alone you hold all three - the game says which one you are in as you act.'}
        </p>
      </header>

      <div data-part="seats" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {seats.map((s) => {
          // Playing alone you are all three accountabilities, so every seat is yours - and saying so
          // is the point: the game gates each move by the accountability it belongs to, not by who
          // is holding a chair.
          const yours = !seat || s.seat === seat;
          return (
            <section key={s.name} data-part="seat-card"
              className={cn('flex flex-col rounded-xl border-2 bg-card p-3',
                yours ? 'border-primary bg-primary/[0.04]' : 'border-border')}>
              <div className="flex items-center gap-2">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', s.colour)}>
                  {s.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-bold leading-tight">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.role}</span>
                </span>
              </div>
              <p className="mt-2 flex-1 text-xs leading-snug">{s.does}</p>
              <p className="mt-2 text-[11px] italic text-muted-foreground">{s.character}</p>
              {/* Not a button. Playing alone there is nothing to pick - you hold all three - and five
                  identical buttons that do nothing is an offer the game cannot keep. */}
              <p className={cn('mt-2 rounded-lg px-2 py-1.5 text-center text-xs font-semibold',
                yours ? 'bg-primary/10 text-primary' : 'border border-border text-muted-foreground')}>
                {!seat ? `Yours \u00b7 ${s.role}` : yours ? 'Your seat' : 'Played by the game'}
              </p>
            </section>
          );
        })}
      </div>

      <section className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-bold">What the team means for the Sprint</h3>
        <p className="mt-1 text-sm">
          {state.team.developers.length} Developers &times; a {state.sprintDays}-day Sprint is about{' '}
          <strong>{cap.points || Math.round(state.team.developers.length * state.sprintDays * 2.5)} points</strong> of capacity.
          Change the Sprint length, or lose a Developer, and the number moves. Nobody assigns work: the Developers pull it.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {seat
            ? 'The seats fill as people join, and the game plays the rest in character.'
            : 'Playing alone you are all three accountabilities. In a shared session you take one seat, the others are taken by people as they join, and the game plays the rest in character.'}
        </p>
      </section>

      <div>
        <Button onClick={onNext}>Next: who is the zoo for &rarr;</Button>
      </div>
    </div>
  );
}
