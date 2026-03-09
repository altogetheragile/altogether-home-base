export interface BMCData {
  keyPartners: string | string[];
  keyActivities: string | string[];
  keyResources: string | string[];
  valuePropositions: string | string[];
  customerRelationships: string | string[];
  channels: string | string[];
  customerSegments: string | string[];
  costStructure: string | string[];
  revenueStreams: string | string[];
}

export interface NormalizedBMCData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

// Bulletproof section normalizer that handles any input type
const normalizeSection = (input: unknown): string[] => {
  const toStrings = (val: unknown): string[] => {
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.flatMap(toStrings);
    if (val && typeof val === 'object') {
      return Object.values(val as Record<string, unknown>).flatMap(toStrings);
    }
    return [];
  };

  const rawText = toStrings(input).join('\n');

  return rawText
    .split(/[•\n;,]+|(?:\r\n)|(?:\r)|(?:\t)/)
    .map(s => s.replace(/^\s*(?:•|-|\*|–|—|\d+\.)\s*/g, '').trim())
    .filter(s => s.length > 0)
    .filter((item, idx, arr) =>
      arr.findIndex(x => x.toLowerCase() === item.toLowerCase()) === idx
    )
    .slice(0, 10);
};

// Helper to pick the right key (camelCase or snake_case)
const pick = (obj: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return undefined;
};

export function normalizeBMCData(bmcData: BMCData): NormalizedBMCData {
  return {
    keyPartners: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'keyPartners', 'key_partners')),
    keyActivities: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'keyActivities', 'key_activities')),
    keyResources: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'keyResources', 'key_resources')),
    valuePropositions: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'valuePropositions', 'value_propositions')),
    customerRelationships: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'customerRelationships', 'customer_relationships')),
    channels: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'channels')),
    customerSegments: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'customerSegments', 'customer_segments')),
    costStructure: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'costStructure', 'cost_structure')),
    revenueStreams: normalizeSection(pick(bmcData as unknown as Record<string, unknown>, 'revenueStreams', 'revenue_streams')),
  };
}
