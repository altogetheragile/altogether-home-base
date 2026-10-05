import type { ZooGameState } from './types';
import type { SimulationResult } from './simulation/types';

// The people the Sprint Review is held for.
//
// "The Scrum Team presents the results of their work to key stakeholders and progress toward the
// Product Goal is discussed." The game had the results and the progress; what it never had was the
// stakeholders. Attendance and happiness were two numbers on a card, and nobody in the room had an
// opinion about either - so the event taught that a Review is a report, which is the thing it is
// most often turned into.
//
// Six of them, each caring about one thing, and each able to say a handful of sentences. The rule
// that makes it worth anything is in `when`: **a line only exists when the number behind it
// crossed its threshold.** Nobody says the toilets are a disgrace unless the toilets are a
// disgrace. A stakeholder who would say the same thing whatever the zoo was like is scenery, and
// scenery is what makes a Review feel like theatre.
//
// Every line carries a `learningPoint`, so a trainer can see what the deck is actually covering
// across a game rather than guessing from the wording.

export interface Stakeholder {
  id: string;
  name: string;
  /** What they are, in the words the game uses out loud. */
  role: string;
  /** The one thing they care about, which is why the Product Owner invited them. */
  cares: string;
}

/** Six to eight, each with an interest that pulls a different way. A Review where everybody wants
 *  the same thing is a Review with nothing to discuss. */
export const STAKEHOLDERS: Stakeholder[] = [
  { id: 'owner', name: 'Margaret', role: 'the zoo’s owner', cares: 'value and visitors' },
  { id: 'keeper', name: 'Dev', role: 'the head keeper', cares: 'the animals’ welfare' },
  { id: 'council', name: 'Councillor Hale', role: 'the local council', cares: 'safety and access' },
  { id: 'school', name: 'Mrs Okafor', role: 'a local school', cares: 'what the children learn' },
  { id: 'supplier', name: 'Tomas', role: 'a supplier', cares: 'what is coming and when' },
  { id: 'panel', name: 'Joy', role: 'the visitor panel', cares: 'how a day out actually feels' },
];

export const stakeholderById = (id: string): Stakeholder | undefined =>
  STAKEHOLDERS.find((s) => s.id === id);

/** One thing a stakeholder could say, and what has to be true for them to say it. */
export interface StakeholderLine {
  id: string;
  who: string;
  /** What makes it true. A quote only exists when the number behind it crossed its threshold -
   *  which is the whole of what keeps these people from being scenery. */
  when: (state: ZooGameState, sim: SimulationResult) => boolean;
  /** What they say, in the numbers the park actually counted. */
  says: (state: ZooGameState, sim: SimulationResult) => string;
  /** What it is teaching, so a trainer can see the deck's coverage. */
  learningPoint: string;
}

/** How many visitors did not get what they came for. */
const wasted = (sim: SimulationResult): number =>
  sim.segments.reduce((n, s) => n + Math.round(s.attendance * s.truncationRate), 0);

/** The segment that had the worst time of it. */
const unhappiest = (sim: SimulationResult) =>
  [...sim.segments].sort((a, z) => a.happiness - z.happiness)[0];

const named = (state: ZooGameState): string[] => state.backlog
  .filter((it) => it.status === 'open' || it.status === 'done')
  .map((it) => it.name);

export const STAKEHOLDER_LINES: StakeholderLine[] = [
  // ---- the owner: value and visitors ----
  {
    id: 'owner-attendance-up', who: 'owner',
    learningPoint: 'The Increment is judged by what it was worth, not by what it cost.',
    when: (_s, sim) => sim.totalAttendance > 0,
    says: (_s, sim) => `${sim.totalAttendance} people came this Sprint. I do not mind what it took to build - I mind that they came, and that they will come again.`,
  },
  {
    id: 'owner-wasted', who: 'owner',
    learningPoint: 'Work that is Done but not usable has earned nothing.',
    when: (_s, sim) => wasted(sim) >= 20,
    says: (_s, sim) => `${wasted(sim)} of them left early. We paid to build everything they walked past on the way out.`,
  },
  {
    id: 'owner-nothing-open', who: 'owner',
    learningPoint: 'An Increment nobody can use is not an Increment.',
    when: (s) => !s.backlog.some((it) => it.status === 'open'),
    says: () => 'Nothing is open to visitors. I am sure a great deal got built; none of it has earned us anything yet.',
  },

  // ---- the head keeper: welfare ----
  {
    id: 'keeper-penalties', who: 'keeper',
    learningPoint: 'Quality the Definition of Done did not ask for is quality nobody built.',
    when: (s) => (s.lastLedger?.penalties ?? 0) > 0,
    says: (s) => `${s.lastLedger!.penalisedFor[0] ?? 'An animal was kept badly'}. Nothing in your Definition of Done asked anybody to check.`,
  },
  {
    id: 'keeper-happy', who: 'keeper',
    learningPoint: 'A stakeholder with nothing to complain about is still worth hearing.',
    when: (s) => (s.lastLedger?.penalties ?? 0) === 0 && s.backlog.some((it) => it.category === 'exhibit' && it.status === 'open'),
    says: (s) => `The animals are all right. ${named(s).find((n) => /lion|tiger|bear|wolf|panda/i.test(n)) ?? 'The first one in'} has room and somewhere to get out of the weather, which is more than I expected this early.`,
  },

  // ---- the council: safety and access ----
  {
    id: 'council-unreachable', who: 'council',
    learningPoint: 'Accessible is a criterion, not an afterthought.',
    when: (s) => s.backlog.some((it) => it.status === 'open' && it.accessible === false),
    says: (s) => {
      const stuck = s.backlog.filter((it) => it.status === 'open' && it.accessible === false);
      return `${stuck[0].name} has no path to it. Open to the public means a person can get there, and ${stuck.length === 1 ? 'that one' : `${stuck.length} of them`} cannot be reached.`;
    },
  },
  {
    id: 'council-reachable', who: 'council',
    learningPoint: 'The Definition of Done is what makes a claim checkable.',
    when: (s) => s.backlog.filter((it) => it.status === 'open').length >= 2
      && !s.backlog.some((it) => it.status === 'open' && it.accessible === false),
    says: () => 'Everything you have opened can be walked to. That is the part people only notice when it is missing, so: noticed.',
  },

  // ---- the school: what the children learn ----
  {
    id: 'school-families-unhappy', who: 'school',
    learningPoint: 'One number hides the segment having the worst time.',
    when: (_s, sim) => (sim.segments.find((x) => x.segmentId === 'families')?.happiness ?? 100) < 55,
    says: (_s, sim) => `Families came out at ${Math.round(sim.segments.find((x) => x.segmentId === 'families')!.happiness)} out of a hundred. I bring thirty children at a time and I have to be able to promise them a good day.`,
  },
  {
    id: 'school-exhibits', who: 'school',
    learningPoint: 'Stakeholders describe value in their own terms, not the team’s.',
    when: (s) => s.backlog.filter((it) => it.category === 'exhibit' && it.status === 'open').length >= 2,
    says: (s) => `Two animals to look at is a morning’s lesson. ${named(s)[0]} is the one they will talk about on the bus.`,
  },

  // ---- the supplier: what is coming and when ----
  {
    id: 'supplier-what-next', who: 'supplier',
    learningPoint: 'The Product Backlog is adapted at the Review, in front of the people it affects.',
    when: (s) => s.backlog.some((it) => it.status === 'backlog'),
    says: (s) => {
      const next = s.backlog.find((it) => it.status === 'backlog');
      return `What is next? If ${next?.name ?? 'the next thing'} is coming I need to know this week, not the week you start it.`;
    },
  },

  // ---- the visitor panel: how a day out feels ----
  {
    id: 'panel-unmet-need', who: 'panel',
    learningPoint: 'An increment is judged by the whole experience, not by the feature.',
    when: (_s, sim) => wasted(sim) >= 10,
    says: (_s, sim) => {
      const worst = unhappiest(sim);
      const need = (Object.entries(worst.unmetNeeds) as [string, number][])
        .sort((a, z) => z[1] - a[1])[0];
      return `People are leaving before they have seen it. ${need && need[1] > 0 ? `Mostly looking for somewhere to ${need[0] === 'food' ? 'eat' : need[0] === 'toilet' ? 'go' : 'sit down'}.` : 'There is nothing to keep them.'}`;
    },
  },
  {
    id: 'panel-quote', who: 'panel',
    learningPoint: 'A quote is evidence; a summary is an opinion.',
    when: (_s, sim) => sim.quotes.length > 0,
    says: (_s, sim) => `One of ours wrote this down: “${sim.quotes[0].text}”`,
  },
  {
    id: 'panel-happy', who: 'panel',
    learningPoint: 'Inspect what went well as carefully as what did not.',
    when: (_s, sim) => sim.overallHappiness >= 70,
    says: (_s, sim) => `${Math.round(sim.overallHappiness)} out of a hundred, and nobody we spoke to was looking for the way out. Whatever you did, do it again.`,
  },
];
