import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

// A Story Map view (see VISION_TO_VALUE.md 6.13, after Jeff Patton) over the
// existing backlog: backbone columns from the epics, cards beneath via
// parent_item_id, horizontal slices as releases (target_release). Read only; all
// editing stays in the list view. No new data model.

export interface StoryMapItem {
  id: string;
  title: string;
  priority?: string | null;
  item_type?: string | null;
  parent_item_id?: string | null;
  target_release?: string | null;
  description?: string | null;
  status?: string | null;
  tags?: string[] | null;
}

const PRIORITY_CLASS: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  must: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  should: 'bg-orange-500 text-white',
  medium: 'bg-primary text-primary-foreground',
  could: 'bg-primary text-primary-foreground',
  low: 'bg-muted text-muted-foreground',
  "won't": 'bg-muted text-muted-foreground',
};

const UNASSIGNED = '__none__';
const UNSCHEDULED = '';

export function StoryMap({ items }: { items: StoryMapItem[] }) {
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Walk parent_item_id up to the epic this item belongs to.
  const epicAncestor = (item: StoryMapItem): StoryMapItem | null => {
    let cur: StoryMapItem | undefined = item;
    const seen = new Set<string>();
    while (cur && cur.item_type !== 'epic' && cur.parent_item_id && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parent_item_id);
    }
    return cur && cur.item_type === 'epic' ? cur : null;
  };

  const epics = items.filter((i) => i.item_type === 'epic');
  const cards = items.filter((i) => i.item_type !== 'epic');

  const columns = [
    ...epics.map((e) => ({ id: e.id, name: e.title || 'Untitled epic' })),
    { id: UNASSIGNED, name: 'Unassigned' },
  ];

  const releaseValues = Array.from(
    new Set(cards.map((c) => (c.target_release || '').trim()).filter(Boolean)),
  ).sort();
  const rows: string[] = [...releaseValues, UNSCHEDULED];

  const cardEpicId = (c: StoryMapItem) => epicAncestor(c)?.id ?? UNASSIGNED;

  const cellItems = (colId: string, release: string) =>
    cards.filter((c) => cardEpicId(c) === colId && (c.target_release || '').trim() === release);

  const exportRelease = (release: string) => {
    const list = cards.filter((c) => (c.target_release || '').trim() === release);
    if (list.length === 0) {
      toast.error('Nothing to export in this release');
      return;
    }
    const rowsOut = list.map((c) => ({
      Title: c.title,
      Epic: byId.get(cardEpicId(c) === UNASSIGNED ? '' : cardEpicId(c))?.title || '',
      Priority: c.priority || '',
      Status: c.status || '',
      Release: release || 'Unscheduled',
      Tags: c.tags?.join(', ') || '',
    }));
    exportToCSV(rowsOut, `backlog-${(release || 'unscheduled').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    toast.success(`Exported ${list.length} item${list.length === 1 ? '' : 's'}`);
  };

  if (cards.length === 0 && epics.length === 0) {
    return <p className="text-sm text-muted-foreground">Add some epics and stories to see them on the map.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Backbone: epic columns */}
        <div className="flex gap-3 border-b border-border pb-2">
          <div className="w-28 shrink-0" />
          {columns.map((col) => (
            <div key={col.id} className="w-56 shrink-0 px-1">
              <div className="rounded-md px-2 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: '#004D4D' }}>
                {col.name}
              </div>
            </div>
          ))}
        </div>

        {/* Release slices */}
        {rows.map((release) => (
          <div key={release || 'unscheduled'} className="flex gap-3 border-b border-border/60 py-2">
            <div className="flex w-28 shrink-0 flex-col gap-1 pt-1">
              <span className="text-xs font-bold tracking-wide" style={{ color: '#FF9715' }}>
                {release || 'Unscheduled'}
              </span>
              <Button variant="ghost" size="sm" className="h-6 justify-start px-1 text-[11px] text-muted-foreground" onClick={() => exportRelease(release)}>
                <Download className="mr-1 h-3 w-3" /> CSV
              </Button>
            </div>
            {columns.map((col) => (
              <div key={col.id} className="flex w-56 shrink-0 flex-col gap-2 px-1">
                {cellItems(col.id, release).map((c) => (
                  <div key={c.id} className="rounded-md border border-border bg-card p-2 shadow-sm">
                    <p className="text-sm text-foreground">{c.title}</p>
                    {c.priority && (
                      <Badge className={`mt-1 ${PRIORITY_CLASS[(c.priority || '').toLowerCase()] || 'bg-muted text-muted-foreground'}`}>
                        {c.priority}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
