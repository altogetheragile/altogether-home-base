import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE, RADIUS, type Tone } from './tokens';

/** The one chip: a small, coloured fact about something. Its tone carries its meaning, so a chip
 *  never needs to explain itself in words as well as colour. */
export function Chip({ tone = 'quiet', icon, title, className, children }: {
  tone?: Tone;
  icon?: ReactNode;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span title={title} className={cn(RADIUS.chip, TONE[tone].chip,
      'flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide', className)}>
      {icon}{children}
    </span>
  );
}

/** A number and what it counts, for the game's read-outs (points, visitors, happiness). */
export function Stat({ value, label, tone = 'quiet', title }: { value: ReactNode; label: string; tone?: Tone; title?: string }) {
  return (
    <div title={title} className="flex items-baseline gap-1.5">
      <span className={cn('font-mono text-sm font-semibold', TONE[tone].text)}>{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
