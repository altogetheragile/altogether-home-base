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
  k, label, as: Tag = 'span', block = false, children,
}: {
  /** The copy key these words came from. */
  k: string;
  /** What the pen says it edits, for a screen reader and for the tooltip. */
  label?: string;
  as?: 'span' | 'div';
  /** Block content needs a block wrapper, or the pen sits beside a paragraph rather than on it. */
  block?: boolean;
  children: React.ReactNode;
}) {
  const on = useContext(CanEdit);
  const all = useContext(ShowAll);
  const [over, setOver] = useState(false);
  const showing = over || all;

  // Nothing at all for a visitor: no wrapper, no attribute, no change to the page.
  if (!on) return <>{children}</>;

  return (
    <Tag
      style={{ position: 'relative', display: block ? 'block' : 'inline-block' }}
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
          position: 'absolute', top: 2, right: 2, zIndex: 20,
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
