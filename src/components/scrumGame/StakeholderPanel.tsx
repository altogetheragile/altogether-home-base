import type { ScrumState } from './types';
import { getTheme } from './theme';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface StakeholderPanelProps {
  state: ScrumState;
  /** Highlight movement since last Sprint (used on the Review). */
  previous?: Record<string, number>;
}

const barTone = (v: number) => (v >= 67 ? 'bg-emerald-500' : v >= 34 ? 'bg-amber-500' : 'bg-rose-500');

/** The stakeholders and how happy each is right now. Their agendas conflict, so
 *  what you choose to deliver pleases some and neglects others - the prioritisation
 *  tension the Product Owner lives with. */
export function StakeholderPanel({ state, previous }: StakeholderPanelProps) {
  return (
    <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Stakeholders</h2>
        <span className="text-[11px] text-muted-foreground">their agendas conflict - you can't please everyone every Sprint</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {getTheme(state.theme.id).stakeholders.map((sh) => {
          const v = Math.round(state.satisfaction[sh.id] ?? 50);
          const delta = previous ? v - Math.round(previous[sh.id] ?? 50) : 0;
          return (
            <div key={sh.id} className="rounded-md border border-border bg-card p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{sh.name}</span>
                <span className="flex items-baseline gap-1 font-mono text-xs text-muted-foreground">
                  {v}
                  {previous && delta !== 0 && (
                    <span className={cn('text-[10px]', delta > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', barTone(v))} style={{ width: `${v}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{sh.agenda}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
