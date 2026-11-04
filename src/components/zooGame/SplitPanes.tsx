import { type ReactNode, useSyncExternalStore } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

// Two panes with a bar between them that you drag. Asked for from the Refinement screen, where the
// Product Backlog took most of the width and the Definition of Done beside it was too narrow to
// read: "Can we make the panels resizable? I can drag the vertical bars between to move left and
// right or up and down for horizontal bars."
//
// Only where the panes sit side by side (or one over the other at a fixed height). Below the
// breakpoint they stack as before and there is nothing to drag. Where somebody leaves the bar is
// remembered in this browser, per screen, so it stays where they put it.

const WIDTH = { md: 768, lg: 1024, xl: 1280 } as const;

function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    (on) => {
      const mq = typeof window !== 'undefined' ? window.matchMedia?.(`(min-width: ${px}px)`) : undefined;
      mq?.addEventListener?.('change', on);
      return () => mq?.removeEventListener?.('change', on);
    },
    () => (typeof window !== 'undefined' && !!window.matchMedia?.(`(min-width: ${px}px)`).matches),
    () => false,
  );
}

export function SplitPanes({ id, direction = 'horizontal', from = 'lg', sizes, min = [20, 20], first, second, clip, stackedClassName, className, firstClassName, secondClassName }: {
  /** Names the screen, so each remembers its own split. */
  id: string;
  /** `horizontal`: side by side, with a vertical bar. `vertical`: one over the other. */
  direction?: 'horizontal' | 'vertical';
  /** The width from which the panes split. Below it they stack. */
  from?: keyof typeof WIDTH;
  /** Where the bar starts, as percentages of the whole. */
  sizes: [number, number];
  /** How small either pane can be dragged, as percentages. */
  min?: [number, number];
  first: ReactNode;
  /** Nothing: there is one pane, and no bar. */
  second?: ReactNode;
  /** Clip each pane at the bar, for panes of a fixed height that scroll inside themselves. */
  clip?: boolean;
  /** The layout when stacked, which is the layout the screen had before. */
  stackedClassName?: string;
  className?: string;
  firstClassName?: string;
  secondClassName?: string;
}) {
  const split = useMinWidth(WIDTH[from]);
  const two = second !== undefined && second !== null && second !== false;
  if (!split || !two) {
    return (
      <div className={stackedClassName}>
        <div className={firstClassName}>{first}</div>
        {two && <div className={secondClassName}>{second}</div>}
      </div>
    );
  }
  const overflow = clip ? 'hidden' : 'visible';
  const across = direction === 'horizontal';
  return (
    <PanelGroup direction={direction} autoSaveId={`zoo-split:${id}`} className={cn('min-h-0', className)} data-part="split-panes" data-split={id}>
      {/* Visible overflow unless asked, so a pane's own shadows and menus are not clipped at the bar. */}
      <Panel id={`${id}-a`} order={1} defaultSize={sizes[0]} minSize={min[0]} style={{ overflow }} className={cn('min-w-0', firstClassName)}>
        {first}
      </Panel>
      <PanelResizeHandle data-part="split-bar" aria-label="Drag to resize"
        className={cn('group relative flex shrink-0 items-center justify-center rounded-full outline-none transition-colors',
          'hover:bg-primary/15 focus-visible:bg-primary/20 data-[resize-handle-state=drag]:bg-primary/25',
          across ? 'mx-1 w-2.5 cursor-col-resize' : 'my-1 h-2.5 cursor-row-resize')}>
        <span className={cn('absolute rounded-full bg-border group-hover:bg-primary/50', across ? 'inset-y-2 left-1/2 w-px -translate-x-1/2' : 'inset-x-2 top-1/2 h-px -translate-y-1/2')} />
        <span className="z-10 flex items-center justify-center rounded-sm border border-border bg-card px-px py-1 text-muted-foreground shadow-sm group-hover:text-foreground">
          {across ? <GripVertical className="h-3.5 w-3" /> : <GripHorizontal className="h-3 w-3.5" />}
        </span>
      </PanelResizeHandle>
      <Panel id={`${id}-b`} order={2} defaultSize={sizes[1]} minSize={min[1]} style={{ overflow }} className={cn('min-w-0', secondClassName)}>
        {second}
      </Panel>
    </PanelGroup>
  );
}
