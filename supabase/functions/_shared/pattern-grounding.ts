// Pure grounding helpers for the Pattern Builder. No Deno/Node-specific imports,
// so this is shared by the recommend-pattern edge function and unit tests.
//
// The contract: the model may only reference catalogue ids; nothing it invents
// may reach the user. Steps with unknown ids are dropped; ids must never appear
// in user-facing prose (diagnosis, rationale, cautions).

export interface RawStep {
  order?: number;
  horizon?: string | null;
  isa?: string | null;
  artifactId?: string;
  techniqueIds?: string[];
  rationale?: string;
}

export interface CleanStep {
  order: number;
  horizon: string | null;
  isa: string | null;
  artifactId: string;
  techniqueIds: string[];
  rationale: string;
}

// ISA-O3 artifact slugs always start with one of these horizon prefixes.
const ARTIFACT_SLUG_RE = /\b(?:org|coord|team)-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Drop any step whose artifactId is not in the catalogue; drop unknown
// techniqueIds; keep order stable.
export function validateSteps(
  steps: unknown,
  artifactIds: Set<string>,
  techniqueIds: Set<string>,
): CleanStep[] {
  return (Array.isArray(steps) ? steps : ([] as RawStep[]))
    .filter((s: RawStep) => s && typeof s.artifactId === 'string' && artifactIds.has(s.artifactId))
    .map((s: RawStep, i: number) => ({
      order: typeof s.order === 'number' ? s.order : i + 1,
      horizon: s.horizon ?? null,
      isa: s.isa ?? null,
      artifactId: s.artifactId as string,
      techniqueIds: (Array.isArray(s.techniqueIds) ? s.techniqueIds : []).filter(
        (id) => typeof id === 'string' && techniqueIds.has(id),
      ),
      rationale: typeof s.rationale === 'string' ? s.rationale : '',
    }))
    .sort((a, b) => a.order - b.order);
}

// Replace any known id token in prose with its display name, then strip any
// remaining artifact-slug-shaped tokens (invalid/invented). Leaves ordinary
// hyphenated English (e.g. "sprint-level") untouched.
export function sanitizeProse(text: string, idToName: Map<string, string>): string {
  if (!text) return '';
  let out = text;

  for (const [id, name] of idToName) {
    const re = new RegExp(`(^|[^a-z0-9-])${escapeRegExp(id)}(?![a-z0-9-])`, 'gi');
    out = out.replace(re, (_m, pre) => `${pre}${name}`);
  }

  out = out.replace(ARTIFACT_SLUG_RE, '');

  // Tidy artefacts of removal: empty parens, doubled spaces, stray space before punctuation.
  return out
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Find leaked ids in prose: exact known ids OR anything shaped like an artifact
// slug. After sanitizeProse this must be empty. Used by the guard and tests.
export function findLeakedIds(text: string, knownIds: Set<string>): string[] {
  if (!text) return [];
  const found = new Set<string>();

  for (const id of knownIds) {
    const re = new RegExp(`(^|[^a-z0-9-])${escapeRegExp(id)}(?![a-z0-9-])`, 'i');
    if (re.test(text)) found.add(id);
  }
  for (const m of text.matchAll(ARTIFACT_SLUG_RE)) found.add(m[0]);

  return [...found];
}
