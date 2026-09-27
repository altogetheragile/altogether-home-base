import { Fragment, type ReactNode } from 'react';
import type { SectionState } from '@altogether/ui/editor/sections';

/** Renders a page's sections in the order this site has put them, skipping the hidden ones.
 *
 *  A section named in the order but missing from the map renders nothing rather than throwing:
 *  the alternative is a saved order taking a whole page down because somebody renamed a component.
 *
 *  A section that has chosen a band gets one wrapper, which carries the ground and the ink for
 *  everything inside it as custom properties. A section that has not gets no wrapper at all, so
 *  the markup of a site that has never touched a colour is byte for byte what it was. */
export function sectionNodes(order: SectionState[], nodes: Record<string, ReactNode>): ReactNode {
  return order
    .filter((s) => s.visible && nodes[s.section])
    .map((s) => (
      <Fragment key={s.section}>
        {s.band ? <div className={`aa-band aa-band--${s.band}`}>{nodes[s.section]}</div> : nodes[s.section]}
      </Fragment>
    ));
}
