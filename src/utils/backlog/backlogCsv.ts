import { exportToCSV } from '@/utils/exportUtils';
import type { PrioritisationScheme } from '@/config/prioritisationSchemes';
import { compareByScheme } from '@/config/prioritisationSchemes';

// CSV export with tool-specific column mappings (see VISION_TO_VALUE.md 6.4, 6.14).
// The active prioritisation scheme decides the rank (WSJF ranks by score, MoSCoW
// and Simple by their ordered values) and which items are excluded by default
// (MoSCoW Won't). Without a scheme it falls back to vocabulary-based ranking.

export type BacklogCsvFormat = 'jira' | 'azure-devops' | 'trello';

export interface BacklogExportItem {
  title: string;
  description?: string | null;
  priority?: string | null;
  priority_data?: Record<string, number> | null;
  status?: string | null;
  tags?: string[] | null;
  epic?: string | null;
  source?: string | null;
}

/** Normalise any priority vocabulary to a rank: 1 (highest) .. 4 (lowest). */
const rankOf = (p?: string | null): number => {
  switch ((p || '').toLowerCase().trim()) {
    case 'critical':
    case 'must':
    case 'highest':
      return 1;
    case 'high':
    case 'should':
      return 2;
    case 'medium':
    case 'could':
      return 3;
    case 'low':
    case 'lowest':
    case "won't":
    case 'wont':
    case 'would':
      return 4;
    default:
      return 3;
  }
};

export const isWont = (p?: string | null): boolean =>
  ["won't", 'wont', 'would'].includes((p || '').toLowerCase().trim());

const JIRA_PRIORITY: Record<number, string> = { 1: 'Highest', 2: 'High', 3: 'Medium', 4: 'Low' };

export const FORMAT_LABELS: Record<BacklogCsvFormat, string> = {
  jira: 'Jira',
  'azure-devops': 'Azure DevOps',
  trello: 'Trello',
};

/** Build rows for a given tool and trigger the CSV download. */
export const exportBacklogCsv = (
  items: BacklogExportItem[],
  format: BacklogCsvFormat,
  opts: { includeWont?: boolean; scheme?: PrioritisationScheme } = {},
): void => {
  const scheme = opts.scheme;
  const rankFn = (i: BacklogExportItem) => (scheme ? scheme.rank(i) : rankOf(i.priority));
  const excluded = (i: BacklogExportItem) =>
    scheme?.excludeFromCsv ? scheme.excludeFromCsv(i) : isWont(i.priority);

  let rows = opts.includeWont ? items.slice() : items.filter((i) => !excluded(i));
  if (scheme) rows = rows.sort((a, b) => compareByScheme(scheme, a, b));

  if (format === 'jira') {
    exportToCSV(
      rows.map((i) => ({
        Summary: i.title,
        Description: i.description || '',
        Priority: JIRA_PRIORITY[rankFn(i)],
        Labels: (i.tags || []).map((t) => t.replace(/\s+/g, '-')).join(' '),
        'Epic Link': i.epic || '',
      })),
      'backlog-jira',
    );
  } else if (format === 'azure-devops') {
    exportToCSV(
      rows.map((i) => ({
        Title: i.title,
        Description: i.description || '',
        Priority: String(rankFn(i)),
        Tags: (i.tags || []).join('; '),
        'Area Path': '',
      })),
      'backlog-azure-devops',
    );
  } else {
    exportToCSV(
      rows.map((i) => ({
        Name: i.title,
        Desc: i.description || '',
        Labels: (i.tags || []).join(','),
      })),
      'backlog-trello',
    );
  }
};
