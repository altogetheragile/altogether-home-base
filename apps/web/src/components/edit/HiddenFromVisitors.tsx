'use client';

import { usePathname } from 'next/navigation';
import { EyeOff } from 'lucide-react';
import { MODULE_FOR_PATH } from '@/lib/copy/routes';

// ============= Saying out loud that nobody else can see this =============
//
// An admin can now open a page that is switched off. That is the point, and it is also the risk:
// what you see and what a visitor sees have come apart, and the page gives no sign of it. Somebody
// switches About off, keeps working on it, and tells people to go and look.
//
// So this is deliberately loud. A tasteful grey note at the bottom is the version that gets
// missed.

export function HiddenFromVisitors({ hidden }: { hidden: Record<string, boolean> }) {
  const pathname = usePathname();
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const module = MODULE_FOR_PATH[clean];
  if (!module || !hidden[module]) return null;

  return (
    <div className="sticky top-0 z-[55] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <EyeOff size={15} className="shrink-0" />
      <span>
        Hidden. Visitors get a Not Found page here. You can see it because you are signed in as an
        administrator.
      </span>
    </div>
  );
}
