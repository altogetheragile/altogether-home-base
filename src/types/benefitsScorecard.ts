// Benefits Scorecard (see VISION_TO_VALUE.md 6.7). The Outcomes and Value stage:
// each outcome carries a leading indicator, a target, and dated readings so you
// can see whether the numbers actually moved. Seeded from the Impact Map goal and
// the Business Case Benefits cell via 'measures' links.
// Standing stretch: "If every number improved and nothing really changed, how would you know?"

export interface Reading {
  id: string;
  date: string;
  value: number;
  note: string;
}

export interface Benefit {
  id: string;
  outcome: string;          // the outcome we are trying to create
  leading_indicator: string; // what we watch to see it coming
  target: string;            // the target, kept as free text (e.g. "+10pp", "< 2 days")
  readings: Reading[];
}

export interface BenefitsScorecard {
  benefits: Benefit[];
}

export const BENEFITS_STRETCH = 'If every number improved and nothing really changed, how would you know?';

const newId = () => crypto.randomUUID();

export const emptyBenefitsScorecard = (): BenefitsScorecard => ({ benefits: [] });

export const exampleBenefitsScorecard = (): BenefitsScorecard => ({
  benefits: [
    {
      id: newId(),
      outcome: 'New teams reach their first real result faster',
      leading_indicator: 'Median days from sign-up to first published artifact',
      target: 'Under 3 days',
      readings: [
        { id: newId(), date: '2026-05-01', value: 7, note: 'Baseline' },
        { id: newId(), date: '2026-05-15', value: 5, note: 'After guided checklist' },
        { id: newId(), date: '2026-06-01', value: 4, note: '' },
      ],
    },
  ],
});

export const newBenefit = (): Benefit => ({
  id: newId(),
  outcome: '',
  leading_indicator: '',
  target: '',
  readings: [],
});

export const newReading = (): Reading => ({
  id: newId(),
  date: new Date().toISOString().slice(0, 10),
  value: 0,
  note: '',
});

export const parseBenefitsScorecard = (raw: unknown): BenefitsScorecard | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const benefits: Benefit[] = Array.isArray(o.benefits)
    ? o.benefits.map((b) => {
        const x = (b ?? {}) as Record<string, unknown>;
        const readings: Reading[] = Array.isArray(x.readings)
          ? x.readings.map((r) => {
              const y = (r ?? {}) as Record<string, unknown>;
              const value = Number(y.value);
              return {
                id: typeof y.id === 'string' ? y.id : newId(),
                date: String(y.date ?? ''),
                value: Number.isFinite(value) ? value : 0,
                note: String(y.note ?? ''),
              };
            })
          : [];
        return {
          id: typeof x.id === 'string' ? x.id : newId(),
          outcome: String(x.outcome ?? ''),
          leading_indicator: String(x.leading_indicator ?? ''),
          target: String(x.target ?? ''),
          readings,
        };
      })
    : [];
  return { benefits };
};
