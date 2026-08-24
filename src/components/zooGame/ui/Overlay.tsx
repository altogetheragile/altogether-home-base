import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** A full-screen dimmed surface for something that takes over: the toolbox, a workspace panel.
 *
 *  **It is rendered into the body, not where it is written.** "Fixed" does not mean the window - it
 *  means the nearest ancestor carrying a transform, a filter or a backdrop-filter, and Safari adds
 *  a rounded, overflow-hidden box to that list. Opened from inside the Sprint board's Backlog
 *  drawer, which is exactly such a box, the toolbox came up the width of the drawer with its close
 *  button off the edge - and no way out, because the backdrop was inside the drawer too. Nothing
 *  overflowed and nothing errored: it was exactly as wide as it had been told to be.
 *
 *  A portal puts it beyond the reach of whatever it happens to be opened from. Both surfaces use
 *  this one so they cannot drift apart again - they were two copies of the same class string, and
 *  fixing one fixed one.
 *
 *  There are three ways out on purpose: the panel's own control, the backdrop, and Escape. A modal
 *  with one way out is a modal you can be trapped in when that one way is off the edge of it.
 */
export function Overlay({ onClose, labelledBy, children }: {
  onClose: () => void;
  /** The id of whatever names this surface, for anyone not looking at it. */
  labelledBy?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const surface = (
    <div className="fixed inset-0 z-40 flex overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      role="dialog" aria-modal="true" aria-labelledby={labelledBy}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
  return typeof document === 'undefined' ? surface : createPortal(surface, document.body);
}
