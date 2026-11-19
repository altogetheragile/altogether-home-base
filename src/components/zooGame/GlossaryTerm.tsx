import { useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { glossary, markTerms, type GlossaryEntry } from './glossary';

// A word with its definition a press away: dotted underline, and a small card on press.
//
// The card is not portalled. Sam's prompt and the Daily Scrum are dialogs, and a dialog keeps the
// focus and the screen reader inside itself, so a definition drawn outside it could be neither
// reached nor heard (the sm7 playtest found what that costs). Drawn inside, it is part of whatever
// it was opened from.

function Term({ entry, children }: { entry: GlossaryEntry; children: string }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button type="button" data-part="glossary-term" data-term={entry.id}
          aria-label={`${children}: what it means`}
          className={cn(FOCUS, 'cursor-help rounded-sm font-[inherit] text-[length:inherit] underline decoration-dotted decoration-2 underline-offset-[3px] hover:decoration-solid')}>
          {children}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content data-part="glossary-card" side="top" align="start" sideOffset={6} collisionPadding={12}
        className="zoo-theme z-[70] w-72 rounded-xl border-2 border-[hsl(var(--zoo-ink))] bg-white p-3 text-left text-sm font-normal leading-snug text-foreground shadow-[3px_3px_0_hsl(var(--zoo-ink))] outline-none">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{entry.term}</p>
        <p className="mt-1">{entry.definition}</p>
        {entry.notScrum && <p className="mt-1.5 text-xs italic text-zoo-quiet">{entry.notScrum}</p>}
        <p className="mt-2 text-[11px] text-zoo-quiet">Every term is in Learn, under Glossary.</p>
        <PopoverPrimitive.Arrow className="fill-[hsl(var(--zoo-ink))]" />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

/** Text with each glossary term's first mention pressable. */
export function TermText({ text }: { text: string }) {
  const entries = useMemo(() => glossary(), []);
  const pieces = useMemo(() => markTerms(text, entries), [text, entries]);
  return (
    <>
      {pieces.map((p, i) => {
        if (typeof p === 'string') return <span key={i}>{p}</span>;
        const entry = entries.find((e) => e.id === p.id)!;
        return <Term key={i} entry={entry}>{p.text}</Term>;
      })}
    </>
  );
}

/** Every term, A to Z, for the Learn drawer. */
export function GlossaryBody() {
  const entries = useMemo(() => glossary(), []);
  return (
    <div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        The words the game uses, A to Z. Words in Sam&rsquo;s prompts can be pressed for the same definitions.
      </p>
      <dl data-part="glossary" className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="rounded-md border border-border bg-card px-2 py-1.5">
            <dt className="text-xs font-semibold">{e.term}</dt>
            <dd className="text-[11px] leading-snug text-muted-foreground">
              {e.definition}
              {e.notScrum && <span className="mt-0.5 block italic text-zoo-quiet">{e.notScrum}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
