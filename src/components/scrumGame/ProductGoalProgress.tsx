import type { ScrumState } from './types';
import { productGoalTotalValue, productGoalDeliveredValue, productGoalProgress } from './engine';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

interface ProductGoalProgressProps {
  state: ScrumState;
  className?: string;
}

/** Progress toward the Product Goal, accumulated across Sprints: the share of the
 *  product's value that has been delivered and accepted. The Product Backlog is
 *  ordered toward this Goal, so a healthy game bends the bar upward each Sprint. */
export function ProductGoalProgress({ state, className }: ProductGoalProgressProps) {
  const total = productGoalTotalValue(state);
  const delivered = productGoalDeliveredValue(state);
  const pct = Math.round(productGoalProgress(state) * 100);

  return (
    <div className={cn('rounded-lg border border-primary/30 bg-primary/5 px-4 py-3', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{delivered} / {total} value · {pct}%</span>
      </div>
      <p className="mb-2 text-sm font-medium">{state.productGoal}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
