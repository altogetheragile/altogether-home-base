import type { CSSProperties, ElementType, ReactNode } from 'react';
import { Editable } from '@/components/edit/Editable';

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
  k,
  label,
  ...rest
}: {
  text: string;
  as?: ElementType;
  /** The copy key this came from. Given one, the words carry their own pen, which is a great
   *  deal less work than wrapping every call site by hand and a great deal safer: nothing about
   *  the markup moves, because the wrapper is inside the component that already renders it. */
  k?: string;
  label?: string;
  style?: CSSProperties;
  className?: string;
}) {
  // Nothing to show, nothing to hover. An unwritten field is reached from the drawer; a pen
  // floating over a zero-height gap is not a way to find anything.
  if (!text?.trim()) return null;
  const words = <Tag {...rest}>{text}</Tag>;
  return k ? <Editable k={k} label={label ?? 'this text'} as="div" block>{words}</Editable> : words;
}

/** Anything to show? Used to drop a whole section, its heading with it. A heading over nothing is
 *  the thing this is all trying to avoid. */
export const has = (...texts: (string | undefined | null)[]) => texts.some((t) => t?.trim());

/** Renders the children only when there is something to put in them. */
export function When({ any, children }: { any: (string | undefined | null)[]; children: ReactNode }) {
  return has(...any) ? <>{children}</> : null;
}
