// Shared shape of a Pattern Builder result, used by the builder page, the
// read-only saved-pattern view, the project artifact viewer, and the exporter.

export interface PatternStep {
  order: number;
  horizon: string | null;
  isa: string | null;
  artifactId: string;
  techniqueIds: string[];
  rationale: string;
}

export interface PatternResult {
  diagnosis: string;
  primaryHorizon: string | null;
  steps: PatternStep[];
  cautions: string[];
  empty?: boolean;
  runId?: string | null;
  assessment?: { reviewed?: boolean; revised?: boolean; verdict?: string; summary?: string };
}

// What gets persisted as a 'pattern' project artifact (artifact.data).
export interface SavedPattern {
  scenario: string;
  result: PatternResult;
}
