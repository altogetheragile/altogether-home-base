import { useState } from 'react';
import { X } from 'lucide-react';
import { ICONS, ICON_NAMES } from './icons';

// A grid rather than a dropdown of names: nobody knows what "HeartHandshake" looks like, and
// picking an icon is a visual decision made in a second by looking.

export function IconPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [filter, setFilter] = useState('');
  const shown = filter.trim()
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(filter.trim().toLowerCase()))
    : ICON_NAMES;
  const Chosen = value ? ICONS[value] : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/40">
          {Chosen ? <Chosen size={16} /> : <span className="text-[10px] text-muted-foreground">none</span>}
        </div>
        <input
          value={filter}
          placeholder="Search icons"
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Use no icon"
            className="rounded border border-border p-1 text-muted-foreground hover:text-destructive"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded border border-border p-1.5">
        {shown.map((name) => {
          const Glyph = ICONS[name];
          return (
            <button
              key={name}
              title={name}
              aria-label={name}
              aria-pressed={value === name}
              onClick={() => onChange(name)}
              className={`flex aspect-square items-center justify-center rounded hover:bg-muted ${
                value === name ? 'bg-primary/15 text-primary ring-1 ring-primary' : 'text-muted-foreground'
              }`}
            >
              <Glyph size={15} />
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="col-span-8 py-2 text-center text-xs text-muted-foreground">Nothing matching that.</p>
        )}
      </div>
    </div>
  );
}
