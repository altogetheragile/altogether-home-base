// Tool-pipeline contracts: one Zod schema per project_artifacts.artifact_type, plus a
// graceful validator. This is the single source of truth for the shape each tool reads
// and writes, and the shape that flows across tool-to-tool handoffs (outputs -> inputs).
//
// Design rules:
//  - Schemas are PERMISSIVE: they assert the structure handoffs depend on (e.g. an
//    impact-map has an `actors` array of impacts of deliverables) and `.passthrough()`
//    everything else, so they catch gross drift without rejecting valid, richer data.
//  - Validation is NON-BREAKING: validateArtifactData never throws and never drops data.
//    On a mismatch it returns `valid:false` plus the issues AND the original data, so
//    callers can log/observe drift while the user's flow keeps working.
import { z } from 'zod';

const str = z.string().catch(''); // lenient leaf: coerce missing/odd to '' rather than fail

// ── Impact Map (WHY -> WHO -> HOW -> WHAT) ───────────────────────────────────
const deliverable = z.object({ id: z.string(), label: str }).passthrough();
const impact = z.object({ id: z.string(), label: str, deliverables: z.array(deliverable).default([]) }).passthrough();
const actor = z.object({ id: z.string(), label: str, impacts: z.array(impact).default([]) }).passthrough();
export const impactMapSchema = z.object({ goal: str, actors: z.array(actor).default([]) }).passthrough();

// ── Journey Map ──────────────────────────────────────────────────────────────
const journeyStage = z.object({
  id: z.string(), name: str, doing: str, thinking: str, feeling: str, pains: str, opportunities: str,
}).passthrough();
export const journeyMapSchema = z.object({
  personaName: str, personaRef: z.string().optional(), stages: z.array(journeyStage).default([]),
}).passthrough();

// ── Coaching Session ─────────────────────────────────────────────────────────
const harvestDestination = z.enum(['goal', 'backlog', 'probe', 'benefit', 'persona', 'agreement', 'note']);
const harvestedItem = z.object({
  id: z.string(), text: str, destination: harvestDestination.catch('note'), rationale: str.optional(),
}).passthrough();
export const coachingSessionSchema = z.object({
  topic: str, transcript: z.array(z.object({ text: str }).passthrough()).default([]),
  summary: str.optional(), harvested: z.array(harvestedItem).default([]),
}).passthrough();

// ── Persona ──────────────────────────────────────────────────────────────────
export const personaSchema = z.object({
  name: str, role: str.optional(), context: str.optional(), quote: str.optional(), image: str.optional(),
  goals: z.array(z.string()).optional(), pains: z.array(z.string()).optional(), behaviours: z.array(z.string()).optional(),
}).passthrough();

// ── Probe Tracker ────────────────────────────────────────────────────────────
export const probeTrackerSchema = z.object({
  probes: z.array(z.object({ id: z.string() }).passthrough()).default([]),
}).passthrough();

// ── Benefits Scorecard ───────────────────────────────────────────────────────
export const benefitsScorecardSchema = z.object({
  benefits: z.array(z.object({ outcome: str.optional() }).passthrough()).default([]),
}).passthrough();

// ── Ways of Working ──────────────────────────────────────────────────────────
export const waysOfWorkingSchema = z.object({
  agreements: z.array(z.string()).default([]),
  retro_actions: z.array(z.object({}).passthrough()).default([]),
}).passthrough();

// ── Canvas-shaped artifacts (record of cellKey -> string) ────────────────────
const cellRecord = z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({});

// ── BMC (string | string[] per block) ───────────────────────────────────────
export const bmcSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({});

// ── Canvas-element artifacts (user_story / project-model store { elements: [] }) ─
export const canvasElementsSchema = z.object({
  elements: z.array(z.object({ id: z.string() }).passthrough()).default([]),
}).passthrough();

// ── Pattern Builder result (SavedPattern) ────────────────────────────────────
const patternStep = z.object({
  artifactId: str, techniqueIds: z.array(z.string()).default([]), rationale: str,
}).passthrough();
const patternResult = z.object({
  diagnosis: str, primaryHorizon: z.string().nullable().optional(),
  steps: z.array(patternStep).default([]), cautions: z.array(z.string()).default([]),
}).passthrough();
export const patternSchema = z.object({
  scenario: str,
  answers: z.array(z.object({ question: str, answer: str }).passthrough()).optional(),
  result: patternResult,
}).passthrough();

/** Registry: artifact_type -> schema. Unknown types pass through unvalidated. */
export const ARTIFACT_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'impact-map': impactMapSchema,
  'journey-map': journeyMapSchema,
  'coaching-session': coachingSessionSchema,
  persona: personaSchema,
  'probe-tracker': probeTrackerSchema,
  'benefits-scorecard': benefitsScorecardSchema,
  'ways-of-working': waysOfWorkingSchema,
  bmc: bmcSchema,
  'business-case': cellRecord,
  'product-vision': cellRecord,
  canvas: cellRecord,
  user_story: canvasElementsSchema,
  'project-model': canvasElementsSchema,
  pattern: patternSchema,
};

export type ArtifactValidation = { valid: boolean; data: unknown; issues: string[] };

/**
 * Validate an artifact payload against its type's contract. NEVER throws and NEVER
 * drops data: on a mismatch it returns the original `data` plus human-readable issues,
 * so a tool/handoff can surface drift (console.warn, telemetry) while still rendering.
 */
export function validateArtifactData(artifactType: string, data: unknown): ArtifactValidation {
  const schema = ARTIFACT_SCHEMAS[artifactType];
  if (!schema) return { valid: true, data, issues: [] };
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, data: result.data, issues: [] };
  return {
    valid: false,
    data,
    issues: result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  };
}
