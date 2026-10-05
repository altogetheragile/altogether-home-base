import type { ZooGameState } from './types';
import type { SeatName } from './useZooSessions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';
import { sprintCapacity, yourDev } from './engine';
import { SEAT } from './seats';
import { Person } from './board/Person';
import { personSize } from './board/personShape';

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
  colour?: string;
  /** A Developer's own shade of the stack. */
  style?: React.CSSProperties;
};

const ROLES: Record<SeatName, { role: string; does: string }> = {
  product_owner: {
    role: 'Product Owner',
    does: 'Orders the Product Backlog. Writes what each item needs to be, answers questions about it while you build, and decides when Done work opens to visitors.',
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

/** Your own name, typed into your own card.
 *
 *  Live as you type, because a name that needs a Save button is a name most people will not
 *  bother changing - and there is nothing to lose if they wander off mid-word. Blank falls back to
 *  the name you were given rather than leaving a nameless Developer on the board, and the engine
 *  refuses an empty one anyway.
 *
 *  This is the only place in the game that writes a person's name, so it is the only place that
 *  has to think about it. */
function YourName({ id, name, onRename }: { id: string; name: string; onRename: (id: string, name: string) => void }) {
  return (
    <label className="block">
      <span className="sr-only">Your name</span>
      <input
        value={name}
        data-part="your-name"
        onChange={(e) => onRename(id, e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) onRename(id, name); }}
        maxLength={24}
        placeholder="Your name"
        title="Call yourself whatever you like. It is your Developer."
        className={cn(FOCUS, 'w-full rounded-md border-2 border-primary/50 bg-background px-1.5 py-0.5 text-lg font-bold leading-tight outline-none focus:border-primary')}
      />
    </label>
  );
}

export function MeetTheTeam({ state, seat = null, onNext, onRename }: {
  state: ZooGameState;
  /** In a shared game, the seat this player holds. Playing alone you are one of the Developers. */
  seat?: SeatName | null;
  onNext: () => void;
  /** Put your own name on your own Developer. Offered here because this is where you meet them,
   *  and because somebody who is about to spend an hour as Ada should get to say whether they
   *  want to be: "maybe people do not want to be called Ada". */
  onRename?: (memberId: string, name: string) => void;
}) {
  const cap = sprintCapacity(state);
  // The Developer whose hands you have, in a game with nobody else at the table. The screen used
  // to say you held all three accountabilities and outline all five cards; that stopped being true
  // when the Product Owner got a seat of her own and the other two Developers started working
  // beside you.
  const you = seat ? null : yourDev(state);
  // The card says the accountability under the name, so a name carrying it too says it twice.
  const plain = (name: string) => name.replace(/\s*\((PO|SM|Dev)\)\s*$/i, '');
  const seats: (Seat & { id: string; name: string; initials?: string; hex: string })[] = [
    { ...ROLES.product_owner, seat: 'product_owner', id: state.team.productOwner.id,
      name: plain(state.team.productOwner.name), initials: 'PO',
      character: CHARACTER.po, hex: SEAT.productOwner.hex },
    { ...ROLES.scrum_master, seat: 'scrum_master', id: state.team.scrumMaster.id,
      name: plain(state.team.scrumMaster.name), initials: 'SM',
      character: CHARACTER.sm, hex: SEAT.scrumMaster.hex },
    // No letter on a Developer's figure: the card has their name on it in bold, and their first
    // initial on their chest is that word said twice.
    ...state.team.developers.map((d, i) => ({
      ...ROLES.developer, seat: 'developer' as SeatName, id: d.id, name: plain(d.name),
      initials: undefined,
      // No line of character on your own card: the others have one so the anti-patterns have
      // somebody to belong to, and inventing a personality for the person playing is a different
      // thing entirely.
      character: d.id === you?.id ? '' : CHARACTER[`dev${i}`] ?? 'Gets on with it.',
      hex: SEAT.developers.hex,
    })),
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 overflow-y-auto pr-1">
      <header>
        <div className={cn(EYEBROW, 'text-primary')}>Before there is a Product Backlog</div>
        <h2 className="text-3xl font-bold leading-tight tracking-tight">Meet the Scrum Team</h2>
        <p className="text-sm text-muted-foreground">
          {seat
            ? 'Five seats, three accountabilities, no manager. Yours is outlined.'
            : 'Five seats, three accountabilities, no manager. You are one of the Developers. Priya and the other two are played by the game, and Sam\u2019s work falls to you until somebody takes that seat.'}
        </p>
      </header>

      <div data-part="seats" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {seats.map((s) => {
          // Playing alone you are all three accountabilities, so every seat is yours - and saying so
          // is the point: the game gates each move by the accountability it belongs to, not by who
          // is holding a chair.
          // Yours is YOUR card, not every card. In a shared game it is the seat you took.
          const yours = seat ? s.seat === seat : s.id === you?.id;
          return (
            <section key={s.name} data-part="seat-card"
              className={cn('flex flex-col rounded-xl border-2 bg-card p-3',
                yours ? 'border-primary bg-primary/[0.04]' : 'border-border')}>
              <div className="flex items-center gap-2">
                <Person hex={s.hex} initials={s.initials} style={personSize(40)} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  {/* Your own name is a field. Everybody else's is a name. */}
                  {yours && onRename
                    ? <YourName id={s.id} name={s.name} onRename={onRename} />
                    : <span className="block truncate text-lg font-bold leading-tight">{s.name}</span>}
                  <span className="block text-xs text-muted-foreground">{s.role}</span>
                </span>
              </div>
              <p className="mt-2 flex-1 text-xs leading-snug">{s.does}</p>
              {s.character && <p className="mt-2 text-[11px] italic text-muted-foreground">{s.character}</p>}
              {/* Not a button. There is nothing to pick here, and five identical buttons that do
                  nothing is an offer the game cannot keep.
                  It used to say "Yours" on all five of them playing alone, which was true when the
                  player held every accountability and has not been since the Product Owner got a
                  seat of her own. */}
              <p data-part="seat-held" className={cn('mt-2 rounded-lg px-2 py-1.5 text-center text-xs font-semibold',
                yours ? 'bg-primary/10 text-primary' : 'border border-border text-muted-foreground')}>
                {yours ? `You \u00b7 ${s.role}`
                  : seat ? 'Played by the game'
                    // Nobody plays the Scrum Master in a solo game: holding the Daily Scrum is the
                    // Developers' event and playing it would take the player's own event away from
                    // them. So that seat is empty, and its work lands on you.
                    : s.seat === 'scrum_master' ? 'Nobody holds it \u00b7 falls to you'
                      : 'Played by the game'}
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
            : 'You are one of the Developers, and the game plays the rest in character. In a shared session the others are taken by people as they join.'}
        </p>
      </section>

      <div>
        <Button onClick={onNext}>Next: who is the zoo for &rarr;</Button>
      </div>
    </div>
  );
}
