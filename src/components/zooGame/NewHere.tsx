import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** "This is new, and here is why it turned up."
 *
 *  An idea that waited for the Sprint where it matters has to introduce itself when it arrives,
 *  or it just looks like something that was always there and the learner missed. One chip, on the
 *  thing itself, saying what it is and why now. It stops being new after the Sprint it appeared in.
 */
export function NewHere({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title={`New: ${title}`}
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/20">
          <Sparkles className="h-2.5 w-2.5" /> New
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="mt-1 space-y-1.5 text-[12px] leading-snug text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
