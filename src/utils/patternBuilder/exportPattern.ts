import type { PatternResult } from '@/types/pattern';

// Resolver for human-readable Knowledge Base names (satisfied by useKnowledgeBase()).
interface NameLookup {
  getArtifact: (id: string) => { name: string } | null;
  getTechnique: (id: string) => { name: string } | null;
}

/** A short, filesystem-safe stem from the scenario, e.g. "we-are-a-scale-up". */
export function patternStem(scenario: string): string {
  const base = (scenario || 'pattern').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return base || 'pattern';
}

export function toMarkdown(scenario: string, result: PatternResult, kb: NameLookup): string {
  const lines: string[] = ['# Recommended Pattern', ''];
  if (scenario.trim()) {
    lines.push('## Scenario', '', scenario.trim(), '');
  }
  if (result.diagnosis) {
    lines.push('## Diagnosis', '', result.diagnosis, '');
    if (result.primaryHorizon) lines.push(`Primary horizon: ${result.primaryHorizon}`, '');
  }
  if (result.steps?.length) {
    lines.push('## Recommended Flow', '');
    for (const s of result.steps) {
      const name = kb.getArtifact(s.artifactId)?.name || s.artifactId;
      lines.push(`${s.order}. ${name}`);
      if (s.rationale) lines.push(`   ${s.rationale}`);
      const techs = s.techniqueIds.map((t) => kb.getTechnique(t)?.name || t);
      if (techs.length) lines.push(`   Techniques: ${techs.join(', ')}`);
      lines.push('');
    }
  }
  if (result.cautions?.length) {
    lines.push('## Cautions', '', ...result.cautions.map((c) => `- ${c}`), '');
  }
  return lines.join('\n');
}

export function toJson(scenario: string, result: PatternResult): string {
  return JSON.stringify({ scenario, result }, null, 2);
}

/** Trigger a client-side download of text content. */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
