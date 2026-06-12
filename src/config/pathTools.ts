// Maps a recommend-pattern step (ISA-O3 catalogue slugs) to a pipeline tool, for
// Suggest a Path (VISION_TO_VALUE.md 6.9a). Prefer a technique match (more
// specific), then fall back to the catalogue artifact. A step that resolves to no
// tool is shown as guidance, not a dead button, so keep this conservative.

export interface PathTool {
  route: string;
  name: string;
}

const BY_TECHNIQUE: Record<string, PathTool> = {
  'product-vision-board': { route: '/canvases/product-vision', name: 'Product Vision Canvas' },
  'business-model-canvas': { route: '/bmc-generator', name: 'Business Model Canvas' },
  'lean-canvas': { route: '/bmc-generator', name: 'Business Model Canvas' },
  'business-case': { route: '/canvases/business-case', name: 'Business Case Canvas' },
  'impact-mapping': { route: '/impact-map', name: 'Impact Map Builder' },
  'journey-mapping': { route: '/journey-map', name: 'Journey Map Studio' },
  'story-mapping': { route: '/backlog', name: 'Story Map' },
  'user-stories': { route: '/user-story-canvas', name: 'User Story Canvas' },
  personas: { route: '/personas', name: 'Persona Studio' },
  'jobs-to-be-done': { route: '/personas', name: 'Persona Studio' },
  'empathy-map': { route: '/personas', name: 'Persona Studio' },
  'experiment-cards': { route: '/probes', name: 'Probe Tracker' },
  'working-agreements': { route: '/ways-of-working', name: 'Ways of Working' },
  'retrospective-techniques': { route: '/ways-of-working', name: 'Ways of Working' },
  'moscow-prioritization': { route: '/backlog', name: 'Product Backlog' },
  'wsjf-weighted-shortest-job-first': { route: '/backlog', name: 'Product Backlog' },
  'okrs-objectives-and-key-results': { route: '/benefits', name: 'Benefits Scorecard' },
};

const BY_ARTIFACT: Record<string, PathTool> = {
  'coord-vision': { route: '/canvases/product-vision', name: 'Product Vision Canvas' },
  'org-vision': { route: '/canvases/product-vision', name: 'Product Vision Canvas' },
  'org-business-model': { route: '/bmc-generator', name: 'Business Model Canvas' },
  'coord-goal': { route: '/impact-map', name: 'Impact Map Builder' },
  'coord-user-beneficiary-profile': { route: '/personas', name: 'Persona Studio' },
  'coord-backlog': { route: '/backlog', name: 'Product Backlog' },
  'coord-outcomes': { route: '/benefits', name: 'Benefits Scorecard' },
  'coord-way-of-working': { route: '/ways-of-working', name: 'Ways of Working' },
  'team-way-of-working': { route: '/ways-of-working', name: 'Ways of Working' },
  'coord-solution-design': { route: '/project-modelling', name: 'Modelling Canvas' },
};

export const toolForStep = (artifactId: string, techniqueIds: string[]): PathTool | null => {
  for (const t of techniqueIds || []) {
    if (BY_TECHNIQUE[t]) return BY_TECHNIQUE[t];
  }
  return BY_ARTIFACT[artifactId] ?? null;
};

/** Human label for a catalogue slug when no tool maps (strip horizon prefix, title-case). */
export const prettySlug = (slug: string): string =>
  slug.replace(/^(coord|org|team)-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
