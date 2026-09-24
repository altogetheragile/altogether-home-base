import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { orderedSections, type SectionChoice } from './sections';

// ============= The order of a page, as a list you can move =============
//
// Membership is fixed: these are coded sections, so you cannot invent one and cannot lose one.
// All that is editable is the order they come in and whether each appears. That is the whole
// difference between this and the item control, which owns its own rows.
//
// Unticking keeps the section's words. It is not a delete, and the hint says so, because
// somebody who thinks it might be will not use it.

export function SectionOrder({
  value,
  choices,
  onChange,
}: {
  value: string;
  choices: SectionChoice[];
  onChange: (next: string) => void;
}) {
  // Always the merged view, so a section added in code appears here the moment it exists.
  const rows = orderedSections(value, choices);
  const label = (key: string) => choices.find((c) => c.key === key)?.label ?? key;
  const hint = (key: string) => choices.find((c) => c.key === key)?.hint;

  const write = (next: typeof rows) => onChange(JSON.stringify(next, null, 2));
  const move = (i: number, by: number) => {
    const to = i + by;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[i], next[to]] = [next[to], next[i]];
    write(next);
  };
  const toggle = (i: number) => write(rows.map((r, n) => (n === i ? { ...r, visible: !r.visible } : r)));

  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {rows.map((row, i) => (
        <div key={row.section} className={`flex items-start gap-2 p-2 ${row.visible ? '' : 'bg-muted/40'}`}>
          <GripVertical size={13} className="mt-1 shrink-0 text-muted-foreground/50" />
          <label className="flex-1 cursor-pointer">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.visible}
                onChange={() => toggle(i)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className={`text-sm ${row.visible ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {label(row.section)}
              </span>
              {!row.visible && <span className="text-xs text-muted-foreground">not shown</span>}
            </span>
            {hint(row.section) && (
              <span className="mt-0.5 block pl-5 text-xs text-muted-foreground">{hint(row.section)}</span>
            )}
          </label>
          <div className="flex shrink-0 flex-col">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${label(row.section)} up`}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
            >
              <ChevronUp size={13} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
              aria-label={`Move ${label(row.section)} down`}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
            >
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
