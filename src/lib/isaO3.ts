// ISA-O3 framework vocabulary, shared by the admin editor, the knowledge-base
// data layer, and validation. Keep these in sync with the zod schema in
// src/schemas/knowledgeItem.ts and the migration that seeds the columns.

export const HORIZONS = ['Organisation', 'Coordination', 'Team'] as const;
export type Horizon = (typeof HORIZONS)[number];

export const ISA = ['Intent', 'Scope', 'Approach'] as const;
export type Isa = (typeof ISA)[number];

export const LAYERS = ['Anchoring', 'Iterative', 'Evidence'] as const;
export type Layer = (typeof LAYERS)[number];

export const KINDS = ['Element', 'Artifact'] as const;
export type Kind = (typeof KINDS)[number];

export const PERSPECTIVES = ['who', 'what', 'when', 'where', 'why', 'how'] as const;
export type Perspective = (typeof PERSPECTIVES)[number];

export interface Component {
  name: string;
  question: string;
  perspective: Perspective | '';
}

// Artifact slugs encode their horizon as a prefix (org-, coord-, team-).
const SLUG_HORIZON: Record<string, Horizon> = {
  org: 'Organisation',
  coord: 'Coordination',
  team: 'Team',
};

export function horizonFromSlug(slug: string): Horizon | null {
  const prefix = slug.split('-')[0];
  return SLUG_HORIZON[prefix] ?? null;
}
