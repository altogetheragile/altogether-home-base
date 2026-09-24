import { Fragment, type ReactNode } from 'react';
import type { SectionState } from '@/lib/sections';

/** Renders a page's sections in the order this site has put them, skipping the hidden ones.
 *
 *  A section named in the order but missing from the map renders nothing rather than throwing:
 *  the alternative is a saved order taking a whole page down because somebody renamed a component. */
export function sectionNodes(order: SectionState[], nodes: Record<string, ReactNode>): ReactNode {
  return order
    .filter((s) => s.visible && nodes[s.section])
    .map((s) => <Fragment key={s.section}>{nodes[s.section]}</Fragment>);
}
