// Persona Studio model (see docs/VISION_TO_VALUE.md 6.8). Coached through the
// "named character" and Jobs to Be Done questions. The stretch "Who would be
// inconvenienced by this succeeding?" lives on the goals field.

import type { CellCoach } from './coaching';

export interface Persona {
  name: string;
  role: string;
  context: string;
  goals: string;
  pains: string;
  behaviours: string;
  quote: string;
}

export type PersonaField = keyof Persona;

export const PERSONA_FIELDS: { key: PersonaField; coach: CellCoach }[] = [
  { key: 'name', coach: { tag: 'NAME', question: 'Who is this person? Give them a name.', help: 'A memorable, realistic name makes the persona a concrete "named character".', stretch: 'Is this a real type of person you have met, or one you wish existed?', color: '#004D4D' } },
  { key: 'role', coach: { tag: 'ROLE', question: 'What is their role or situation?', help: 'Their job, role, or the situation that brings them to your product.', stretch: 'What part of their role do they find hardest to admit?', color: '#1A9090' } },
  { key: 'context', coach: { tag: 'CONTEXT', question: 'What is their context?', help: 'Where, when and how they meet the need; their environment and constraints.', stretch: 'What in their day quietly works against using this?', color: '#3F8080' } },
  { key: 'goals', coach: { tag: 'GOALS', question: 'What are they trying to get done?', help: 'The jobs they are trying to do, in their own terms (Jobs to Be Done).', stretch: 'Who would be inconvenienced by this person succeeding?', color: '#E08A4E' } },
  { key: 'pains', coach: { tag: 'PAINS', question: 'What frustrates or blocks them?', help: 'The pains, obstacles and frustrations in getting the job done.', stretch: 'Which pain do they complain about but secretly tolerate?', color: '#C2603A' } },
  { key: 'behaviours', coach: { tag: 'BEHAVIOURS', question: 'How do they behave?', help: 'Habits, tools and behaviours relevant to the job.', stretch: 'What do they say they do that differs from what they actually do?', color: '#9C8A6A' } },
  { key: 'quote', coach: { tag: 'QUOTE', question: 'What might they say?', help: 'A short line in their own voice that captures their attitude.', stretch: 'Would they say this out loud, or only think it?', color: '#6B5FCC' } },
];

export const FIELD_LABELS: Record<PersonaField, string> = {
  name: 'Name',
  role: 'Role',
  context: 'Context',
  goals: 'Goals',
  pains: 'Pains',
  behaviours: 'Behaviours',
  quote: 'Quote',
};

export const emptyPersona = (): Persona => ({ name: '', role: '', context: '', goals: '', pains: '', behaviours: '', quote: '' });

export const examplePersona = (): Persona => ({
  name: 'Priya, the time-poor product lead',
  role: 'Product lead at a mid-size SaaS company',
  context: 'Juggling delivery and stakeholder demands, mostly on mobile between meetings',
  goals: 'Show a credible link from strategy to delivery without heavy tooling',
  pains: 'Spreadsheets drift from reality; hard to show outcomes, not just output',
  behaviours: 'Lives in Slack and a backlog tool; skims, rarely reads long documents',
  quote: 'I do not need another tool, I need to see whether any of this is working.',
});

export const parsePersona = (raw: unknown): Persona | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    name: String(o.name ?? ''),
    role: String(o.role ?? ''),
    context: String(o.context ?? ''),
    goals: String(o.goals ?? ''),
    pains: String(o.pains ?? ''),
    behaviours: String(o.behaviours ?? ''),
    quote: String(o.quote ?? ''),
  };
};
