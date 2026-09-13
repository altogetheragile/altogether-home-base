// ============= The numbers, as dials a trainer can turn =============
//
// The same bargain as the teaching copy, for the numbers instead of the words: the code holds the
// defaults, an override is only ever a layer on top, and if the fetch fails the game runs on what
// it was built with. A trainer who finds that ground is too dear for a two-Sprint workshop should
// not need a developer, and neither should one who wants an escape to hurt more.
//
// What is here and what is not is the whole design. These are the dials that change the ARGUMENT a
// group has - how dear growth is, what carelessness costs, how much a good day is worth. What stays
// in code is anything the game's own lessons rest on: that points buy nothing, that an escape shuts
// the zone, that a visit nobody enjoyed is worth nothing. Those are not settings. A game whose
// lessons could be turned off would be a game that teaches whatever its last editor believed.
//
// Values are read live, so a dial turned mid-game applies at the next Sprint Review rather than
// needing a reload - which is exactly how a trainer uses it: "let's make that hurt more, go again".

export type DialGroup = 'What a visit is worth' | 'What carelessness costs' | 'Growing the zoo';

export interface Dial {
  /** Stable id - the database key, and never renamed once shipped or the overrides orphan. */
  key: string;
  group: DialGroup;
  /** What this number is, in the trainer's list. */
  label: string;
  /** What turning it changes about the game. Not what it is - what it DOES. */
  hint: string;
  /** What the game shipped with. */
  value: number;
  min: number;
  max: number;
  /** A whole number unless it says otherwise. */
  step?: number;
  /** Written after the number, where it helps: "a Sprint", "per animal". */
  unit?: string;
}

/** The dials, with their defaults. Mutable `value` on purpose: an override is applied by writing it
 *  here, and everything reads through `tune()`, so there is one copy of each number in the game. */
export const DIALS: Dial[] = [
  {
    key: 'tune.value.perVisit', group: 'What a visit is worth',
    label: 'A visit worth making',
    hint: 'What the zoo gains from one visit that was worth making. Raise it and a good Sprint feels bigger against the cost of growing.',
    value: 1, min: 1, max: 20,
  },
  {
    key: 'tune.welfare.penalty', group: 'What carelessness costs',
    label: 'Keeping an animal badly',
    hint: 'Taken off for each animal that got out, or that has nowhere to move. About a tenth of a good Sprint at the shipped numbers - raise it to make welfare the argument in the room.',
    value: 50, min: 0, max: 2000, step: 10, unit: 'per animal',
  },
  {
    key: 'tune.ground.price', group: 'Growing the zoo',
    label: 'Ground for a new area',
    hint: 'What the zoo must be worth before it can open another area. The first area is the one it was given; every one after it is earned. At the shipped numbers a zoo with one habitat worth visiting earns about 440 a Sprint, so this is about three good Sprints.',
    value: 1200, min: 0, max: 20000, step: 50,
  },
];

/** Where the live numbers actually live: keyed by dial, seeded from the defaults. */
const live: Record<string, number> = Object.fromEntries(DIALS.map((d) => [d.key, d.value]));

/** What a number is right now. Read at the moment it is needed, never captured at module load, or a
 *  dial turned mid-game would not apply until somebody reloaded the page. */
export const tune = (key: string): number => live[key] ?? DIALS.find((d) => d.key === key)?.value ?? 0;

/** Lay saved numbers over the defaults. Anything unparseable, out of range, or not a dial we know
 *  about is ignored: a bad row in a table must not be able to make the game unplayable. */
export function applyTuning(map: Record<string, string>): void {
  for (const d of DIALS) {
    const said = map[d.key];
    // Blank is not zero. Saving an empty box removes the override, so a blank row - or one left
    // behind by an older save - means "what the game shipped with", and `Number('')` being 0 would
    // quietly set a penalty to nothing.
    if (said === undefined || !said.trim()) { live[d.key] = d.value; continue; }
    const n = Number(said);
    live[d.key] = Number.isFinite(n) && n >= d.min && n <= d.max ? n : d.value;
  }
}
