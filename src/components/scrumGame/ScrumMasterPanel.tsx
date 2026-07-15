import type { Impediment } from './types';
import { IMPEDIMENT_EFFECT } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle, Ban } from 'lucide-react';

interface ScrumMasterPanelProps {
  scrumMaster: string;
  impediment: Impediment | null;
  onClear: () => void;
  disabled?: boolean;
}

const pctLost = (retained: number) => Math.round((1 - retained) * 100);

/** The Daily Scrum's impediment slot, owned by the Scrum Master. Every impediment
 *  costs the team some capacity when the day is run; the Scrum Master acting on it
 *  reduces that hit (and, for a blocker, advances it toward being cleared) - it
 *  does not make it free. Blockers persist across days until escalated clear. */
export function ScrumMasterPanel({ scrumMaster, impediment, onClear, disabled }: ScrumMasterPanelProps) {
  const active = !!impediment && !impediment.addressed;
  const isBlocker = impediment?.kind === 'blocker';
  const effect = impediment ? IMPEDIMENT_EFFECT[impediment.kind] : null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3',
        active
          ? isBlocker
            ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30'
            : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'
          : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <ShieldCheck className={cn('h-5 w-5', active ? 'text-muted-foreground' : 'text-emerald-600')} />
        <div className="leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scrum Master</div>
          <div className="text-sm font-medium">{scrumMaster}</div>
        </div>
      </div>

      <div className="min-w-[12rem] flex-1">
        {impediment ? (
          <div className="flex items-start gap-2">
            {isBlocker
              ? <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
            <div>
              <div className="text-sm font-medium">
                {impediment.title}
                <span className={cn('ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                  isBlocker ? 'bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200' : 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200')}>
                  {isBlocker ? 'Blocker' : 'Distraction'}
                </span>
                {isBlocker && impediment.daysToResolve != null && (
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{impediment.daysToResolve} day{impediment.daysToResolve > 1 ? 's' : ''} to clear</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{impediment.detail}</p>
              {effect && (
                <p className="text-[11px] text-muted-foreground">
                  {impediment.addressed
                    ? <span className="text-emerald-700 dark:text-emerald-400">Being handled - costs about {pctLost(effect.addressed)}% of today.</span>
                    : <>Ignored it costs {pctLost(effect.ignored)}% of the day; {isBlocker ? 'escalating' : 'handling'} it, about {pctLost(effect.addressed)}%.</>}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-emerald-800 dark:text-emerald-300">No impediments today. The way is clear.</p>
        )}
      </div>

      {active && (
        <Button size="sm" onClick={onClear} disabled={disabled} className="shrink-0">
          {isBlocker ? 'Escalate blocker' : 'Clear impediment'}
        </Button>
      )}
    </div>
  );
}
