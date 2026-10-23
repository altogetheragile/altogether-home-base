'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, PenLine } from 'lucide-react';
import { setVisitorView } from '@/app/actions/view';

// ============= Admin view or visitor view =============
//
// Bottom-left, because the editor's launcher has the bottom-right. Shown to an administrator in
// both views: in the visitor's view it is the only thing on the page that is not the visitor's,
// and it has to be, or there would be no way back.
//
// Tucked against the edge as a faint tab showing which view you are in, and opened by pointing at
// it, tapping it or tabbing to it. As a full pill it sat on top of every page, and in the visitor's
// view it was the one thing a visitor would never see.

export function ViewSwitch({ asVisitor }: { asVisitor: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (visitor: boolean) => {
    if (visitor === asVisitor || pending) return;
    start(async () => {
      await setVisitorView(visitor);
      // The page is rendered on the server from the cookie, so it has to be rendered again.
      router.refresh();
    });
  };

  const option = (visitor: boolean, label: string, Icon: typeof Eye) => {
    const on = visitor === asVisitor;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => choose(visitor)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
          on ? 'bg-background text-foreground' : 'text-background/80 hover:text-background'}`}
      >
        <Icon size={14} />
        {label}
      </button>
    );
  };

  const [open, setOpen] = useState(false);
  // Safari does not focus a button when it is clicked, so pressing an option reads as focus
  // leaving, and closing on that took the options away before the click landed. Focus leaving
  // closes it only when the pointer is not over it.
  const pointerOver = useRef(false);
  const Current = asVisitor ? Eye : PenLine;

  return (
    <div
      className="fixed bottom-6 left-0 z-[60] flex items-center"
      onMouseEnter={() => { pointerOver.current = true; setOpen(true); }}
      onMouseLeave={() => { pointerOver.current = false; setOpen(false); }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!pointerOver.current && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
    >
      {/* Always there, so focus has somewhere to stay while the options open beside it. */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={asVisitor ? 'Visitor view. Change how you see this site' : 'Admin view. Change how you see this site'}
        // Opens only: pointing at it or focusing it has usually opened it already, and a toggle
        // would shut it again under the click. Tapping anywhere else closes it.
        onClick={() => setOpen(true)}
        className={`flex items-center rounded-r-full py-2.5 pl-1.5 pr-2 text-background shadow transition-colors hover:bg-foreground focus-visible:bg-foreground ${
          open ? 'bg-foreground' : 'bg-foreground/25'}`}
      >
        <Current size={14} />
      </button>
      {open && (
        <div
          role="radiogroup"
          aria-label="How to see this site"
          aria-busy={pending}
          className={`ml-1.5 flex items-center gap-0.5 rounded-full bg-foreground p-1 text-sm font-medium text-background shadow-lg ${pending ? 'opacity-70' : ''}`}
        >
          {option(false, 'Admin view', PenLine)}
          {option(true, 'Visitor view', Eye)}
        </div>
      )}
    </div>
  );
}
