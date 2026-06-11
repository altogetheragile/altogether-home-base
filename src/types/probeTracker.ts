// Probe Tracker (see VISION_TO_VALUE.md 6.6). The Outputs stage: an experiment
// kanban where each card is an option-as-hypothesis. Probe, sense, respond.
// Standing stretch: "If this probe succeeds, what will you stop doing?"

export type ProbeStatus = 'planned' | 'running' | 'kept' | 'killed';

export interface Probe {
  id: string;
  option: string;       // the output option being tested
  output: string;       // the thing that gets built / changed
  probe: string;        // the smallest test
  signal: string;       // what would prove this wrong / what we are watching
  status: ProbeStatus;
  decided_at: string;   // ISO date the probe was kept or killed; '' while open
  note: string;
}

export interface ProbeTracker {
  probes: Probe[];
}

export const PROBE_STRETCH = 'If this probe succeeds, what will you stop doing?';

export const PROBE_COLUMNS: { status: ProbeStatus; label: string }[] = [
  { status: 'planned', label: 'Planned' },
  { status: 'running', label: 'Running' },
  { status: 'kept', label: 'Kept' },
  { status: 'killed', label: 'Killed' },
];

const newId = () => crypto.randomUUID();

export const emptyProbeTracker = (): ProbeTracker => ({ probes: [] });

export const exampleProbeTracker = (): ProbeTracker => ({
  probes: [
    {
      id: newId(),
      option: 'Self-serve onboarding',
      output: 'A guided first-run checklist',
      probe: 'Show the checklist to the next twenty new sign-ups only',
      signal: 'Fewer than half open it, or activation does not move within a week',
      status: 'running',
      decided_at: '',
      note: '',
    },
    {
      id: newId(),
      option: 'Concierge onboarding',
      output: 'A human walkthrough call',
      probe: 'Offer a call to ten new teams and watch who books',
      signal: 'Almost nobody books, or it does not lift retention',
      status: 'planned',
      decided_at: '',
      note: '',
    },
  ],
});

export const newProbe = (): Probe => ({
  id: newId(),
  option: '',
  output: '',
  probe: '',
  signal: '',
  status: 'planned',
  decided_at: '',
  note: '',
});

export const parseProbeTracker = (raw: unknown): ProbeTracker | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const probes: Probe[] = Array.isArray(o.probes)
    ? o.probes.map((p) => {
        const x = (p ?? {}) as Record<string, unknown>;
        const status = x.status;
        return {
          id: typeof x.id === 'string' ? x.id : newId(),
          option: String(x.option ?? ''),
          output: String(x.output ?? ''),
          probe: String(x.probe ?? ''),
          signal: String(x.signal ?? ''),
          status: status === 'running' || status === 'kept' || status === 'killed' ? status : 'planned',
          decided_at: String(x.decided_at ?? ''),
          note: String(x.note ?? ''),
        };
      })
    : [];
  return { probes };
};
