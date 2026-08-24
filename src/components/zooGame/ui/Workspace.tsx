import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Overlay } from './Overlay';

/** A focused surface for something that is its own piece of work.
 *
 *  Estimating an item, splitting an epic, writing a Product Backlog item: each is a conversation
 *  with its own shape, and each was being rendered inline at the top of a Backlog list that scrolls
 *  inside a fixed height. The result was a panel clipped at the top, sparse across a very wide
 *  column, and competing with the list behind it.
 *
 *  So they take over instead - centred, at a width prose can be read at, over a dimmed park. The
 *  same treatment the design studio already gets, for the same reason: one thing at a time.
 */
export function Workspace({ title, subtitle, onClose, wide, children }: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  /** For a panel with columns of its own, like splitting an epic. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className={cn('m-auto w-full rounded-lg border border-border bg-card shadow-xl', wide ? 'max-w-3xl' : 'max-w-2xl')}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[76vh] overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </Overlay>
  );
}
