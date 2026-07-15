import type { ComponentType } from 'react';
import type { ScrumState } from './types';
import { cn } from '@/lib/utils';
import {
  Search, CalendarCheck, Mail, CalendarClock, CalendarX, BellRing, CreditCard,
  ListChecks, Users, Accessibility, LayoutDashboard, BarChart3,
  Link2, ShieldCheck, Package, Check,
} from 'lucide-react';

interface BuildCanvasProps {
  state: ScrumState;
  /** Compact mode for the board (smaller tiles, no big heading). */
  compact?: boolean;
}

/** Which icon each theme visualKey draws with. Unknown keys fall back to a box. */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  browse: Search, book: CalendarCheck, email: Mail, reschedule: CalendarClock,
  cancel: CalendarX, reminders: BellRing, pay: CreditCard, manage: ListChecks,
  waitlist: Users, accessibility: Accessibility, admin: LayoutDashboard, analytics: BarChart3,
  partner: Link2, consent: ShieldCheck, group: Users,
};

/** The visible Increment: every backlog item is a component on the build canvas.
 *  As stories reach Done, their component lights up, so the product literally
 *  assembles in front of the player. Themes swap the icons and the metaphor. */
export function BuildCanvas({ state, compact }: BuildCanvasProps) {
  const items = state.productBacklog;
  const built = items.filter((s) => s.status === 'done').length;

  return (
    <section className="space-y-2">
      {!compact && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{state.theme.buildMetaphor}</h2>
          <span className="font-mono text-xs text-muted-foreground">{built} / {items.length} components built</span>
        </div>
      )}
      <div className={cn('rounded-lg border border-border bg-muted/20 p-3')}>
        {compact && (
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">The product so far</span>
            <span className="font-mono text-[11px] text-muted-foreground">{built} / {items.length}</span>
          </div>
        )}
        <div className={cn('grid gap-2', compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4')}>
          {items.map((s) => {
            const Icon = (s.visualKey && ICONS[s.visualKey]) || Package;
            const done = s.status === 'done';
            return (
              <div
                key={s.id}
                title={s.title}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition-all',
                  compact ? 'aspect-square' : 'min-h-[76px]',
                  done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-dashed border-border bg-background text-muted-foreground/50',
                )}
              >
                {done && <Check className="absolute right-1 top-1 h-3 w-3 text-emerald-600" />}
                <Icon className={cn(compact ? 'h-5 w-5' : 'h-6 w-6', done ? '' : 'opacity-40')} />
                {!compact && <span className={cn('line-clamp-2 text-[10px] leading-tight', !done && 'opacity-70')}>{s.title}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
