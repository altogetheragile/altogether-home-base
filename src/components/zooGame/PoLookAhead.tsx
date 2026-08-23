import type { PbiDraft } from './types';
import type { Proposal } from './lookAhead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { Lightbulb, Plus, Scissors, X } from 'lucide-react';

/** The Product Owner, thinking ahead out loud.
 *
 *  One at a time, and always with the reason first. A list of five suggestions is a form to fill
 *  in; one noticing, with why it matters, is a colleague saying something worth hearing - and you
 *  can disagree with it, which is the point. The Backlog is the Product Owner's, and what goes in
 *  it is a decision somebody makes rather than something that accumulates.
 */
export function PoLookAhead({ proposals, onAdd, onSplit, onDecline, className }: {
  proposals: Proposal[];
  onAdd: (draft: PbiDraft) => void;
  onSplit: (epicId: string, memberIds: string[]) => void;
  onDecline: (id: string) => void;
  className?: string;
}) {
  const p = proposals[0];
  if (!p) return null;
  const more = proposals.length - 1;

  return (
    <div className={cn('rounded-lg border border-violet-400/60 bg-violet-500/[0.06] px-3 py-2.5', className)}>
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className={cn(EYEBROW, 'mb-0.5 text-violet-700 dark:text-violet-300')}>
            The Product Owner has been looking ahead
            {more > 0 && <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground">{more} more after this</span>}
          </div>
          <p className="text-[13px] leading-snug">{p.why}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {p.kind === 'add'
              ? <>Add <strong className="font-semibold text-foreground">{p.label}</strong> to the Product Backlog? It arrives
                unsized, like anything else you would write - refine it and the Developers will size it.</>
              : <>Break <strong className="font-semibold text-foreground">{p.label}</strong> up, so what is inside it can be
                sized and pulled? An epic is an idea; a Backlog item is something you can finish.</>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-7 px-2.5 text-xs"
              onClick={() => (p.kind === 'add' ? onAdd(p.draft) : onSplit(p.epicId, p.memberIds))}>
              {p.kind === 'add' ? <><Plus className="mr-1 h-3.5 w-3.5" /> Add it</> : <><Scissors className="mr-1 h-3.5 w-3.5" /> Split it out</>}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => onDecline(p.id)}>
              <X className="mr-1 h-3.5 w-3.5" /> Not this one
            </Button>
            <span className="text-[11px] text-muted-foreground">Turning it down is a decision too - it will not be put again.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
