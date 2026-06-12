// Coaching Studio (see VISION_TO_VALUE.md 6.9). A standalone coached conversation
// on any topic, not tied to one cell. ICF-style arc: contract, explore, one
// stretch, then harvest: the coach proposes where each output lands, with one-tap
// send-to actions. artifact_type 'coaching-session': transcript plus harvested
// items and where they went.

export interface SessionTurn {
  role: 'user' | 'coach';
  text: string;
}

export type HarvestDestination = 'goal' | 'backlog' | 'probe' | 'benefit' | 'persona' | 'agreement' | 'note';

export interface HarvestedItem {
  id: string;
  text: string;
  destination: HarvestDestination;
  rationale: string;
  sent: boolean;
}

// Suggest a Path (see VISION_TO_VALUE.md 6.9a): a guide-mode offer that turns the
// session into a grounded recommend-pattern flow, each step optionally opening a
// pipeline tool. Stored on the session so it persists.
export interface PathStep {
  order: number;
  artifactId: string; // ISA-O3 catalogue slug
  techniqueIds: string[];
  rationale: string;
  toolRoute?: string;
  toolName?: string;
  opened?: boolean;
}

export interface SuggestedPath {
  diagnosis: string;
  generatedAt: string;
  steps: PathStep[];
}

export interface CoachingSession {
  topic: string;
  transcript: SessionTurn[];
  summary: string;
  harvested: HarvestedItem[];
  suggested_path?: SuggestedPath;
}

export const HARVEST_DESTINATIONS: { value: HarvestDestination; label: string; route: string }[] = [
  { value: 'goal', label: 'Goal (Impact Map)', route: '/impact-map' },
  { value: 'backlog', label: 'Backlog item', route: '/backlog' },
  { value: 'probe', label: 'Probe (Probe Tracker)', route: '/probes' },
  { value: 'benefit', label: 'Benefit (Benefits Scorecard)', route: '/benefits' },
  { value: 'persona', label: 'Persona (Persona Studio)', route: '/personas' },
  { value: 'agreement', label: 'Agreement (Ways of Working)', route: '/ways-of-working' },
  { value: 'note', label: 'Keep as a note', route: '' },
];

export const destinationMeta = (d: HarvestDestination) =>
  HARVEST_DESTINATIONS.find((x) => x.value === d) ?? HARVEST_DESTINATIONS[HARVEST_DESTINATIONS.length - 1];

const newId = () => crypto.randomUUID();

export const emptyCoachingSession = (): CoachingSession => ({ topic: '', transcript: [], summary: '', harvested: [] });

export const parseCoachingSession = (raw: unknown): CoachingSession | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const transcript: SessionTurn[] = Array.isArray(o.transcript)
    ? o.transcript.map((t) => {
        const x = (t ?? {}) as Record<string, unknown>;
        return { role: x.role === 'coach' ? 'coach' : 'user', text: String(x.text ?? '') };
      })
    : [];
  const harvested: HarvestedItem[] = Array.isArray(o.harvested)
    ? o.harvested.map((h) => {
        const x = (h ?? {}) as Record<string, unknown>;
        const dest = HARVEST_DESTINATIONS.some((d) => d.value === x.destination) ? (x.destination as HarvestDestination) : 'note';
        return {
          id: typeof x.id === 'string' ? x.id : newId(),
          text: String(x.text ?? ''),
          destination: dest,
          rationale: String(x.rationale ?? ''),
          sent: Boolean(x.sent),
        };
      })
    : [];
  const sp = o.suggested_path as Record<string, unknown> | undefined;
  const suggested_path: SuggestedPath | undefined = sp && Array.isArray(sp.steps)
    ? {
        diagnosis: String(sp.diagnosis ?? ''),
        generatedAt: String(sp.generatedAt ?? ''),
        steps: sp.steps.map((st) => {
          const x = (st ?? {}) as Record<string, unknown>;
          return {
            order: typeof x.order === 'number' ? x.order : 0,
            artifactId: String(x.artifactId ?? ''),
            techniqueIds: Array.isArray(x.techniqueIds) ? (x.techniqueIds.filter((t) => typeof t === 'string') as string[]) : [],
            rationale: String(x.rationale ?? ''),
            toolRoute: typeof x.toolRoute === 'string' ? x.toolRoute : undefined,
            toolName: typeof x.toolName === 'string' ? x.toolName : undefined,
            opened: Boolean(x.opened),
          };
        }),
      }
    : undefined;
  return {
    topic: String(o.topic ?? ''),
    transcript,
    summary: String(o.summary ?? ''),
    harvested,
    ...(suggested_path ? { suggested_path } : {}),
  };
};
