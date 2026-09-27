'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';

// ============= A pen on the thing itself =============
//
// The drawer knows every field a page has. It does not know which words on the screen each one
// is, and neither does anybody reading a list of thirty-eight labels. Finding the founder
// heading meant guessing between "Founder heading", "Founder section, small heading" and
// "Founder section, introduction", and the spreadsheet has the same problem in a wider column.
//
// So the mapping goes the other way. Hover the words, press the pen, and the drawer opens at
// that box. The page knows which key it rendered; it is the only thing that does.
//
// Deliberately not in-place editing. Of the nine field types only three are plain text, and the
// rest - lists, rows of items, section order, pictures, colours - have no sensible in-place form,
// so that road ends in two editors that behave differently. This is the half that solves the
// problem people actually have.

/** Whether to draw pens at all. False for everybody but an administrator, and then nothing is
 *  rendered: a visitor's page should not carry a map of the editor in its markup. */
const CanEdit = createContext(false);

/** Whether to show every pen at once rather than one under the cursor.
 *
 *  On while the drawer is open, because that is exactly when somebody is asking "what can I
 *  change here". One pen at a time means sweeping the page to find out, which is the problem this
 *  was meant to solve rather than a smaller version of it. */
const ShowAll = createContext(false);

export function EditableArea({ on, children }: { on: boolean; children: React.ReactNode }) {
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (!on) return;
    const heard = (e: Event) => setEditorOpen(Boolean((e as CustomEvent<{ open: boolean }>).detail?.open));
    window.addEventListener('aa:editor', heard);
    return () => window.removeEventListener('aa:editor', heard);
  }, [on]);

  return (
    <CanEdit.Provider value={on}>
      <ShowAll.Provider value={editorOpen}>{children}</ShowAll.Provider>
    </CanEdit.Provider>
  );
}

/** Which tab a key belongs to, from the key itself. */
export function tabFor(key: string): string {
  const first = key.split('.')[0];
  if (first === 'nav' || first === 'footer') return 'navigation';
  return first;
}

export function Editable({
  k, label, as: Tag = 'span', block = false, outside = false, fill = false, children,
}: {
  /** The copy key these words came from. */
  k: string;
  /** What the pen says it edits, for a screen reader and for the tooltip. */
  label?: string;
  as?: 'span' | 'div';
  /** Block content needs a block wrapper, or the pen sits beside a paragraph rather than on it. */
  block?: boolean;
  /** Just outside the top-right corner rather than inside it. For a button, where inside means
   *  on top of the arrow, and where a click near the pen would follow the link instead. Safe
   *  here because a button sits in the middle of its section rather than against its edge. */
  outside?: boolean;
  /** For content that is itself absolutely positioned and fills its section: a hero background.
   *
   *  The wrapper has to be positioned for the pen to sit on it, and `position: relative` makes it
   *  an in-flow block whose only child is absolute, so it is nought pixels tall. The background
   *  then resolves top and bottom against nothing and collapses. It happened: a hero picture that
   *  was uploaded, saved and served correctly was invisible to the one person who could edit it,
   *  and perfectly visible to everybody else, because only an administrator gets this wrapper.
   *
   *  Filling instead means the wrapper takes the place the content was going to take. */
  fill?: boolean;
  children: React.ReactNode;
}) {
  const on = useContext(CanEdit);
  const all = useContext(ShowAll);
  const [over, setOver] = useState(false);
  const showing = over || all;

  // Nothing at all for a visitor: no wrapper, no attribute, no change to the page. And nothing
  // for a caller that had no key to give: a pen that opens the drawer at nothing is worse than
  // no pen, and a shared component may be used both with and without one.
  if (!on || !k?.trim()) return <>{children}</>;

  return (
    <Tag
      style={fill
        ? { position: 'absolute', inset: 0, display: 'block' }
        : { position: 'relative', display: block ? 'block' : 'inline-block' }}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
    >
      {children}
      <button
        type="button"
        aria-label={`Edit ${label ?? k}`}
        title={`Edit ${label ?? k}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('aa:edit', { detail: { page: tabFor(k), key: k } }));
        }}
        style={{
          // Inside the block, not beside it. Several sections on this site are overflow: hidden,
          // and a pen hanging past the right edge is simply not there on those.
          position: 'absolute', zIndex: 20,
          ...(outside ? { top: -10, right: -10 } : { top: 2, right: 2 }),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 12, cursor: 'pointer',
          border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#0C4A4A',
          // Kept in the markup rather than mounted on hover, so the first hover has nothing to
          // wait for and the layout never moves.
          opacity: showing ? 1 : 0,
          transition: 'opacity 120ms ease',
          pointerEvents: showing ? 'auto' : 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      >
        <Pencil size={12} />
      </button>
    </Tag>
  );
}

// Where a missing picture has to change the layout - a column that exists to hold a photograph
// and has nothing else in it - the page works that out on the server from isAdmin() and passes it
// down. Not from this context: every page that needs it renders on the server, where a hook
// cannot run, and a hook here builds fine and then throws on the first request.
//
// ============= A picture nobody has chosen =============
//
// A pen is drawn on something that was rendered, so a picture field with nothing in it has no
// pen. That is not a faint slot, it is an absent one: the hero, the founder photograph and the
// service illustrations simply are not there, and the only way to put one back is to know the
// drawer has a row called "Hero background picture".
//
// This is how the second site lost its hero. The picture stopped being written into the page and
// became a field with an empty default, the first site had a saved value and carried on, and the
// new one rendered a plain band that looked like a mistake nobody could reach.
//
// So an empty picture draws its own outline, for an administrator and for nobody else. A visitor
// gets exactly what they got before: no markup, no space, no hint that a picture was possible.
//
// Always drawn rather than shown on hover, unlike the pen. A pen is found by pointing at the
// thing it edits; there is nothing here to point at, which is the whole problem.
export function AddAPicture({
  k, label, fill = false, width, height = 180, radius = 16,
}: {
  /** The field this slot fills. May be an `items` field, where the drawer opens at the rows. */
  k: string;
  /** Named as the thing that is missing: the slot says "Add" and then this. */
  label: string;
  /** Fills its nearest positioned ancestor, for a background that sits behind other content. */
  fill?: boolean;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const on = useContext(CanEdit);
  if (!on || !k?.trim()) return null;

  return (
    <button
      type="button"
      aria-label={`Add ${label}`}
      title={`Add ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('aa:edit', { detail: { page: tabFor(k), key: k } }));
      }}
      style={{
        // A background sits under the words that are already there, so its own label goes in the
        // corner rather than under the headline.
        ...(fill
          ? { position: 'absolute', inset: 0, zIndex: 1, alignItems: 'flex-end', justifyContent: 'flex-end', padding: 16, borderRadius: 0 }
          : { position: 'relative', width: width ?? '100%', height, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: radius }),
        display: 'flex',
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: '1px dashed rgba(12,74,74,0.35)',
        background: 'rgba(12,74,74,0.035)',
        color: '#0C4A4A',
      }}
    >
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 14,
          padding: '6px 12px', fontSize: 13, fontWeight: 600, lineHeight: 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}
      >
        <Pencil size={12} />
        Add {label}
      </span>
    </button>
  );
}
