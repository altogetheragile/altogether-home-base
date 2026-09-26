'use client';

import { useRef, useState, useTransition } from 'react';
import { Download, Upload, Check, Loader2, AlertTriangle } from 'lucide-react';
import { colors as p } from '@/lib/brand';
import { exportCopySheet, reviewCopySheet, applyCopySheet } from '@/app/actions/sheet';
import { whyNothing, type SheetReading } from '@/lib/copy/sheet';

// ============= Writing a site somewhere other than here =============
//
// The drawer is the right tool for changing a heading and the wrong one for writing a site from
// nothing: 204 boxes, three tabs, one page at a time, signed in. This is the other half. The file
// goes to whoever the words belong to, who fills it in on a train, and comes back.
//
// Coming back lands as drafts, deliberately. Two hundred rows arriving at once is precisely the
// change nobody can check afterwards, so the site carries on saying what it said and each page's
// drawer shows what is waiting.

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 9,
  padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
};

export function CopySheet() {
  const file = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ csv: string; reading: SheetReading } | null>(null);

  const download = () => start(() => { void (async () => {
    setError(null); setNote(null);
    const out = await exportCopySheet();
    if (!out.ok) return setError(out.error);
    const url = URL.createObjectURL(new Blob([out.csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-words-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNote(`${out.rows} things to write, across ${out.pages} ${out.pages === 1 ? 'page' : 'pages'}.`);
  })(); });

  const choose = (f: File) => start(() => { void (async () => {
    setError(null); setNote(null); setPending(null);
    const csv = await f.text();
    const out = await reviewCopySheet(csv);
    if (!out.ok) return setError(out.error);
    // Four different nothings, and only one of them is "no edits". The others are a file that
    // did not work, and saying the same sentence for all four sends somebody back to a
    // spreadsheet they have already filled in correctly.
    if (!out.reading.changes.length) return setError(whyNothing(out.reading) ?? 'Nothing to save.');
    setPending({ csv, reading: out.reading });
  })(); });

  const apply = () => start(() => { void (async () => {
    if (!pending) return;
    setError(null);
    const out = await applyCopySheet(pending.csv);
    setPending(null);
    if (!out.ok) return setError(out.error);
    setNote(`${out.written} changes are waiting on ${out.pages.length} ${out.pages.length === 1 ? 'page' : 'pages'}. Nothing is live yet: open each page and publish when you are happy.`);
  })(); });

  return (
    <section style={{ background: p.white, borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
      <h2 style={{ color: p.deepTeal, fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>Write the words somewhere else</h2>
      <p style={{ color: p.muted, fontSize: 13.5, lineHeight: 1.65, margin: '0 0 16px' }}>
        Every piece of writing this site is waiting for, as one spreadsheet. Only the pages that
        are switched on, and only the words: nothing in the file can change a colour, a picture or
        a switch. Fill in the last column, bring it back, and it arrives as drafts for you to read
        before anything goes live.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={download} disabled={busy} style={{ ...btn, background: p.deepTeal, color: p.white }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download the words
        </button>
        <button onClick={() => file.current?.click()} disabled={busy} style={{ ...btn, background: p.orange, color: p.deepTeal }}>
          <Upload size={15} /> Bring one back
        </button>
        <input
          ref={file} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) choose(f); e.target.value = ''; }}
        />
      </div>

      {note && (
        <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#1A6B6B', fontSize: 13.5, lineHeight: 1.6, marginTop: 14 }}>
          <Check size={15} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{note}</span>
        </p>
      )}
      {error && (
        <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#8A4B2A', background: '#FDF3EC', border: '1px solid #F0D5C0', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.6, marginTop: 14 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{error}</span>
        </p>
      )}

      {/* Said before it happens, not after. Two hundred rows is not a thing to find out about. */}
      {pending && (
        <div style={{ marginTop: 16, background: p.skyTeal, borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ color: p.deepTeal, fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>
            {pending.reading.changes.length} {pending.reading.changes.length === 1 ? 'change' : 'changes'} to save as drafts
          </p>
          <p style={{ color: p.muted, fontSize: 13, margin: '0 0 10px' }}>
            {pending.reading.unchanged > 0 && `${pending.reading.unchanged} rows came back unchanged and are left alone. `}
            {pending.reading.unknown.length > 0 && `${pending.reading.unknown.length} rows name something this site does not have and are ignored: ${pending.reading.unknown.slice(0, 3).join(', ')}${pending.reading.unknown.length > 3 ? '…' : ''}. `}
            Nothing goes live until you publish it.
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, maxHeight: 220, overflowY: 'auto' }}>
            {pending.reading.changes.slice(0, 40).map((c) => (
              <li key={c.key} style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '8px 0' }}>
                <div style={{ color: p.muted, fontSize: 11.5, fontFamily: 'ui-monospace, monospace' }}>{c.key}</div>
                <div style={{ color: p.body, fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ textDecoration: 'line-through', opacity: 0.55 }}>{c.from.slice(0, 70) || '(empty)'}</span>
                  {' → '}
                  <span style={{ color: p.deepTeal, fontWeight: 600 }}>{c.to.slice(0, 70)}</span>
                </div>
              </li>
            ))}
          </ul>
          {pending.reading.changes.length > 40 && (
            <p style={{ color: p.muted, fontSize: 12.5, margin: '0 0 10px' }}>
              and {pending.reading.changes.length - 40} more.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={apply} disabled={busy} style={{ ...btn, background: p.orange, color: p.deepTeal }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save all of this as drafts
            </button>
            <button onClick={() => setPending(null)} disabled={busy} style={{ ...btn, background: 'transparent', color: p.muted, border: '1px solid rgba(0,0,0,0.14)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
