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

export interface CoachingSession {
  topic: string;
  transcript: SessionTurn[];
  summary: string;
  harvested: HarvestedItem[];
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
  return {
    topic: String(o.topic ?? ''),
    transcript,
    summary: String(o.summary ?? ''),
    harvested,
  };
};
