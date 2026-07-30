import type { Criterion } from './types';

// ============= Themes: one engine, many skins =============
//
// A theme is pure data. The engine knows nothing about booking apps or theme
// parks - it only knows a Product Goal, a Definition of Done, and a backlog of
// items with value and effort. Skinning the sim (Booking, Theme Park, Rocket...)
// is a matter of swapping the ThemeConfig. This slice extracts the current
// booking app into the first theme; later slices add stakeholders, event cards,
// meters and scoring per the sim-engine model.

export interface BacklogItem {
  id: string;
  name: string;
  description?: string;
  /** Business value delivered when Done (drives the Product Goal). */
  value: number;
  /** The real effort the item takes to build (its true size). When `unsized` is
   *  set this is hidden from the player until the team estimates it. */
  effort: number;
  /** Start this item un-estimated, so the team must size it (relative estimation)
   *  before it is Ready. Omit for items that arrive already sized. */
  unsized?: boolean;
  /** Key the build canvas uses to draw this component as it is completed. */
  visualKey: string;
  /** Which stakeholder agendas this item serves (used by later slices). */
  tags?: string[];
  // Reserved for later slices (risk rolls, dependencies, tech debt, finale scoring):
  critical?: boolean;
  risk?: number;
  dependencies?: string[];
  debtSensitivity?: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  agenda: string;
  /** Weight per item tag (0-1). At the Review, satisfaction moves by the value of
   *  newly Done items multiplied by these weights. Conflicting weights across
   *  stakeholders create the prioritisation tension the Product Owner navigates. */
  tagWeights: Record<string, number>;
  /** Satisfaction lost per Sprint if nothing on their agenda shipped. */
  neglectDecay: number;
}

/** Effects a choice can have with the current mechanics. Meters (morale, tech
 *  debt, capacity) arrive in a later slice; today a choice can shift stakeholder
 *  satisfaction and/or force a Product Backlog item into the Sprint. */
export interface EventEffects {
  satisfaction?: Record<string, number>;
  /** Force this backlog item into the running Sprint (scope injection). */
  scopeInjection?: string;
}

export interface EventChoice {
  label: string;
  effects: EventEffects;
  /** One-line debrief shown after choosing. There is no right answer. */
  lesson: string;
}

export interface EventCard {
  id: string;
  name: string;
  narrative: string;
  choices: EventChoice[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  /** What the team is building, in the theme's language. */
  buildMetaphor: string;
  /** What "value" is called in this theme. */
  valueLabel: string;
  /** The Product Goal the backlog is ordered toward. */
  productGoal: string;
  /** The starting Definition of Done (editable in play). */
  definitionOfDone: Criterion[];
  /** The starting Product Backlog, ordered by value. */
  items: BacklogItem[];
  /** Stakeholders whose (conflicting) agendas the Product Owner balances. */
  stakeholders: Stakeholder[];
  /** Mid-Sprint dilemmas - drawn occasionally, never with a right answer. */
  events: EventCard[];
}

/** THEME 1 - the booking platform the sim shipped with, now expressed as data. */
export const bookingTheme: ThemeConfig = {
  id: 'booking',
  name: 'Booking Platform',
  buildMetaphor: 'Build a booking experience customers love and trust',
  valueLabel: 'Customer value',
  productGoal: 'Launch a booking experience customers love and trust.',
  definitionOfDone: [
    { id: 'dod-reviewed', label: 'Reviewed by someone else' },
    { id: 'dod-accepted', label: 'Meets its acceptance criteria' },
    { id: 'dod-releasable', label: 'Releasable - nothing left to finish' },
  ],
  items: [
    { id: 's1', name: 'Browse available slots', value: 8, effort: 13, visualKey: 'browse', tags: ['discovery'] },
    { id: 's2', name: 'Book a slot', value: 10, effort: 21, visualKey: 'book', tags: ['core'] },
    { id: 's3', name: 'Confirmation email', value: 6, effort: 8, visualKey: 'email', tags: ['core'] },
    { id: 's4', name: 'Reschedule a booking', value: 7, effort: 21, unsized: true, visualKey: 'reschedule', tags: ['manage'] },
    { id: 's5', name: 'Cancel a booking', value: 5, effort: 8, visualKey: 'cancel', tags: ['manage'] },
    { id: 's6', name: 'Reminders before the slot', value: 6, effort: 13, unsized: true, visualKey: 'reminders', tags: ['retention'] },
    { id: 's7', name: 'Pay for a booking', value: 9, effort: 21, visualKey: 'pay', tags: ['revenue'] },
    { id: 's8', name: 'Manage my bookings', value: 6, effort: 21, unsized: true, visualKey: 'manage', tags: ['manage'] },
    { id: 's9', name: 'Waitlist for a full slot', value: 4, effort: 13, visualKey: 'waitlist', tags: ['retention'] },
    { id: 's10', name: 'Accessibility pass', value: 7, effort: 13, unsized: true, visualKey: 'accessibility', tags: ['quality'] },
    { id: 's11', name: 'Admin: view all bookings', value: 5, effort: 21, visualKey: 'admin', tags: ['ops'] },
    { id: 's12', name: 'Analytics dashboard', value: 3, effort: 21, visualKey: 'analytics', tags: ['ops'] },
  ],
  stakeholders: [
    {
      id: 'customers', name: 'Customers', agenda: 'A smooth booking experience they can trust',
      tagWeights: { core: 1.0, discovery: 0.8, manage: 0.7, retention: 0.6, quality: 0.5, revenue: 0.1, ops: 0.0 },
      neglectDecay: 5,
    },
    {
      id: 'business', name: 'The Business', agenda: 'Revenue and growth, sooner rather than later',
      tagWeights: { revenue: 1.0, retention: 0.6, ops: 0.5, core: 0.3, discovery: 0.2, manage: 0.1, quality: 0.0 },
      neglectDecay: 6,
    },
    {
      id: 'trust', name: 'Trust & Compliance', agenda: 'Nothing ships that is not safe and accessible',
      tagWeights: { quality: 1.0, manage: 0.4, ops: 0.4, core: 0.3, revenue: 0.0, discovery: 0.0, retention: 0.0 },
      neglectDecay: 8,
    },
  ],
  events: [
    {
      id: 'a11y-flag', name: 'Accessibility flag',
      narrative: 'Trust & Compliance raise an accessibility gap - a regulator is starting to ask questions.',
      choices: [
        { label: 'Prioritise the accessibility pass now', effects: { satisfaction: { trust: 12, business: -4 }, scopeInjection: 's10' },
          lesson: 'Sometimes a real need reorders the plan - but pulling work in mid-Sprint still costs the team focus.' },
        { label: 'Log it for a future Sprint', effects: { satisfaction: { trust: -8 } },
          lesson: 'Deferring is a valid call - just a bet: cheap now, expensive if it is called in.' },
      ],
    },
    {
      id: 'no-shows', name: 'A wave of no-shows',
      narrative: 'Empty slots are piling up. Customers say a reminder before their booking would help.',
      choices: [
        { label: 'Add reminders this Sprint', effects: { satisfaction: { customers: 10, business: 3 }, scopeInjection: 's6' },
          lesson: 'Responding to real user pain builds trust - within reason, and without abandoning the Sprint Goal.' },
        { label: 'Hold the Sprint Goal, note it in the Backlog', effects: { satisfaction: { customers: -4 } },
          lesson: 'Protecting the Sprint Goal is legitimate; capture the need and order it for later.' },
      ],
    },
    {
      id: 'business-impatient', name: 'The Business wants to see results',
      narrative: 'The Business is frustrated that revenue is not moving and wants the roadmap reshuffled.',
      choices: [
        { label: 'Reassure them and hold the plan', effects: { satisfaction: { business: -6 } },
          lesson: 'Saying no protects focus, but it has a cost - keep stakeholders informed, not just deflected.' },
        { label: 'Promise revenue work next Sprint', effects: { satisfaction: { business: 6, customers: -3 } },
          lesson: 'Committing the next Sprint to one stakeholder eases them now - and boxes the team in later.' },
      ],
    },
    {
      id: 'steady', name: 'A steady day',
      narrative: 'No fires today. The team is heads-down and the board is flowing.',
      choices: [
        { label: 'Keep the focus', effects: {},
          lesson: 'Not every day has drama - steady, boring delivery is exactly what good Sprints look like.' },
      ],
    },
  ],
};

/** THEME 2 - a crewed spaceflight, proving the engine is skin-agnostic. Same
 *  shape as the booking theme (12 items, the same effort mix and un-sized slots so
 *  it plays with the same balance), but a wholly different domain. The stakeholders
 *  pull against each other just as hard: Mission Control wants capability, Crew
 *  Safety wants safety, the Funders want visible science. */
export const missionTheme: ThemeConfig = {
  id: 'mission',
  name: 'Mission: Orbit',
  buildMetaphor: 'Build a spacecraft that reaches orbit',
  valueLabel: 'Mission value',
  productGoal: 'Launch a crewed spacecraft that safely reaches orbit.',
  definitionOfDone: [
    { id: 'dod-reviewed', label: 'Reviewed by another engineer' },
    { id: 'dod-tested', label: 'Passes its test on the stand' },
    { id: 'dod-flightready', label: 'Flight-ready - nothing left to finish' },
  ],
  items: [
    { id: 'm1', name: 'Flight computer', value: 9, effort: 13, visualKey: 'flightComputer', tags: ['avionics'] },
    { id: 'm2', name: 'Main engine', value: 10, effort: 21, visualKey: 'engine', tags: ['propulsion'] },
    { id: 'm3', name: 'Comms array', value: 6, effort: 8, visualKey: 'comms', tags: ['comms'] },
    { id: 'm4', name: 'Life support', value: 8, effort: 21, unsized: true, visualKey: 'lifeSupport', tags: ['crew'] },
    { id: 'm5', name: 'Docking system', value: 5, effort: 8, visualKey: 'docking', tags: ['crew'] },
    { id: 'm6', name: 'Telemetry ground link', value: 6, effort: 13, unsized: true, visualKey: 'telemetry', tags: ['ops'] },
    { id: 'm7', name: 'Guidance and navigation', value: 9, effort: 21, visualKey: 'guidance', tags: ['avionics'] },
    { id: 'm8', name: 'Heat shield', value: 7, effort: 21, unsized: true, visualKey: 'heatShield', tags: ['safety'] },
    { id: 'm9', name: 'Solar power array', value: 6, effort: 13, visualKey: 'power', tags: ['ops'] },
    { id: 'm10', name: 'Launch abort system', value: 7, effort: 13, unsized: true, visualKey: 'abort', tags: ['safety'] },
    { id: 'm11', name: 'Science payload', value: 5, effort: 21, visualKey: 'payload', tags: ['science'] },
    { id: 'm12', name: 'Fuel system', value: 6, effort: 21, visualKey: 'fuel', tags: ['propulsion'] },
  ],
  stakeholders: [
    {
      id: 'mission', name: 'Mission Control', agenda: 'A vehicle that can actually reach orbit',
      tagWeights: { propulsion: 1.0, avionics: 0.9, ops: 0.6, comms: 0.5, safety: 0.4, crew: 0.3, science: 0.2 },
      neglectDecay: 6,
    },
    {
      id: 'crew', name: 'Crew Safety', agenda: 'Nothing flies that risks the crew',
      tagWeights: { safety: 1.0, crew: 1.0, ops: 0.4, avionics: 0.4, propulsion: 0.3, comms: 0.2, science: 0.0 },
      neglectDecay: 8,
    },
    {
      id: 'funders', name: 'The Funders', agenda: 'Visible milestones and science return',
      tagWeights: { science: 1.0, comms: 0.7, ops: 0.5, propulsion: 0.5, avionics: 0.4, crew: 0.1, safety: 0.1 },
      neglectDecay: 6,
    },
  ],
  events: [
    {
      id: 'anomaly-flag', name: 'A pressure anomaly',
      narrative: 'A pressure anomaly shows up in testing. Crew Safety wants the launch abort system brought forward.',
      choices: [
        { label: 'Prioritise the abort system now', effects: { satisfaction: { crew: 12, funders: -4 }, scopeInjection: 'm10' },
          lesson: 'A real safety need can reorder the plan - but pulling work in mid-Sprint still costs the team focus.' },
        { label: 'Log it for a future Sprint', effects: { satisfaction: { crew: -8 } },
          lesson: 'Deferring is a valid call - just a bet: cheap now, expensive if it is called in.' },
      ],
    },
    {
      id: 'comms-gap', name: 'Signal dropouts',
      narrative: 'Ground stations keep losing the signal. Mission Control says a stronger telemetry link would help.',
      choices: [
        { label: 'Add the telemetry link this Sprint', effects: { satisfaction: { mission: 10, funders: 3 }, scopeInjection: 'm6' },
          lesson: 'Responding to a real operational pain builds trust - within reason, and without abandoning the Sprint Goal.' },
        { label: 'Hold the Sprint Goal, note it in the Backlog', effects: { satisfaction: { mission: -4 } },
          lesson: 'Protecting the Sprint Goal is legitimate; capture the need and order it for later.' },
      ],
    },
    {
      id: 'funders-impatient', name: 'The Funders want results',
      narrative: 'The Funders are frustrated there is no science to show yet and want the roadmap reshuffled.',
      choices: [
        { label: 'Reassure them and hold the plan', effects: { satisfaction: { funders: -6 } },
          lesson: 'Saying no protects focus, but it has a cost - keep stakeholders informed, not just deflected.' },
        { label: 'Promise the science payload next Sprint', effects: { satisfaction: { funders: 6, crew: -3 } },
          lesson: 'Committing the next Sprint to one stakeholder eases them now - and boxes the team in later.' },
      ],
    },
    {
      id: 'steady', name: 'A steady day',
      narrative: 'No fires today. The countdown is on schedule and the board is flowing.',
      choices: [
        { label: 'Keep the focus', effects: {},
          lesson: 'Not every day has drama - steady, boring delivery is exactly what good Sprints look like.' },
      ],
    },
  ],
};

/** Every theme the sim can run. Adding one here makes it selectable at the intro
 *  and re-skins the whole game - the engine reads a theme's data, never its name. */
export const THEMES: ThemeConfig[] = [bookingTheme, missionTheme];

/** Resolve a theme by id, defaulting to the booking theme if the id is unknown. */
export const getTheme = (id: string): ThemeConfig =>
  THEMES.find((t) => t.id === id) ?? bookingTheme;

/** The default theme (used where a single theme is needed, e.g. the initial state
 *  before the player has chosen, and the booking-based constants below). */
export const ACTIVE_THEME: ThemeConfig = bookingTheme;
