// Journey Map Studio (see VISION_TO_VALUE.md 6.12). The Scope stage, anchored to
// one persona (deliberately cross-stage). A grid: journey stages across the top;
// rows for doing, thinking, feeling, pains and opportunities. Pains and
// opportunities promote to the backlog as story candidates, with provenance.
// Technique provenance: journey and experience mapping, service design practice,
// popularised by Adaptive Path. KB slug: journey-mapping.
// Standing stretch: "Which stage do we not actually have evidence for?"

export type JourneyRowKey = 'doing' | 'thinking' | 'feeling' | 'pains' | 'opportunities';

export interface JourneyRowMeta {
  key: JourneyRowKey;
  label: string;
  question: string; // the open coaching question for this row
  color: string;    // brand-aligned accent
  promotable?: boolean; // pains and opportunities can be sent to the backlog
}

export const JOURNEY_ROWS: JourneyRowMeta[] = [
  { key: 'doing', label: 'Doing', question: 'What is this persona trying to get done at this stage?', color: '#004D4D' },
  { key: 'thinking', label: 'Thinking', question: 'What is going through their mind here?', color: '#1A9090' },
  { key: 'feeling', label: 'Feeling', question: 'How do they feel at this point, and why?', color: '#3F8080' },
  { key: 'pains', label: 'Pains', question: 'What gets in their way or frustrates them here?', color: '#C2603A', promotable: true },
  { key: 'opportunities', label: 'Opportunities', question: 'What could we do here that would actually help?', color: '#E08A4E', promotable: true },
];

export const JOURNEY_STRETCH = 'Which stage do we not actually have evidence for?';

export interface JourneyStage {
  id: string;
  name: string;
  doing: string;
  thinking: string;
  feeling: string;
  pains: string;
  opportunities: string;
}

export interface JourneyMap {
  /** The persona this journey belongs to (name shown; ref links to a persona artifact when known). */
  personaName: string;
  personaRef?: string;
  stages: JourneyStage[];
}

const newId = () => crypto.randomUUID();

export const newJourneyStage = (name = ''): JourneyStage => ({
  id: newId(),
  name,
  doing: '',
  thinking: '',
  feeling: '',
  pains: '',
  opportunities: '',
});

export const emptyJourneyMap = (): JourneyMap => ({ personaName: '', stages: [newJourneyStage()] });

export const exampleJourneyMap = (): JourneyMap => ({
  personaName: 'Priya, the time-poor product lead',
  stages: [
    {
      id: newId(),
      name: 'Discover',
      doing: 'Skims a recommendation between meetings, on her phone, looking for one credible tool.',
      thinking: 'Is this another thing to learn, or will it actually show me whether the work is paying off?',
      feeling: 'Sceptical but hopeful; short on patience.',
      pains: 'Most tools start with setup, not with her question. She cannot tell at a glance what it is for.',
      opportunities: 'Lead with the outcome, not the form. Show a worked example in her language.',
    },
    {
      id: newId(),
      name: 'First use',
      doing: 'Tries to capture one real goal and see it connect to delivery.',
      thinking: 'If this drifts from reality like my spreadsheets, I am out.',
      feeling: 'Cautiously invested once something of hers appears on screen.',
      pains: 'Re-typing the same thing across tools. Losing her own words to a generated draft.',
      opportunities: 'Reflect her words back as the draft. Carry one artifact into the next without retyping.',
    },
    {
      id: newId(),
      name: 'Return',
      doing: 'Comes back to check whether any number moved.',
      thinking: 'Can I show my stakeholders this in two minutes?',
      feeling: 'Reassured when the thread from intent to evidence is visible on one screen.',
      pains: 'No single place that shows outcome, not just output.',
      opportunities: 'A one-page view: intent at the top, indicator readings at the bottom, connected.',
    },
  ],
});

export const parseJourneyMap = (raw: unknown): JourneyMap | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const stages: JourneyStage[] = Array.isArray(o.stages)
    ? o.stages.map((s) => {
        const x = (s ?? {}) as Record<string, unknown>;
        return {
          id: typeof x.id === 'string' ? x.id : newId(),
          name: String(x.name ?? ''),
          doing: String(x.doing ?? ''),
          thinking: String(x.thinking ?? ''),
          feeling: String(x.feeling ?? ''),
          pains: String(x.pains ?? ''),
          opportunities: String(x.opportunities ?? ''),
        };
      })
    : [];
  return {
    personaName: String(o.personaName ?? ''),
    personaRef: typeof o.personaRef === 'string' ? o.personaRef : undefined,
    stages: stages.length > 0 ? stages : [newJourneyStage()],
  };
};

export const journeyHasContent = (j: JourneyMap): boolean =>
  j.personaName.trim() !== '' ||
  j.stages.some((s) => s.name.trim() !== '' || s.doing || s.thinking || s.feeling || s.pains || s.opportunities);
