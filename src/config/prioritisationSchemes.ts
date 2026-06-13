// Prioritisation Schemes (VISION_TO_VALUE.md 6.14). A declarative registry in the
// spirit of the Pipeline Registry (5.4): each scheme declares its fields, how to
// rank an item, how to sort, its CSV behaviour and its coach stretch. Adding a
// scheme (RICE next) is one entry here. KB slugs moscow-prioritization,
// wsjf-weighted-shortest-job-first and rice exist for grounding.

export type SchemeId = 'simple' | 'moscow' | 'wsjf';

export interface PriorityOption {
  value: string;
  label: string;
  color: string; // tailwind classes for the badge/button
}

export interface ScoredField {
  key: string;
  label: string;
  help: string;
}

export interface PrioritisationItem {
  priority?: string | null;
  priority_data?: Record<string, number> | null;
}

export interface PrioritisationScheme {
  id: SchemeId;
  name: string;
  description: string;
  stretch: string;
  /** ordinal: a discrete priority stored in backlog_items.priority. scored: numbers in priority_data. */
  type: 'ordinal' | 'scored';
  options?: PriorityOption[];
  fields?: ScoredField[];
  /** scored schemes: higher means do first. Null when not enough numbers yet. */
  score?: (data: Record<string, number>) => number | null;
  /** 1 (highest) .. 4 (lowest), used for CSV mapping and default sort. */
  rank: (item: PrioritisationItem) => number;
  /** moscow: exclude Won't from CSV by default. */
  excludeFromCsv?: (item: PrioritisationItem) => boolean;
}

// Cross-vocabulary rank so an item stored under one ordinal scheme still ranks
// correctly when viewed/exported under another (e.g. a legacy 'high'/'critical'
// item under MoSCoW). 1 = highest .. 4 = lowest.
const ordinalRank = (p?: string | null): number =>
  ({
    critical: 1, must: 1, highest: 1,
    high: 2, should: 2,
    medium: 3, could: 3,
    low: 4, lowest: 4, "won't": 4, wont: 4, would: 4,
  }[(p || '').toLowerCase().trim()] ?? 3);

const num = (d: Record<string, number> | null | undefined, k: string): number => {
  const v = d?.[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

const wsjfScore = (data: Record<string, number>): number | null => {
  const bv = num(data, 'business_value');
  const tc = num(data, 'time_criticality');
  const ro = num(data, 'risk_opportunity');
  const js = num(data, 'job_size');
  if (bv + tc + ro === 0 || js <= 0) return null;
  return (bv + tc + ro) / js;
};

export const SCHEMES: Record<SchemeId, PrioritisationScheme> = {
  simple: {
    id: 'simple',
    name: 'Simple (Critical to Low)',
    description: 'Four ordered levels, from Critical to Low.',
    stretch: 'Which Must would you quietly trade away under pressure?',
    type: 'ordinal',
    options: [
      { value: 'critical', label: 'Critical', color: 'bg-destructive text-destructive-foreground' },
      { value: 'high', label: 'High', color: 'bg-orange-500 text-white' },
      { value: 'medium', label: 'Medium', color: 'bg-primary text-primary-foreground' },
      { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
    ],
    rank: (i) => ordinalRank(i.priority),
  },
  moscow: {
    id: 'moscow',
    name: 'MoSCoW',
    description: 'Must, Should, Could, Won\'t (Dai Clegg, DSDM). Won\'t is excluded from CSV by default.',
    stretch: 'Which Must would you quietly trade away under pressure?',
    type: 'ordinal',
    options: [
      { value: 'must', label: 'Must', color: 'bg-destructive text-destructive-foreground' },
      { value: 'should', label: 'Should', color: 'bg-orange-500 text-white' },
      { value: 'could', label: 'Could', color: 'bg-primary text-primary-foreground' },
      { value: "won't", label: "Won't", color: 'bg-muted text-muted-foreground' },
    ],
    rank: (i) => ordinalRank(i.priority),
    excludeFromCsv: (i) => ['won\'t', 'wont'].includes((i.priority || '').toLowerCase()),
  },
  wsjf: {
    id: 'wsjf',
    name: 'WSJF',
    description: 'Weighted Shortest Job First: value, time criticality and risk reduction over job size (Cost of Delay, after Reinertsen, popularised in SAFe).',
    stretch: 'Which of these numbers is a guess wearing a decimal point?',
    type: 'scored',
    fields: [
      { key: 'business_value', label: 'Business Value', help: 'Relative user or business value (1-10).' },
      { key: 'time_criticality', label: 'Time Criticality', help: 'How much value decays with delay (1-10).' },
      { key: 'risk_opportunity', label: 'Risk Reduction / Opportunity', help: 'Risk it removes or opportunity it opens (1-10).' },
      { key: 'job_size', label: 'Job Size', help: 'Relative effort to deliver (1-10).' },
    ],
    score: wsjfScore,
    rank: (i) => {
      const s = wsjfScore(i.priority_data || {});
      if (s === null) return 4;
      if (s >= 8) return 1;
      if (s >= 4) return 2;
      if (s >= 2) return 3;
      return 4;
    },
  },
};

export const getScheme = (id?: string | null): PrioritisationScheme =>
  SCHEMES[(id as SchemeId)] ?? SCHEMES.simple;

/** Default scheme for a project kind: project -> moscow, otherwise simple (6.14). */
export const defaultSchemeForKind = (kind?: string | null): SchemeId =>
  kind === 'project' ? 'moscow' : 'simple';

/** Compare two items by a scheme: higher priority first. */
export const compareByScheme = (scheme: PrioritisationScheme, a: PrioritisationItem, b: PrioritisationItem): number => {
  if (scheme.type === 'scored' && scheme.score) {
    const sa = scheme.score(a.priority_data || {}) ?? -Infinity;
    const sb = scheme.score(b.priority_data || {}) ?? -Infinity;
    return sb - sa;
  }
  return scheme.rank(a) - scheme.rank(b);
};
