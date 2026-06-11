// Pipeline Registry — the single declarative source of truth for the
// "Vision to Value" pipeline (see docs/VISION_TO_VALUE.md section 5.4).
//
// The journey view, the Canvas Picker and the coach all read this. Adding a
// future tool should require only an entry here plus its component — no changes
// to the journey, picker or coach plumbing. Build stage-aware features against
// this registry, never a hard-coded stage list.

/** The six ISA-O3 stages, in order. Intent/Scope/Approach cascade down; */
/** Operate/Outputs/Outcomes return evidence up. */
export type PipelineStage = 'intent' | 'scope' | 'approach' | 'operate' | 'outputs' | 'outcomes';

/** Provenance link kinds stored in project_artifact_links.link_kind. */
export type LinkKind = 'derived_from' | 'measures' | 'tests';

export interface StageDef {
  id: PipelineStage;
  label: string;
  /** The question the coach holds at this stage. */
  question: string;
}

export interface PipelineToolDef {
  /** Stable key. For artifact-backed tools this matches project_artifacts.artifact_type. */
  key: string;
  name: string;
  route: string;
  /** ArtifactViewer switch case, when the tool persists as a project artifact. */
  viewerCase?: string;
  /** Stages this tool serves (a tool may span more than one). */
  stages: PipelineStage[];
  /** Link kinds this tool can be the source of. */
  allowedLinkKinds: LinkKind[];
  /** 'live' = shipped; 'planned' = on the roadmap, not built yet. */
  status: 'live' | 'planned';
}

export const STAGES: StageDef[] = [
  { id: 'intent', label: 'Intent', question: 'Why does this matter, who does it serve, what would be different?' },
  { id: 'scope', label: 'Scope', question: 'What value, whose needs, which options, what timeframe?' },
  { id: 'approach', label: 'Approach', question: 'How will we organise, assure quality, schedule?' },
  { id: 'operate', label: 'Operate', question: 'How are we working, and what one thing would most improve us?' },
  { id: 'outputs', label: 'Outputs', question: 'Which output options are we testing, and what would kill each?' },
  { id: 'outcomes', label: 'Outcomes and Value', question: 'The numbers moved; did anything actually change?' },
];

export const PIPELINE: PipelineToolDef[] = [
  // --- Live ---
  {
    key: 'impact-map',
    name: 'Impact Map Builder',
    route: '/impact-map',
    viewerCase: 'impact-map',
    stages: ['intent', 'scope'],
    allowedLinkKinds: ['derived_from'],
    status: 'live',
  },
  {
    key: 'bmc',
    name: 'Business Model Canvas',
    route: '/bmc-generator',
    viewerCase: 'bmc',
    stages: ['intent', 'scope'],
    allowedLinkKinds: ['derived_from'],
    status: 'live',
  },
  {
    key: 'user_story',
    name: 'User Story Canvas',
    route: '/user-story-canvas',
    viewerCase: 'canvas',
    stages: ['scope'],
    allowedLinkKinds: ['derived_from'],
    status: 'live',
  },
  {
    key: 'project-model',
    name: 'Modelling Canvas',
    route: '/project-modelling',
    viewerCase: 'project-model',
    stages: ['intent', 'scope', 'approach', 'operate', 'outputs', 'outcomes'],
    allowedLinkKinds: ['derived_from'],
    status: 'live',
  },
  {
    key: 'product-backlog',
    name: 'Product Backlog',
    route: '/backlog',
    viewerCase: 'product-backlog',
    stages: ['scope'],
    allowedLinkKinds: ['derived_from'],
    status: 'live',
  },
  // --- Planned (roadmap; see VISION_TO_VALUE.md sections 6.2, 6.6-6.10) ---
  { key: 'business-case', name: 'Business Case Canvas', route: '/canvases/business-case', viewerCase: 'business-case', stages: ['intent', 'scope'], allowedLinkKinds: ['derived_from'], status: 'live' },
  { key: 'product-vision', name: 'Product Vision Canvas', route: '/canvases/product-vision', viewerCase: 'product-vision', stages: ['intent'], allowedLinkKinds: ['derived_from'], status: 'live' },
  { key: 'persona', name: 'Persona Studio', route: '/personas', viewerCase: 'persona', stages: ['intent', 'scope'], allowedLinkKinds: ['derived_from'], status: 'live' },
  { key: 'probe-tracker', name: 'Probe Tracker', route: '/probes', viewerCase: 'probe-tracker', stages: ['outputs'], allowedLinkKinds: ['tests'], status: 'live' },
  { key: 'benefits-scorecard', name: 'Benefits Scorecard', route: '/benefits', stages: ['outcomes'], allowedLinkKinds: ['measures'], status: 'planned' },
  { key: 'coaching-session', name: 'Coaching Studio', route: '/coach', stages: ['intent', 'scope', 'approach', 'operate', 'outputs', 'outcomes'], allowedLinkKinds: ['derived_from'], status: 'planned' },
  { key: 'ways-of-working', name: 'Retro Coach and Ways of Working', route: '/ways-of-working', viewerCase: 'ways-of-working', stages: ['operate'], allowedLinkKinds: ['derived_from'], status: 'live' },
];

export const getStage = (id: PipelineStage): StageDef | undefined => STAGES.find((s) => s.id === id);

export const toolsForStage = (stage: PipelineStage): PipelineToolDef[] =>
  PIPELINE.filter((t) => t.stages.includes(stage));

export const toolByKey = (key: string): PipelineToolDef | undefined => PIPELINE.find((t) => t.key === key);

export const toolByViewerCase = (artifactType: string): PipelineToolDef | undefined =>
  PIPELINE.find((t) => t.viewerCase === artifactType);
