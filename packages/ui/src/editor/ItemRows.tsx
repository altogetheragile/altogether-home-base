import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { ItemField } from './fields';
import { PictureBox } from './PictureBox';
import { IconPicker } from './IconPicker';

// ============= A list of things, edited as a list of things =============
//
// The value is JSON, and the person editing never sees that. They see rows of named boxes with
// Add and Remove, which is what a list of statistics or a list of credentials actually is.
//
// It replaces "name | image | link", one per line in a textarea. That worked, and required
// whoever was editing to remember the field order, count the pipes, and never type one in their
// own text. A schema the editor can read makes all three of those somebody else's problem.

type Row = Record<string, string>;

/** Unparseable JSON is shown as nothing rather than throwing: the page does the same, and the
 *  raw value is still there to be repaired if it was hand-edited into a mess. */
function parse(value: string): Row[] {
  if (!value.trim()) return [];
  try {
    const out = JSON.parse(value);
    return Array.isArray(out) ? out.filter((r) => r && typeof r === 'object' && !Array.isArray(r)) : [];
  } catch {
    return [];
  }
}

export function ItemRows({
  value,
  fields,
  onChange,
  upload,
}: {
  value: string;
  fields: ItemField[];
  onChange: (next: string) => void;
  upload: (file: File) => Promise<string>;
}) {
  const rows = parse(value);
  // Pretty-printed, because this lands in a database column somebody will read one day.
  const write = (next: Row[]) => onChange(next.length ? JSON.stringify(next, null, 2) : '');

  const set = (i: number, key: string, v: string) =>
    write(rows.map((r, n) => (n === i ? { ...r, [key]: v } : r)));
  const remove = (i: number) => write(rows.filter((_, n) => n !== i));
  const add = () => write([...rows, Object.fromEntries(fields.map((f) => [f.key, '']))]);
  const move = (i: number, by: number) => {
    const to = i + by;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[i], next[to]] = [next[to], next[i]];
    write(next);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded-md border border-border bg-muted/30 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${i + 1} up`}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp size={13} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label={`Move ${i + 1} down`}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown size={13} />
              </button>
              <button
                onClick={() => remove(i)}
                aria-label={`Remove ${i + 1}`}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {fields.map((f) => (
            <label key={f.key} className="mb-1.5 block last:mb-0">
              <span className="mb-0.5 block text-xs text-muted-foreground">{f.label}</span>
              {f.type === 'image' ? (
                <PictureBox value={row[f.key] ?? ''} onChange={(v) => set(i, f.key, v)} upload={upload} />
              ) : f.type === 'icon' ? (
                <IconPicker value={row[f.key] ?? ''} onChange={(v) => set(i, f.key, v)} />
              ) : f.type === 'textarea' ? (
                <textarea
                  value={row[f.key] ?? ''}
                  placeholder={f.placeholder}
                  rows={Math.min(7, Math.max(2, Math.ceil((row[f.key] ?? '').length / 48)))}
                  onChange={(e) => set(i, f.key, e.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  value={row[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(i, f.key, e.target.value)}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </label>
          ))}
        </div>
      ))}
      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
      >
        <Plus size={13} /> Add
      </button>
    </div>
  );
}
