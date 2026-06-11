// Impact Mapping (Gojko Adzic) data model.
// An impact map is a four-level hierarchy that answers, in order:
//   WHY  -> the goal (a measurable business objective)
//   WHO  -> actors whose behaviour can help or hinder the goal
//   HOW  -> impacts: the behaviour changes we want from each actor
//   WHAT -> deliverables: what we could do to support each impact

import type { CellCoach } from './coaching';

export interface Deliverable {
  id: string;
  label: string;
}

export interface Impact {
  id: string;
  label: string;
  deliverables: Deliverable[];
}

export interface Actor {
  id: string;
  label: string;
  impacts: Impact[];
}

export interface ImpactMap {
  goal: string;
  actors: Actor[];
}

export type ImpactLevel = 'goal' | 'actor' | 'impact' | 'deliverable';

// Coaching metadata used to walk people through the technique, one level at a time.
export const LEVEL_META: Record<ImpactLevel, CellCoach> = {
  goal: {
    tag: 'WHY',
    question: 'What is the goal?',
    help: 'A measurable business objective. Make it specific and time-bound, for example "Grow active users by 20% by Q4". Avoid listing features here.',
    stretch: 'If you achieved this and nothing felt different, how would you know?',
    color: '#004D4D',
  },
  actor: {
    tag: 'WHO',
    question: 'Who can help or hinder the goal?',
    help: 'The people or roles whose behaviour affects the goal. Be concrete: "New visitors", "Returning customers", "Support team".',
    stretch: 'Whose behaviour are you assuming will not change?',
    color: '#1A9090',
  },
  impact: {
    tag: 'HOW',
    question: 'How should their behaviour change?',
    help: 'The impact you want each actor to have, framed as a behaviour change, for example "Sign up faster" or "Return more often". Include impacts that hinder the goal too.',
    stretch: 'Which of these changes would happen anyway, without you?',
    color: '#E08A4E',
  },
  deliverable: {
    tag: 'WHAT',
    question: 'What could we do to support that?',
    help: 'The deliverables, features, or activities that might cause the impact. These are options to test, not commitments.',
    stretch: 'Which of these are you most attached to, and what would tell you to drop it?',
    color: '#9C8A6A',
  },
};

// crypto.randomUUID is available in the app's browser targets (used elsewhere in the canvas code).
const newId = () => crypto.randomUUID();

export const newDeliverable = (label = ''): Deliverable => ({ id: newId(), label });
export const newImpact = (label = ''): Impact => ({ id: newId(), label, deliverables: [] });
export const newActor = (label = ''): Actor => ({ id: newId(), label, impacts: [] });

export const emptyImpactMap = (): ImpactMap => ({ goal: '', actors: [] });

export const exampleImpactMap = (): ImpactMap => ({
  goal: 'Grow weekly active users by 20% by Q4',
  actors: [
    {
      id: newId(),
      label: 'New visitors',
      impacts: [
        {
          id: newId(),
          label: 'Sign up faster',
          deliverables: [
            newDeliverable('One-click social login'),
            newDeliverable('Shorter sign-up form'),
          ],
        },
      ],
    },
    {
      id: newId(),
      label: 'Existing users',
      impacts: [
        {
          id: newId(),
          label: 'Return more often',
          deliverables: [
            newDeliverable('Weekly digest email'),
            newDeliverable('In-app activity reminders'),
          ],
        },
      ],
    },
  ],
});

/** Minimal structural validation for imported JSON. Returns a typed map or null. */
export const parseImpactMap = (raw: unknown): ImpactMap | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.goal !== 'string' || !Array.isArray(obj.actors)) return null;

  const actors: Actor[] = obj.actors.map((a) => {
    const actor = (a ?? {}) as Record<string, unknown>;
    const impacts: Impact[] = Array.isArray(actor.impacts)
      ? actor.impacts.map((i) => {
          const impact = (i ?? {}) as Record<string, unknown>;
          const deliverables: Deliverable[] = Array.isArray(impact.deliverables)
            ? impact.deliverables.map((d) => {
                const del = (d ?? {}) as Record<string, unknown>;
                return { id: typeof del.id === 'string' ? del.id : newId(), label: String(del.label ?? '') };
              })
            : [];
          return { id: typeof impact.id === 'string' ? impact.id : newId(), label: String(impact.label ?? ''), deliverables };
        })
      : [];
    return { id: typeof actor.id === 'string' ? actor.id : newId(), label: String(actor.label ?? ''), impacts };
  });

  return { goal: obj.goal, actors };
};
