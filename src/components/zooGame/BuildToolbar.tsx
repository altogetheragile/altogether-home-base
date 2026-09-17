import { useState } from 'react';
import { Blocks, Check } from 'lucide-react';
import type { BacklogItem } from './types';
import { structuresFor } from './toolboxItems';
import { structureChosen } from './engine';
import { currentDesign } from './design';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS } from './ui/tokens';

// ============= The build toolbar =============
//
// Where the Developers start. Not a control on the strip beside the fence colour: a toolbar of its
// own, on the park, that you go to and pick from.
//
// "Go to structures, pick a structure, place it on the park, set size, set surface colour, set
// barrier type, add interior features, add paths." The strip is every one of those steps AFTER the
// first, and the first is a different kind of act - it is the one that decides what the thing is,
// where the rest decide what it is like. Putting it on the strip made it look like the sixth
// setting of a thing somebody had already decided to build.
//
// It carries one shelf today, and it is built to carry more: flora, water and whatever else the
// Developers come to place goes beside Structures rather than into the strip.

interface Shelf {
  id: string;
  label: string;
  icon: typeof Blocks;
}

const SHELVES: Shelf[] = [
  { id: 'structures', label: 'Structures', icon: Blocks },
];

export function BuildToolbar({ item, onChoose, className }: {
  /** What is being built. The toolbar offers what can be built FOR it. */
  item: BacklogItem;
  onChoose: (id: string, key: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const kinds = structuresFor(item.category);
  if (!kinds.length) return null;
  const chosen = currentDesign(item).parts.structure;
  // Until something is chosen there is nothing on the park and nothing else on the strip can be
  // acted on, so the shelf asks to be opened rather than waiting to be found.
  const waiting = !structureChosen(item);

  return (
    <div data-part="build-toolbar"
      className={cn('pointer-events-auto absolute left-2 top-2 z-20 flex items-start gap-2', className)}>
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur-sm">
        {SHELVES.map((s) => {
          const Icon = s.icon;
          const on = open === s.id;
          return (
            <button key={s.id} type="button" data-part={`shelf-${s.id}`} data-waiting={waiting ? 'yes' : undefined}
              aria-expanded={on} aria-label={s.label} title={s.label}
              onClick={() => setOpen(on ? null : s.id)}
              // 44 tall, and as wide as the word needs. A shelf labelled "Struc" is a shelf nobody
              // can read, and the target rule is about what a finger can hit rather than a square.
              className={cn(FOCUS, 'relative flex h-11 min-w-[2.75rem] flex-col items-center justify-center rounded-md px-2',
                on ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wide">{s.label}</span>
              {waiting && !on && (
                <span data-part="shelf-waiting" aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {open === 'structures' && (
        <div data-part="shelf-open" className="w-56 rounded-lg border border-border bg-background/95 p-2 shadow-md backdrop-blur-sm">
          <div className={cn(EYEBROW, 'text-muted-foreground')}>Structures</div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {chosen ? 'What this is being built as.'
              : 'Pick one, then put it on the park. Nothing goes down until you say.'}
          </p>
          <div className="mt-1.5 space-y-1">
            {kinds.map((k) => (
              <button key={k.key} type="button" data-part={`structure-${k.key}`} aria-pressed={chosen === k.key}
                onClick={() => { onChoose(item.id, k.key); setOpen(null); }}
                className={cn(FOCUS, 'flex w-full items-center gap-1.5 rounded-md border-2 px-2 py-1.5 text-left',
                  chosen === k.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60')}>
                {chosen === k.key && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{k.name}</span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">{k.what}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
