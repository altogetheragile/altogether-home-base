import { useState } from 'react';
import type { GoalShape, GoalMeasure, GoalMetric } from './types';
import { GOAL_METRICS } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { ChevronDown, Plus, Trash2, Sparkles } from 'lucide-react';

// ============= Other ways to write a Product Goal =============
//
// The Scrum Guide says a Product Goal describes a future state of the product, and says nothing at
// all about its shape. So a plain sentence is enough, and always was - this panel is an optional
// detour, not a better answer.
//
// The two formats here are borrowed from elsewhere entirely: objectives and key results from
// management-by-objectives, epic user stories from XP by way of every agile team since. Both are
// common, neither is Scrum, and the game says so plainly rather than letting a learner walk into an
// exam believing the Guide mandates a user story.
//
// What they DO give you is measures - and the measures here are real ones, chosen from things the
// park actually counts. A key result you cannot observe is an opinion with a number next to it, so
// the game will not let you write one.

const SHAPES: { key: GoalShape; label: string; blurb: string }[] = [
  { key: 'outcome', label: 'A plain outcome', blurb: 'One sentence describing the future state of the product. All the Guide asks for.' },
  { key: 'okr', label: 'Objective and key results', blurb: 'The objective, then the observable measures that would tell you it had happened.' },
  { key: 'epic', label: 'An epic user story', blurb: 'As a … I want … so that …, with the measures as acceptance criteria.' },
];

/** The worked examples from the training deck, so a learner sees what good looks like before writing
 *  their own. Deliberately from another product entirely - copying a zoo answer teaches nothing. */
const EXAMPLE: Record<GoalShape, string> = {
  outcome: 'Open a zoo that visitors love and come back to.',
  okr: 'People who start BestU carry on after an initial two-week period to maintain healthy eating and exercise habits.\n\nKey results: 80% of people who start using it continue to; they interact at least 3 times a week; we lose less than 10% of customers after 3 months.',
  epic: 'As a dieter I want to eat healthily and take regular exercise so that I can feel better about myself and improve my well-being.\n\nAcceptance criteria: 80% who start continue; interact at least 3 times a week; less than 10% lost after 3 months; achieved by the end of Q4.',
};

function MeasureRow({ measure, onChange, onRemove }: { measure: GoalMeasure; onChange: (m: GoalMeasure) => void; onRemove: () => void }) {
  const spec = GOAL_METRICS.find((g) => g.key === measure.metric) ?? GOAL_METRICS[0];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">At least</span>
      <input type="number" min={0} value={measure.target} onChange={(e) => onChange({ ...measure, target: Math.max(0, Number(e.target.value) || 0) })}
        aria-label="Target" className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-right text-[12px] tabular-nums outline-none focus:border-primary" />
      <span className="shrink-0 text-[11px] text-muted-foreground">{spec.unit}</span>
      <select value={measure.metric} onChange={(e) => onChange({ ...measure, metric: e.target.value as GoalMetric })}
        aria-label="What to measure" className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[12px] outline-none focus:border-primary">
        {GOAL_METRICS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
      </select>
      <button type="button" onClick={onRemove} aria-label="Remove this measure" className="shrink-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** The optional panel. Collapsed by default: a plain sentence is the default answer, and this should
 *  read as "there are other ways to do this" rather than "you have not finished yet". */
export function GoalShapes({ goal, shape, measures, onSet }: {
  goal: string;
  shape?: GoalShape;
  measures?: GoalMeasure[];
  onSet: (shape: GoalShape, goal: string, measures: GoalMeasure[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<GoalShape>(shape ?? 'outcome');
  const [draft, setDraft] = useState(goal);
  const [rows, setRows] = useState<GoalMeasure[]>(measures?.length ? measures : [{ metric: 'happiness', target: 70 }]);
  const current = SHAPES.find((s) => s.key === pick)!;

  return (
    <section className="rounded-lg border border-dashed border-border bg-muted/20">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="min-w-0">
          <span className="text-[13px] font-semibold">Other ways to write a Product Goal</span>
          <span className="ml-1.5 text-[11px] text-amber-700 dark:text-amber-400">none of them Scrum</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-3 py-2.5">
          <p className="text-[11px] leading-snug text-muted-foreground">
            The Scrum Guide says a Product Goal describes a future state of the product. It says nothing about the
            shape, so a plain sentence is enough. These two formats are borrowed from elsewhere - objectives and key
            results from management by objectives, epic user stories from XP - and they are common practice rather
            than part of Scrum. What they add is <strong className="text-foreground">measures you could actually
            observe</strong>, which is the part worth stealing.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {SHAPES.map((s) => (
              <button key={s.key} type="button" onClick={() => setPick(s.key)}
                className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  pick === s.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">{current.blurb}</p>

          <div className="rounded-md border border-border bg-background/60 p-2">
            <div className={cn(EYEBROW, 'mb-1 text-muted-foreground')}>For example</div>
            <p className="whitespace-pre-line text-[11px] italic leading-snug text-muted-foreground">{EXAMPLE[pick]}</p>
          </div>

          <label className="block space-y-1">
            <span className={cn(EYEBROW, 'text-muted-foreground')}>
              {pick === 'epic' ? 'Your Product Goal, as a story' : pick === 'okr' ? 'Your objective' : 'Your Product Goal'}
            </span>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={pick === 'outcome' ? 2 : 3}
              placeholder={pick === 'epic' ? 'As a … I want … so that …' : 'One clear outcome'}
              className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[13px] outline-none focus:border-primary" />
          </label>

          {pick !== 'outcome' && (
            <div className="space-y-1.5">
              <div className={cn(EYEBROW, 'text-muted-foreground')}>
                {pick === 'okr' ? 'Key results' : 'Acceptance criteria'}
                <span className="ml-1 font-normal normal-case tracking-normal">- things the park counts, so the Review can check them</span>
              </div>
              {rows.map((m, i) => (
                <MeasureRow key={i} measure={m}
                  onChange={(next) => setRows(rows.map((r, j) => (j === i ? next : r)))}
                  onRemove={() => setRows(rows.filter((_, j) => j !== i))} />
              ))}
              {rows.length < 4 && (
                <button type="button" onClick={() => setRows([...rows, { metric: 'visitors', target: 800 }])}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <Plus className="h-3 w-3" /> Add a measure
                </button>
              )}
            </div>
          )}

          <Button size="sm" className="w-full" disabled={!draft.trim()}
            onClick={() => { onSet(pick, draft, pick === 'outcome' ? [] : rows.filter((r) => r.target > 0)); setOpen(false); }}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Use this as the Product Goal
          </Button>
        </div>
      )}
    </section>
  );
}
