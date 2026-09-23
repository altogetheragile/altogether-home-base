import type { CSSProperties, ElementType, ReactNode } from 'react';

// ============= Words that are not there yet =============
//
// A new site ships with its narrative blank. The alternative was shipping somebody else's life
// story, which a new owner would have to notice before launch rather than after.
//
// Blank has to render as nothing, not as an empty element. `{t('about.story.p1')}` inside a <p>
// leaves four empty paragraphs stacked under a live heading: seventy pixels of nothing, which
// reads as a broken page rather than an unwritten one.

export function Prose({
  text,
  as: Tag = 'p',
  ...rest
}: {
  text: string;
  as?: ElementType;
  style?: CSSProperties;
  className?: string;
}) {
  if (!text?.trim()) return null;
  return <Tag {...rest}>{text}</Tag>;
}

/** Anything to show? Used to drop a whole section, its heading with it. A heading over nothing is
 *  the thing this is all trying to avoid. */
export const has = (...texts: (string | undefined | null)[]) => texts.some((t) => t?.trim());

/** Renders the children only when there is something to put in them. */
export function When({ any, children }: { any: (string | undefined | null)[]; children: ReactNode }) {
  return has(...any) ? <>{children}</> : null;
}
