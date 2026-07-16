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
  /** Effort in points against Sprint capacity. */
  effort: number;
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
    { id: 's4', name: 'Reschedule a booking', value: 7, effort: 21, visualKey: 'reschedule', tags: ['manage'] },
    { id: 's5', name: 'Cancel a booking', value: 5, effort: 8, visualKey: 'cancel', tags: ['manage'] },
    { id: 's6', name: 'Reminders before the slot', value: 6, effort: 13, visualKey: 'reminders', tags: ['retention'] },
    { id: 's7', name: 'Pay for a booking', value: 9, effort: 21, visualKey: 'pay', tags: ['revenue'] },
    { id: 's8', name: 'Manage my bookings', value: 6, effort: 21, visualKey: 'manage', tags: ['manage'] },
    { id: 's9', name: 'Waitlist for a full slot', value: 4, effort: 13, visualKey: 'waitlist', tags: ['retention'] },
    { id: 's10', name: 'Accessibility pass', value: 7, effort: 13, visualKey: 'accessibility', tags: ['quality'] },
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
};

/** The theme the sim currently runs. Swapping this (or making it selectable)
 *  re-skins the whole game. */
export const ACTIVE_THEME: ThemeConfig = bookingTheme;

// (deploy nudge: force a fresh production build of the current main)
