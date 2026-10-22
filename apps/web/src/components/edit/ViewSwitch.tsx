'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, PenLine } from 'lucide-react';
import { setVisitorView } from '@/app/actions/view';

// ============= Admin view or visitor view =============
//
// Bottom-left, because the editor's launcher has the bottom-right. Shown to an administrator in
// both views: in the visitor's view it is the only thing on the page that is not the visitor's,
// and it has to be, or there would be no way back.

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

  return (
    <div
      role="radiogroup"
      aria-label="How to see this site"
      aria-busy={pending}
      className={`fixed bottom-6 left-6 z-[60] flex items-center gap-0.5 rounded-full bg-foreground p-1 text-sm font-medium text-background shadow-lg ${pending ? 'opacity-70' : ''}`}
    >
      {option(false, 'Admin view', PenLine)}
      {option(true, 'Visitor view', Eye)}
    </div>
  );
}
