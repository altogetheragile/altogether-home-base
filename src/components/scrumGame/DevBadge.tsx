import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface DevBadgeProps {
  initials: string;
  /** A tailwind bg-* class from the roster palette (devColor). */
  colorClass: string;
  size?: 'sm' | 'md';
  title?: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

/** A Developer's avatar: a coloured circle with their initials. Shared by the
 *  bench and the story cards so a person reads the same everywhere. */
export function DevBadge({ initials, colorClass, size = 'md', title, className, onClick }: DevBadgeProps) {
  const dims = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[11px]';
  const Cmp = onClick ? 'button' : 'span';
  return (
    <Cmp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white shrink-0',
        dims,
        colorClass,
        onClick && 'transition-transform hover:scale-110 cursor-pointer',
        className,
      )}
    >
      {initials}
    </Cmp>
  );
}
