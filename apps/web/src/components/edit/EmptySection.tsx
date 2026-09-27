'use client';

import { useContext } from 'react';
import { Pencil } from 'lucide-react';
import { CanEdit, tabFor } from './Editable';

// ============= A section with nothing in it =============
//
// Seven sections render nothing at all when they have nothing to show, which is right for a
// visitor: a heading asking "Who is this for?" over an empty row answers itself badly, and a
// testimonials strip with no testimonials is a claim that nobody has said anything.
//
// It is wrong for the person filling the site in. The section is not hidden, it is absent: no
// heading, no shape, no pen, and nothing to tell you the section exists, or that the reason it
// is missing is that it is empty rather than switched off. Those two look identical from the
// page and are fixed in completely different places.
//
// So an empty section draws its own outline for an administrator, at roughly the size and shape
// it will be, and says which of the two it is. A visitor gets exactly what they got before.
//
// Not the same thing as switched off. A section turned off in the editor stays off and draws
// nothing: that one is not a gap, it is an answer.

export type Fills =
  /** The rows live in a copy field, so the pen can open the drawer at it. */
  | { kind: 'field'; k: string; label: string }
  /** The rows come from the database, and no drawer field would fill them. */
  | { kind: 'elsewhere'; where: string };

export function EmptySection({
  name, why, fills, cards = 3,
}: {
  /** The section, named as the editor names it. */
  name: string;
  /** Why it is not showing, in a sentence, and what would make it show. */
  why: string;
  fills: Fills;
  /** How many placeholders to draw, so the shape reads as the shape it will be. */
  cards?: number;
}) {
  if (!useContext(CanEdit)) return null;

  const open = fills.kind === 'field'
    ? () => window.dispatchEvent(new CustomEvent('aa:edit', { detail: { page: tabFor(fills.k), key: fills.k } }))
    : undefined;

  return (
    <section
      aria-label={`${name}, empty`}
      style={{
        padding: '40px max(24px, calc((100% - 1100px) / 2))',
        background: 'var(--aa-band-bg, rgba(12,74,74,0.03))',
        borderTop: '1px dashed rgba(12,74,74,0.25)',
        borderBottom: '1px dashed rgba(12,74,74,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--aa-band-ink, #0C4A4A)' }}>{name}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0C4A4A', background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '3px 9px' }}>
          Empty, so visitors do not see it
        </span>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, color: 'var(--aa-band-ink-soft, #5A6B72)', maxWidth: 620 }}>
        {why}{' '}
        {fills.kind === 'elsewhere' && <span>{fills.where}</span>}
      </p>

      {/* The shape it will be, so the section is recognisable before it has anything in it. */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: 16, marginBottom: fills.kind === 'field' ? 16 : 0 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              height: 96, borderRadius: 14, border: '1px dashed rgba(12,74,74,0.3)',
              background: 'rgba(12,74,74,0.035)',
            }}
          />
        ))}
      </div>

      {fills.kind === 'field' && (
        <button
          type="button"
          onClick={open}
          aria-label={`Add ${fills.label}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 14,
            padding: '7px 13px', fontSize: 13, fontWeight: 600, lineHeight: 1, color: '#0C4A4A',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}
        >
          <Pencil size={12} />
          Add {fills.label}
        </button>
      )}
    </section>
  );
}
