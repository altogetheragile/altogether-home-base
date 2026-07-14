import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LearningPoint } from './learning';
import { EXAM_URL, EXAM_NAME } from './learning';
import { cn } from '@/lib/utils';
import { Lightbulb, X, ArrowRight } from 'lucide-react';

interface LearningTipProps {
  point: LearningPoint | undefined;
  className?: string;
}

/** A light-touch coaching callout tied to what just happened in the sim, with an
 *  invitation to test the concept on the site's own Scrum Master exam. Dismissible,
 *  so it teaches without nagging. */
export function LearningTip({ point, className }: LearningTipProps) {
  const [dismissed, setDismissed] = useState(false);
  if (!point || dismissed) return null;

  return (
    <div className={cn('rounded-lg border border-amber-300/70 bg-amber-50/70 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20', className)}>
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{point.title}</span>
            <span className="rounded-full bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">{point.area}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{point.body}</p>
          <Link
            to={EXAM_URL}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Test yourself on the {EXAM_NAME} exam <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
