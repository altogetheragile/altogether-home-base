import type { Criterion, Story, ScrumState } from './types';

/** Working days in a sim Sprint. Short so several Sprints stay playable without
 *  click fatigue; the first Sprint is felt day by day, later ones zoom out. */
export const SPRINT_LENGTH = 5;

/** The Product Goal - the north star the Product Backlog is ordered toward. */
export const PRODUCT_GOAL = 'Launch a booking experience customers love and trust.';

/** A domain-neutral default Definition of Done (the Increment's commitment).
 *  Editable later, like the Flow game's exit criteria. */
export function defaultDefinitionOfDone(): Criterion[] {
  return [
    { id: 'dod-reviewed', label: 'Reviewed by someone else' },
    { id: 'dod-accepted', label: 'Meets its acceptance criteria' },
    { id: 'dod-releasable', label: 'Releasable - nothing left to finish' },
  ];
}

/** A starting Product Backlog, ordered by value. Story points vary so planning
 *  is a real forecasting decision. Deterministic (fixed list, not RNG). */
export const PRODUCT_BACKLOG: Omit<Story, 'status' | 'sprintNumber'>[] = [
  { id: 's1', title: 'Browse available slots', points: 5, value: 8 },
  { id: 's2', title: 'Book a slot', points: 8, value: 10 },
  { id: 's3', title: 'Confirmation email', points: 3, value: 6 },
  { id: 's4', title: 'Reschedule a booking', points: 5, value: 7 },
  { id: 's5', title: 'Cancel a booking', points: 3, value: 5 },
  { id: 's6', title: 'Reminders before the slot', points: 5, value: 6 },
  { id: 's7', title: 'Pay for a booking', points: 8, value: 9 },
  { id: 's8', title: 'Manage my bookings', points: 5, value: 6 },
  { id: 's9', title: 'Waitlist for a full slot', points: 8, value: 4 },
  { id: 's10', title: 'Accessibility pass', points: 5, value: 7 },
  { id: 's11', title: 'Admin: view all bookings', points: 5, value: 5 },
  { id: 's12', title: 'Analytics dashboard', points: 8, value: 3 },
];

/** The starting game state: all stories in the Product Backlog, no Sprints yet. */
export function initialScrumState(): ScrumState {
  return {
    phase: 'intro',
    productGoal: PRODUCT_GOAL,
    definitionOfDone: defaultDefinitionOfDone(),
    productBacklog: PRODUCT_BACKLOG.map((s) => ({ ...s, status: 'backlog', sprintNumber: null })),
    sprints: [],
    currentSprint: null,
    velocity: [],
    sprintLength: SPRINT_LENGTH,
  };
}

/** Total points and value remaining in the backlog - a quick read on scope. */
export const totalPoints = (stories: Story[]): number => stories.reduce((n, s) => n + s.points, 0);
export const totalValue = (stories: Story[]): number => stories.reduce((n, s) => n + s.value, 0);
