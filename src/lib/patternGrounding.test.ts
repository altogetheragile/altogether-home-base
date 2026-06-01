import { describe, it, expect } from 'vitest';
import {
  validateSteps,
  sanitizeProse,
  findLeakedIds,
} from '../../supabase/functions/_shared/pattern-grounding';

// Mirrors the Pattern Builder's grounding contract: only catalogue ids survive
// in steps, and no id/slug ever reaches user-facing prose.
const artifactIds = new Set(['coord-purpose', 'coord-goal', 'org-goals']);
const techniqueIds = new Set(['okrs', 'story-mapping']);
const idToName = new Map<string, string>([
  ['coord-purpose', 'Purpose'],
  ['coord-goal', 'Goal'],
  ['org-goals', 'Goals'],
  ['okrs', 'OKRs'],
  ['story-mapping', 'Story Mapping'],
]);
const knownIds = new Set<string>([...artifactIds, ...techniqueIds]);

describe('validateSteps', () => {
  it('drops steps with an unknown artifactId and unknown techniqueIds', () => {
    const steps = [
      { order: 1, artifactId: 'coord-purpose', techniqueIds: ['okrs', 'made-up-technique'] },
      { order: 2, artifactId: 'invented-artifact', techniqueIds: ['story-mapping'] },
    ];
    const clean = validateSteps(steps, artifactIds, techniqueIds);
    expect(clean).toHaveLength(1);
    expect(clean[0].artifactId).toBe('coord-purpose');
    expect(clean[0].techniqueIds).toEqual(['okrs']); // hallucinated technique dropped
  });

  it('handles non-array input safely', () => {
    expect(validateSteps(undefined, artifactIds, techniqueIds)).toEqual([]);
  });
});

describe('sanitizeProse', () => {
  it('replaces known ids with names, strips invented slugs, keeps ordinary hyphenated words', () => {
    const text = 'Start with coord-purpose, then use org-nonexistent. Avoid sprint-level rework.';
    const out = sanitizeProse(text, idToName);
    expect(out).toContain('Purpose');
    expect(out).not.toContain('coord-purpose');
    expect(out).not.toContain('org-nonexistent');
    expect(out).toContain('sprint-level'); // normal English untouched
    expect(findLeakedIds(out, knownIds)).toEqual([]);
  });
});

describe('grounding guarantee', () => {
  it('leaves no ungrounded id anywhere after shaping', () => {
    const diagnosis = 'The org-goals are unclear and coord-team-topology is missing.';
    const cautions = ['Do not skip coord-purpose', 'Watch sprint-level scope creep'];
    const cleanDiagnosis = sanitizeProse(diagnosis, idToName);
    const cleanCautions = cautions.map((c) => sanitizeProse(c, idToName));

    expect(findLeakedIds(cleanDiagnosis, knownIds)).toEqual([]);
    for (const c of cleanCautions) {
      expect(findLeakedIds(c, knownIds)).toEqual([]);
    }
    // org-goals is a known id -> rendered as its name
    expect(cleanDiagnosis).toContain('Goals');
    // coord-team-topology is not in this catalogue -> stripped as an invented slug
    expect(cleanDiagnosis).not.toContain('coord-team-topology');
  });
});
