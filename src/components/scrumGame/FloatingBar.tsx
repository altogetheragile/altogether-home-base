import type { ReactNode } from 'react';

/** A pinned, centred action bar so the phase's primary controls stay in view
 *  without scrolling. Shared by the Sprint board, Review and Retrospective. */
export function FloatingBar({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
        {children}
      </div>
    </div>
  );
}
