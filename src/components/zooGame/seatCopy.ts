import type { SeatName } from './useZooSessions';

// Which accountability you are holding, said out loud, on every screen.
//
// The gate in seatRules only ever speaks when you reach outside your accountability, which
// means a Product Owner doing Product Owner things is never told anything at all - and
// alone in a session, where the empty seats are permissive, nothing is refused ever. So the
// gate on its own reads as no difference from playing solo.
//
// This is the other half, and the cheaper one: name the hat at the moment of the decision,
// rather than waiting for somebody to transgress. A learner should know what is theirs
// before they find out what is not.

export const NAME: Record<SeatName, string> = {
  product_owner: 'Product Owner',
  scrum_master: 'Scrum Master',
  developer: 'Developer',
};

/** What this accountability is holding on this particular screen. Phase by phase, because
 *  "the Product Owner orders the Backlog" is not much use while you are building. */
export const YOURS: Record<SeatName, Record<string, string>> = {
  product_owner: {
    refine: 'What goes on the Product Backlog, and the order it is in.',
    planning: 'You propose where the value is. The Sprint Goal is the whole team’s to agree.',
    sprint: 'What is Done is yours to release, whenever it is worth releasing.',
    review: 'What the visitors asked for becomes a Backlog item if you decide it does.',
    retro: 'You are here as part of the Scrum Team, not as its customer.',
  },
  scrum_master: {
    refine: 'You are accountable for the events happening, not for the Backlog.',
    planning: 'You make the event work. The forecast is the Developers’.',
    sprint: 'The Daily Scrum happening is yours. Impediments get removed outside it.',
    review: 'You keep it a working session rather than a demonstration.',
    retro: 'This is your event to make honest and useful.',
  },
  developer: {
    refine: 'Sizing is yours. Nobody else may put a number on your work.',
    planning: 'You select what you forecast you can finish, and plan how.',
    sprint: 'You pull your own work, and adapt the plan daily toward the Sprint Goal.',
    review: 'You show what actually meets the Definition of Done.',
    retro: 'How the work went is yours to inspect.',
  },
};

/** The one line about what is yours on this screen. Lives here rather than beside the badge
 *  so the badge file exports only a component - a non-component export in a .tsx trips
 *  react-refresh, and CI runs eslint at exactly 134 warnings. */
export const whatIsYours = (seat: SeatName | null, phase: string): string | null =>
  seat ? YOURS[seat][phase] ?? null : null;
