import type { ZooGameState, BacklogItem } from './types';
import { checkCriterion } from './parkChecks';
import { dodVerdicts, unlockedBy } from './dodChecks';
import { isSignOffTask } from './engine';
import { cn } from '@/lib/utils';
import { Check, X, HelpCircle } from 'lucide-react';

// Is it Done?
//
// Three things, in one place, in the order they are answered: the Developers' own plan, this
// item's acceptance criteria, and the Definition of Done that every item meets. They used to be
// three separate lists in two panels, which made "why can this not move" a question you answered
// by looking in three places and holding the answer in your head.
//
// Every line carries its evidence: what the park read, or "your judgement" where nothing in the
// park can measure it. That split is the teaching. A criterion nobody can check is a criterion
// taken on trust, and a Definition of Done full of them is a wish.

type Mark = 'yes' | 'no' | 'judgement';

function Line({ mark, children, evidence }: { mark: Mark; children: React.ReactNode; evidence?: string }) {
  return (
    <li className="flex items-start gap-2 py-0.5">
      <span className={cn('mt-[2px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
        mark === 'yes' ? 'bg-emerald-500 text-white'
          : mark === 'no' ? 'bg-destructive text-white' : 'border border-dashed border-border')}>
        {mark === 'yes' && <Check className="h-2.5 w-2.5" />}
        {mark === 'no' && <X className="h-2.5 w-2.5" />}
      </span>
      <span className="min-w-0">
        <span className={cn('text-[12px]', mark === 'yes' && 'text-muted-foreground line-through decoration-emerald-500/40')}>{children}</span>
        {evidence && <span className="block text-[10px] text-muted-foreground">{evidence}</span>}
      </span>
    </li>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <h4 className="text-[11px] font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">· {note}</span>
      </h4>
      <ul>{children}</ul>
    </div>
  );
}

export function DoneGate({ state, item, className }: { state: ZooGameState; item: BacklogItem; className?: string }) {
  const tasks = (item.tasks ?? []).filter((t) => t.label.trim());
  const criteria = item.acceptance ?? [];
  const dod = dodVerdicts(state, item);
  const waiting = unlockedBy(state, item);

  const stepsLeft = tasks.filter((t) => !t.done).length;
  const criteriaLeft = criteria.filter((_, i) => !item.acConfirmed?.[i]).length;
  const dodLeft = dod.filter((l) => l.answer?.kind === 'fact' && !l.answer.met).length;
  const done = !stepsLeft && !criteriaLeft && !dodLeft;

  return (
    <section className={cn('space-y-3 rounded-lg border border-border bg-card p-3', className)}>
      <div>
        <h3 className="text-sm font-semibold">Is it Done?</h3>
        <p className="text-[11px] text-muted-foreground">Three things, and the game checks what it can.</p>
      </div>

      <Section title="Plan" note="the Developers' steps">
        {tasks.map((t) => (
          <Line key={t.id} mark={t.done ? 'yes' : 'no'}
            evidence={isSignOffTask(t.label) ? 'ticks itself once every criterion is accepted' : undefined}>
            {t.label}
          </Line>
        ))}
        {!tasks.length && <Line mark="judgement">No steps written for this one.</Line>}
      </Section>

      <Section title="Acceptance criteria" note="this item">
        {criteria.map((label, i) => {
          const said = checkCriterion(state, item, label);
          const accepted = !!item.acConfirmed?.[i];
          return (
            <Line key={label} mark={accepted ? 'yes' : said && !said.met ? 'no' : 'judgement'}
              evidence={said ? `the park says: ${said.evidence}` : 'the Product Owner’s judgement'}>
              {label}
            </Line>
          );
        })}
        {!criteria.length && <Line mark="judgement">Nothing written down to accept.</Line>}
      </Section>

      <Section title="Definition of Done" note="every item">
        {dod.map(({ line, answer }) => (
          <Line key={line}
            mark={answer?.kind === 'fact' ? (answer.met ? 'yes' : 'no') : 'judgement'}
            evidence={answer ? `the park says: ${answer.evidence}` : 'your judgement'}>
            {line}
          </Line>
        ))}
        {!dod.length && <Line mark="judgement">No Definition of Done agreed.</Line>}
      </Section>

      {/* What is somebody else's to fix. The difference between being behind and waiting, which is
          the sort of thing a Daily Scrum is for. */}
      {!done && waiting.length > 0 && (
        <p className="rounded-md border border-amber-400/50 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-200">
          Not Done yet, and not all of it is yours.{' '}
          {waiting.map((w) => `${w.item.name} is in this Sprint: build it and ${w.lines.length} of these turn green on their own.`).join(' ')}
        </p>
      )}
      {done && (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-400/50 bg-emerald-500/5 p-2 text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
          <Check className="h-3.5 w-3.5 shrink-0" /> Everything is answered. This one can move to Done.
        </p>
      )}
      {!done && !waiting.length && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <HelpCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
          {stepsLeft ? `${stepsLeft} step${stepsLeft === 1 ? '' : 's'} left on the plan.`
            : criteriaLeft ? `${criteriaLeft} criteri${criteriaLeft === 1 ? 'on' : 'a'} still to accept.`
              : `${dodLeft} line${dodLeft === 1 ? '' : 's'} of the Definition of Done not met yet.`}
        </p>
      )}
    </section>
  );
}
