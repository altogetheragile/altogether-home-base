// Pathways Registry — the declarative source of truth for "Choose your pathway"
// (VISION_TO_VALUE.md Appendix C). Two axes curate a recommended tool sequence:
//   context (what you're doing) x method (how your team delivers).
// The PathwaysPicker renders straight from this; nothing about the matrix should
// live in JSX. In the spirit of the Pipeline Registry (pipeline.ts) and the
// Prioritisation Schemes (prioritisationSchemes.ts): add a context, a method, or
// a step here and every surface follows.
//
// Recommend, do not gate. Every step is changeable later and Skip is always
// available, so `recommended: false` marks an optional step, not a locked one.

import {
  Sprout, Package, TrendingUp, ListChecks,
  Kanban, RotateCw, CalendarClock, Timer, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { toolByKey } from './pipeline';
import type { SchemeId } from './prioritisationSchemes';

export type PathwayContextKey = 'new_business' | 'new_product' | 'improve' | 'backlog';
export type PathwayMethodKey = 'kanban' | 'scrum' | 'agilepm' | 'dsdm' | 'none';

/** One tool in a context's base sequence. `toolKey` links to the Pipeline
 *  Registry (pipeline.ts) when a real tool exists; when it's absent the step is
 *  a planned tool (e.g. the true Story Map) and renders as a label only. */
interface BaseStepDef {
  name: string;
  toolKey?: string;
}

export interface PathwayContext {
  key: PathwayContextKey;
  title: string;
  desc: string;
  Icon: LucideIcon;
  /** The recommended tools for this context, in order, before prioritisation. */
  base: BaseStepDef[];
}

export interface PathwayMethod {
  key: PathwayMethodKey;
  title: string;
  /** Delivery rhythm shown on the card (e.g. "Sprints", "Continuous flow"). */
  cadence: string;
  /** Short badges on the card (e.g. the prioritisation vocabulary). */
  tags: string[];
  /** Label for the prioritisation step this method inserts. */
  prioStep: string;
  /** Prioritisation scheme (prioritisationSchemes.ts) this method backs. */
  scheme: SchemeId;
  Icon: LucideIcon;
  /** Forward hook for course-to-tool linking (Appendix C): the capstone exam
   *  case a framework pathway hands the learner into. Only frameworks with a
   *  worked template set this today. */
  capstoneExamSlug?: string;
}

/** A resolved step in an assembled pathway. `route`, when present, is where the
 *  step's tool lives — resolved from the Pipeline Registry or set explicitly. */
export interface PathwayStep {
  name: string;
  recommended: boolean;
  toolKey?: string;
  route?: string;
  scheme?: SchemeId;
}

export interface PathwaySelection {
  context: PathwayContextKey;
  method: PathwayMethodKey;
  steps: PathwayStep[];
}

// --- Axis 1: Context (what you're doing) ---
export const PATHWAY_CONTEXTS: PathwayContext[] = [
  {
    key: 'new_business',
    title: 'New Business',
    desc: 'Validate a brand-new venture or offering.',
    Icon: Sprout,
    base: [
      { name: 'Product Vision', toolKey: 'product-vision' },
      { name: 'Personas', toolKey: 'persona' },
      { name: 'Impact Map', toolKey: 'impact-map' },
      { name: 'Backlog', toolKey: 'product-backlog' },
    ],
  },
  {
    key: 'new_product',
    title: 'New Product',
    desc: 'Build a new product for an existing business.',
    Icon: Package,
    base: [
      { name: 'Product Vision', toolKey: 'product-vision' },
      { name: 'Personas', toolKey: 'persona' },
      // Story Map is planned (VISION_TO_VALUE.md Appendix C, C.4); today's User
      // Story Canvas is single-story, so no toolKey yet.
      { name: 'Story Map' },
      { name: 'Backlog', toolKey: 'product-backlog' },
    ],
  },
  {
    key: 'improve',
    title: 'Improve an Existing Product',
    desc: 'Enhance something already in market.',
    Icon: TrendingUp,
    base: [
      { name: 'Personas', toolKey: 'persona' },
      { name: 'Impact Map', toolKey: 'impact-map' },
      { name: 'Backlog', toolKey: 'product-backlog' },
    ],
  },
  {
    key: 'backlog',
    title: 'Just Manage a Backlog',
    desc: 'Organise and prioritise existing work.',
    Icon: ListChecks,
    base: [{ name: 'Backlog', toolKey: 'product-backlog' }],
  },
];

// --- Axis 2: Method (how your team delivers) ---
// cadence is the delivery rhythm; the tag is the prioritisation vocabulary.
// AgilePM v3 (latest) renamed the delivery timebox to "Sprint"; classic DSDM
// (AgilePM v2) uses "Timebox". Both use MoSCoW. Offer both.
export const PATHWAY_METHODS: PathwayMethod[] = [
  { key: 'kanban', title: 'Kanban', cadence: 'Continuous flow', tags: ['WSJF'], prioStep: 'Prioritise · WSJF', scheme: 'wsjf', Icon: Kanban },
  { key: 'scrum', title: 'Scrum', cadence: 'Sprints', tags: ['Ordered backlog'], prioStep: 'Sprint Backlog', scheme: 'simple', Icon: RotateCw },
  { key: 'agilepm', title: 'AgilePM v3', cadence: 'Sprints', tags: ['MoSCoW'], prioStep: 'Sprint · MoSCoW', scheme: 'moscow', Icon: CalendarClock, capstoneExamSlug: 'agilepm-practitioner-paper-1' },
  { key: 'dsdm', title: 'DSDM Classic', cadence: 'Timeboxes', tags: ['MoSCoW'], prioStep: 'Timebox · MoSCoW', scheme: 'moscow', Icon: Timer },
  { key: 'none', title: 'No framework', cadence: 'Ad hoc', tags: ['Simple priority'], prioStep: 'Prioritise', scheme: 'simple', Icon: SlidersHorizontal },
];

// Fixed tail every pathway shares after prioritisation: run it, watch flow,
// review value. Simulate points at the (currently preview) Flow Simulator.
const TAIL_STEPS: PathwayStep[] = [
  { name: 'Simulate', recommended: true, route: '/simulator-preview' },
  { name: 'Flow metrics', recommended: false },
  { name: 'Outcomes review', recommended: false, toolKey: 'benefits-scorecard' },
];

export const contextByKey = (key: PathwayContextKey): PathwayContext | undefined =>
  PATHWAY_CONTEXTS.find((c) => c.key === key);

export const methodByKey = (key: PathwayMethodKey): PathwayMethod | undefined =>
  PATHWAY_METHODS.find((m) => m.key === key);

/** Resolve a step's route from its tool key (Pipeline Registry) unless one is
 *  set explicitly. Planned tools (no key, no route) stay label-only. */
const withRoute = (step: PathwayStep): PathwayStep => {
  if (step.route || !step.toolKey) return step;
  const tool = toolByKey(step.toolKey);
  return tool ? { ...step, route: tool.route } : step;
};

/** Assemble the recommended tool sequence for a context (and optional method).
 *  Base tools (recommended) -> prioritisation (recommended once a method is
 *  chosen, else an optional generic "Prioritise") -> shared tail. */
export function buildPathway(
  context: PathwayContextKey | null,
  method: PathwayMethodKey | null,
): PathwayStep[] {
  const ctx = context ? contextByKey(context) : undefined;
  if (!ctx) return [];

  const steps: PathwayStep[] = ctx.base.map((b) => ({
    name: b.name,
    recommended: true,
    toolKey: b.toolKey,
  }));

  const m = method ? methodByKey(method) : undefined;
  steps.push(
    m
      ? { name: m.prioStep, recommended: true, toolKey: 'product-backlog', scheme: m.scheme }
      : { name: 'Prioritise', recommended: false, toolKey: 'product-backlog' },
  );

  steps.push(...TAIL_STEPS);
  return steps.map(withRoute);
}
