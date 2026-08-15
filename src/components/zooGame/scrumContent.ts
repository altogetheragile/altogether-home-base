// ============= Teaching Scrum while you play it =============
//
// A learner should be able to finish this game able to describe every element of Scrum and what it
// is for. That means the game has to teach, not just be played - so each element gets a card
// answering the four questions a trainer asks of it: why, who, when and how.
//
// This module is content, not behaviour: pure data plus two lookups, so it can be checked against
// docs/SCRUM_MODEL.md and against the Scrum Guide without running the game. Wording follows the
// Guide. Where something is common practice rather than Scrum, the card says so.

export type CardKind = 'artifact' | 'commitment' | 'event' | 'accountability' | 'concept';

export interface ScrumCard {
  id: string;
  kind: CardKind;
  title: string;
  /** One line, for the reference list. */
  summary: string;
  why: string;
  who: string;
  when: string;
  how: string;
  /** For a commitment, the artifact it belongs to. The commitment is not itself an artifact. */
  of?: string;
  /** The Guide's maximum for a one-month Sprint. Shorter Sprints are usually shorter. */
  timebox?: string;
  /** Set when the thing is a common practice rather than part of Scrum. */
  notScrum?: string;
}

/** The one-page introduction: what Scrum is made of, before a single zoo item is built. */
export const SCRUM_INTRO = {
  what: 'Scrum is a lightweight framework that helps people, teams and organisations generate value through adaptive solutions for complex problems. It is deliberately incomplete: it defines only the parts needed to make empiricism work, and leaves how you do the work to you.',
  foundations: [
    { name: 'Empiricism', text: 'Knowledge comes from experience, and decisions are made on what is observed. Its three pillars are transparency, inspection and adaptation.' },
    { name: 'Lean thinking', text: 'Reduce waste and focus on the essential. Work not serving the Product Goal or the Sprint Goal is waste.' },
    { name: 'Iterative and incremental', text: 'Iterate to learn and improve each cycle; deliver in slices to realise value early. Either alone falls short - only iterating delays value, only delivering loses the feedback.' },
  ],
  accountabilities: [
    { name: 'Product Owner', text: 'Accountable for maximising the value of the product, and for the Product Backlog and its order.' },
    { name: 'Developers', text: 'Accountable for creating a usable Increment each Sprint, for quality, and for the Sprint Backlog.' },
    { name: 'Scrum Master', text: 'Accountable for establishing Scrum as defined in the Guide, and for the Scrum Team’s effectiveness. A true leader who serves.' },
  ],
  artifacts: [
    { name: 'Product Backlog', commitment: 'Product Goal', text: 'An emergent, ordered list of what is needed to improve the product. The single source of work.' },
    { name: 'Sprint Backlog', commitment: 'Sprint Goal', text: 'The Sprint Goal, the items selected, and a plan to deliver them. A plan by and for the Developers.' },
    { name: 'Increment', commitment: 'Definition of Done', text: 'A concrete stepping stone toward the Product Goal. Usable, and additive to every Increment before it.' },
  ],
  events: [
    { name: 'The Sprint', text: 'A fixed-length container for all the other events, one month or less.' },
    { name: 'Sprint Planning', text: 'Why this Sprint is valuable, what can be Done, and how it will get done.' },
    { name: 'Daily Scrum', text: 'The Developers inspect progress toward the Sprint Goal and adapt their plan.' },
    { name: 'Sprint Review', text: 'Inspect the Increment with stakeholders and adapt the Product Backlog.' },
    { name: 'Sprint Retrospective', text: 'Inspect how the Scrum Team works, and plan improvements.' },
  ],
  values: [
    { name: 'Commitment', text: 'The Scrum Team commits to achieving its goals and to supporting each other.' },
    { name: 'Focus', text: 'Their primary focus is the work of the Sprint, to make the best possible progress toward those goals.' },
    { name: 'Openness', text: 'The Scrum Team and its stakeholders are open about the work and the challenges.' },
    { name: 'Respect', text: 'Members respect each other as capable, independent people.' },
    { name: 'Courage', text: 'They have the courage to do the right thing and work on tough problems.' },
  ],
} as const;

/** A card per element, in the order a player meets them. */
export const SCRUM_CARDS: ScrumCard[] = [
  {
    id: 'product-goal', kind: 'commitment', of: 'Product Backlog', title: 'The Product Goal',
    summary: 'The Product Backlog’s commitment: the future state of the product you are working toward.',
    why: 'It gives every Sprint something to aim at, so the Backlog is a plan rather than a list. Progress toward it is what the Sprint Review discusses.',
    who: 'The Product Owner is accountable for it, and for making it transparent to everyone.',
    when: 'Before the work starts, and it holds until it is met or abandoned. A product has one Product Goal at a time.',
    how: 'Describe a future state of the product, not a list of features. It can be shaped as an objective and key results, or as an epic user story - the shape is yours.',
  },
  {
    id: 'product-backlog', kind: 'artifact', title: 'The Product Backlog',
    summary: 'An emergent, ordered list of everything known to be needed to improve the product.',
    why: 'It is the single source of work for the Scrum Team. Nothing gets built that is not on it.',
    who: 'The Product Owner orders it. The whole Scrum Team refines it.',
    when: 'Always. It emerges as more is learned, and never stops changing while the product lives.',
    how: 'Order it by value, taking in risk, uncertainty, learning and dependencies. Items near the top are small and clear; items further down can stay vague.',
  },
  {
    // Not an artifact in its own right: an item lives inside the Product Backlog, which is the artifact.
    id: 'pbi', kind: 'concept', title: 'A Product Backlog Item',
    summary: 'One thing that would improve the product, with enough detail to be understood.',
    why: 'Work has to be broken into pieces small enough to finish inside a Sprint, or the Sprint cannot end with something usable.',
    who: 'Anyone can suggest one; the Product Owner decides whether it goes on the Backlog and where.',
    when: 'Whenever a need is discovered, from anywhere - including the Sprint Review.',
    how: 'There is no mandated format. A user story ("as a ... I want ... so that ...") with acceptance criteria is a common one. What matters is that it is understood, valuable, and can be Done in a Sprint.',
    notScrum: 'User stories and story points are common practices, not part of Scrum.',
  },
  {
    id: 'refinement', kind: 'concept', title: 'Product Backlog Refinement',
    summary: 'Breaking items down and adding detail, so the top of the Backlog is ready.',
    why: 'Sprint Planning cannot forecast what nobody understands. Refinement is what makes items ready to be selected.',
    who: 'The whole Scrum Team. The Developers who will do the work are responsible for the sizing; the Product Owner helps them understand and select trade-offs.',
    when: 'Ongoing, during the Sprint, for Sprints still to come. It is not an event, and there is no gap between Sprints for it to happen in.',
    how: 'Split what is too big, add description and acceptance criteria, order by value, and size it. Keep a couple of Sprints ready ahead of you: detailed analysis of work you may never build is waste.',
  },
  {
    id: 'definition-of-done', kind: 'commitment', of: 'Increment', title: 'The Definition of Done',
    summary: 'The Increment’s commitment: what "finished" means for this product.',
    why: 'Without a shared meaning of Done, nobody can tell what has actually been delivered, and unfinished work piles up invisibly.',
    who: 'The Scrum Team, unless the organisation has a standard, which is then the minimum.',
    when: 'Agreed before the first Increment, and adapted at the Sprint Retrospective.',
    how: 'Write the quality bar every item must meet. An item that does not meet it is not released and is not presented at the Review; it goes back to the Product Backlog.',
  },
  {
    id: 'sprint', kind: 'event', title: 'The Sprint',
    summary: 'The fixed-length container for all the other events.',
    why: 'A regular, unchanging rhythm limits risk to one Sprint’s worth of work and makes progress inspectable.',
    who: 'The whole Scrum Team.',
    when: 'One month or less, and a new one starts immediately after the last. The length is agreed once and changed only at a Retrospective.',
    how: 'Scope may be renegotiated with the Product Owner as more is learned, but nothing may endanger the Sprint Goal or quality. A Sprint is never extended to finish work. It can be cancelled if the Sprint Goal becomes obsolete, and only the Product Owner can do that.',
    timebox: 'One month or less',
  },
  {
    id: 'sprint-planning', kind: 'event', title: 'Sprint Planning',
    summary: 'Three topics: why this Sprint is valuable, what can be Done, and how.',
    why: 'It starts the Sprint by laying out the work to be done, and produces the Sprint Backlog.',
    who: 'The whole Scrum Team. The Scrum Master typically facilitates; others may be invited for advice.',
    when: 'At the start of every Sprint.',
    how: 'Topic one: the Product Owner proposes how the product could increase in value, and the Scrum Team defines a Sprint Goal together. Topic two: the Developers select items they forecast they can finish. Topic three: the Developers plan how, in as much detail as they need. Sizing and splitting belong to refinement, not here.',
    timebox: 'Up to 8 hours for a one-month Sprint, usually shorter for shorter Sprints',
  },
  {
    id: 'sprint-goal', kind: 'commitment', of: 'Sprint Backlog', title: 'The Sprint Goal',
    summary: 'The Sprint Backlog’s commitment: the single objective for the Sprint.',
    why: 'It gives coherence and focus, so the Developers work together on one thing rather than separate errands. It is what you protect when scope has to flex.',
    who: 'The whole Scrum Team defines it during Sprint Planning. It is a commitment by the Developers.',
    when: 'Created in topic one, and finalised before Sprint Planning ends.',
    how: 'State the outcome, not the list of items. Keep it while the Sprint runs: the work can change around it, the Goal does not.',
  },
  {
    id: 'sprint-backlog', kind: 'artifact', title: 'The Sprint Backlog',
    summary: 'The Sprint Goal, the selected items, and the plan to deliver them.',
    why: 'It makes the Sprint’s work visible in real time, so progress can be inspected every day.',
    who: 'A plan by and for the Developers. They own it and update it as they learn.',
    when: 'Created at Sprint Planning, and changed throughout the Sprint.',
    how: 'Enough detail that progress can be inspected at the Daily Scrum. As more is learned, the Developers add, remove and reshape the work, without changing the Sprint Goal.',
  },
  {
    id: 'daily-scrum', kind: 'event', title: 'The Daily Scrum',
    summary: 'A short daily inspection of progress toward the Sprint Goal.',
    why: 'To inspect progress and adapt the plan for the day, creating focus and improving self-management.',
    who: 'The Developers. Others may attend, but it is not a status report to anyone.',
    when: 'Every day of the Sprint, at the same time and place.',
    how: 'The Developers choose the structure. Impediments are surfaced here and removed outside it. The Scrum Master is accountable for it happening, not for running it.',
    timebox: '15 minutes',
  },
  {
    id: 'increment', kind: 'artifact', title: 'The Increment',
    summary: 'A usable stepping stone toward the Product Goal.',
    why: 'The entire point of a Sprint is to produce something usable. Value is only real once it is in someone’s hands.',
    who: 'The Developers create it; the Product Owner decides when it is released.',
    when: 'An Increment is born the moment an item meets the Definition of Done. There may be several in one Sprint.',
    how: 'It must be usable and additive to every Increment before it. It can be released during the Sprint: the Sprint Review is not a gate to releasing value.',
  },
  {
    id: 'sprint-review', kind: 'event', title: 'The Sprint Review',
    summary: 'Inspect the Increment with stakeholders, and adapt the Product Backlog.',
    why: 'To inspect the outcome of the Sprint and work out what to do next, with the people the product is for.',
    who: 'The Scrum Team and the stakeholders they invite.',
    when: 'At the end of the Sprint, before the Retrospective.',
    how: 'There is no mandated format. A common pattern: progress toward the Product Goal, the Sprint Goal and why it mattered, a demonstration inviting feedback, how the Sprint went, and a look ahead. It is a working session, not a presentation, and what comes out of it can change the Product Backlog.',
    timebox: 'Up to 4 hours for a one-month Sprint',
  },
  {
    id: 'sprint-retrospective', kind: 'event', title: 'The Sprint Retrospective',
    summary: 'Inspect how the Scrum Team works, and plan improvements.',
    why: 'To increase quality and effectiveness. It is where the way of working itself gets better.',
    who: 'The Scrum Team.',
    when: 'At the end of the Sprint, after the Review, closing the Sprint.',
    how: 'Inspect individuals, interactions, process, tools and the Definition of Done. Discuss what went well, what did not, and how problems were solved. Pick the most helpful improvements and actually do them.',
    timebox: 'Up to 3 hours for a one-month Sprint',
  },
  {
    id: 'product-owner', kind: 'accountability', title: 'The Product Owner',
    summary: 'Accountable for maximising the value of the product.',
    why: 'One person has to be able to decide what is worth building, or ordering the work becomes a committee.',
    who: 'One person, not a committee. They may delegate the work, but they remain accountable.',
    when: 'Throughout. Their decisions are visible in the Product Backlog’s content and order.',
    how: 'Develop and communicate the Product Goal, create and order Product Backlog items, and make sure the Backlog is transparent. For them to succeed, the whole organisation must respect their decisions.',
  },
  {
    id: 'developers', kind: 'accountability', title: 'The Developers',
    summary: 'Accountable for creating a usable Increment each Sprint.',
    why: 'The people doing the work are the people best placed to plan and size it.',
    who: 'Everyone doing the work, whatever their speciality. Cross-functional and self-managing.',
    when: 'Every Sprint.',
    how: 'Create the plan for the Sprint, instil quality by adhering to the Definition of Done, adapt the plan daily toward the Sprint Goal, and hold each other accountable as professionals.',
  },
  {
    id: 'scrum-master', kind: 'accountability', title: 'The Scrum Master',
    summary: 'Accountable for Scrum being understood and enacted, and for the team’s effectiveness.',
    why: 'Someone has to serve the team and the organisation in making this work, without taking the work over.',
    who: 'A true leader who serves the Scrum Team, the Product Owner and the organisation.',
    when: 'Throughout.',
    how: 'Coach self-management and cross-functionality, help focus on valuable Increments, cause impediments to be removed, and ensure the events happen and are productive. They do not assign work, and they are not a project manager.',
  },
  {
    id: 'empiricism', kind: 'concept', title: 'Empiricism',
    summary: 'Decisions are made on what is observed, not on what was assumed.',
    why: 'Product development is complex: more is unknown than known, so a plan made up front will be wrong. Empiricism is how you steer anyway.',
    who: 'Everyone. It only works if people are honest about what is really happening.',
    when: 'Continuously, with each event a formal opportunity to inspect and adapt.',
    how: 'Three pillars. Transparency: the work and the state of it are visible. Inspection: the artifacts and progress are checked often. Adaptation: what is learned changes what happens next. Transparency needs trust and courage, which is why the Scrum Values matter.',
  },
];

export const cardFor = (id: string): ScrumCard | undefined => SCRUM_CARDS.find((c) => c.id === id);

/** The cards worth showing when a player first reaches each phase of the game. */
export const CARDS_BY_PHASE: Record<string, string[]> = {
  // The Product Goal is set on the opening screen, so it is explained there rather than later.
  intro: ['product-goal'],
  refine: ['product-backlog', 'pbi', 'refinement', 'definition-of-done'],
  planning: ['sprint-planning', 'sprint-goal', 'sprint-backlog'],
  sprint: ['sprint', 'daily-scrum', 'increment', 'developers'],
  review: ['sprint-review', 'product-owner'],
  retro: ['sprint-retrospective', 'scrum-master'],
};
