import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE, RADIUS, EYEBROW, type Tone } from './tokens';

/** The one panel. Every boxed thing in the game is this, in one of three weights:
 *  `quiet` recedes, `soft` is tinted by its meaning, `strong` is the thing you are meant to act on.
 *  An `empty` panel is dashed, for something that does not exist yet. */
export function Panel({ tone = 'quiet', weight = 'quiet', title, aside, empty, className, children }: {
  tone?: Tone;
  weight?: 'quiet' | 'soft' | 'strong';
  /** An eyebrow above the contents, in the panel's own tone. */
  title?: ReactNode;
  /** Anything sitting hard right of the title. */
  aside?: ReactNode;
  /** Nothing here yet - dashed, so absence reads as absence rather than as a mistake. */
  empty?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <section className={cn(RADIUS.panel, 'border px-3 py-2.5',
      empty ? 'border-dashed border-border/70' : weight === 'quiet' ? 'border-border bg-card' : t[weight],
      className)}>
      {(title || aside) && (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          {title && <div className={cn(EYEBROW, tone === 'quiet' ? 'text-muted-foreground' : t.text)}>{title}</div>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
