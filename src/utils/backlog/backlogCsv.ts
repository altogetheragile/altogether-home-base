import { exportToCSV } from '@/utils/exportUtils';

// CSV export with tool-specific column mappings (see VISION_TO_VALUE.md 6.4).
// Note: this app's backlog uses critical/high/medium/low priorities, not MoSCoW.
// The mapper handles both vocabularies; "Won't" exclusion only bites if MoSCoW
// values are present (they are not in the current scheme).

export type BacklogCsvFormat = 'jira' | 'azure-devops' | 'trello';

export interface BacklogExportItem {
  title: string;
  description?: string | null;
  priority?: string | null;
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
  opts: { includeWont?: boolean } = {},
): void => {
  const rows = opts.includeWont ? items : items.filter((i) => !isWont(i.priority));

  if (format === 'jira') {
    exportToCSV(
      rows.map((i) => ({
        Summary: i.title,
        Description: i.description || '',
        Priority: JIRA_PRIORITY[rankOf(i.priority)],
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
        Priority: String(rankOf(i.priority)),
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
