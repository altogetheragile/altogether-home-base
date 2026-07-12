import type { ScrumState } from './types';
import { totalPoints, totalValue } from './config';
import { Button } from '@/components/ui/button';

interface BacklogViewProps {
  state: ScrumState;
  onBack: () => void;
}

/** Scaffold view of the three artifacts: the Product Goal, the Definition of
 *  Done, and the ordered Product Backlog. Sprint Planning interaction (forecast
 *  stories into a Sprint against velocity) is the next slice. */
export function BacklogView({ state, onBack }: BacklogViewProps) {
  const { productGoal, definitionOfDone, productBacklog } = state;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sprint Planning</h1>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>

      {/* Product Goal - the Product Backlog's commitment */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
        <p className="text-sm font-medium">{productGoal}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        {/* Product Backlog */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Product Backlog</h2>
            <span className="text-xs text-muted-foreground">
              {productBacklog.length} stories · {totalPoints(productBacklog)} pts · {totalValue(productBacklog)} value
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Story</th>
                  <th className="px-3 py-2 font-medium text-right">Points</th>
                  <th className="px-3 py-2 font-medium text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {productBacklog.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2">{s.title}</td>
                    <td className="px-3 py-2 text-right font-mono">{s.points}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Definition of Done - the Increment's commitment */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Definition of Done</h2>
          <ul className="space-y-1.5 rounded-lg border border-border p-3">
            {definitionOfDone.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-sm">
                <span className="mt-[2px] text-muted-foreground/50">✓</span>
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            A story only counts toward the Increment when it meets every line here.
          </p>
        </section>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Next slice: forecast stories into a Sprint (set a Sprint Goal, commit against your velocity),
        then play it day by day.
      </div>
    </div>
  );
}
