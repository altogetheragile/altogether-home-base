import { Fragment, type ReactNode } from 'react';
import type { SectionState } from '@altogether/ui/editor/sections';

/** Renders a page's sections in the order this site has put them, skipping the hidden ones.
 *
 *  A section named in the order but missing from the map renders nothing rather than throwing:
 *  the alternative is a saved order taking a whole page down because somebody renamed a component.
 *
 *  A section that has chosen a ground or a shape gets one wrapper, which carries both as custom
 *  properties for everything inside it. A section that has chosen neither gets no wrapper at all,
 *  so the markup of a site that has never touched either is byte for byte what it was. */
export function sectionNodes(order: SectionState[], nodes: Record<string, ReactNode>): ReactNode {
  return order
    .filter((s) => s.visible && nodes[s.section])
    .map((s) => (
      <Fragment key={s.section}>
        {wrap(s, nodes[s.section])}
      </Fragment>
    ));
}

/** The classes one section's choices come to. Nothing chosen is no classes, and no classes is no
 *  wrapper: the whole design rests on an untouched site rendering what it always rendered. */
export function shapeClasses(s: SectionState): string {
  return [
    s.band && `aa-band aa-band--${s.band}`,
    s.space && `aa-space--${s.space}`,
    s.across && `aa-across--${s.across}`,
    s.side && `aa-side--${s.side}`,
  ].filter(Boolean).join(' ');
}

function wrap(s: SectionState, node: ReactNode): ReactNode {
  const classes = shapeClasses(s);
  return classes ? <div className={classes}>{node}</div> : node;
}
