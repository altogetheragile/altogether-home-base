'use client';

import { useState } from 'react';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { draftStarterPage, type StarterResult } from '@/app/actions/starter';

// The button under the description, and what happened on each page.
//
// One page at a time, in order, saying which it is on. Writing a whole site takes a minute or two,
// and a spinner with no progress for that long looks exactly like one that has hung.

type Status = 'waiting' | 'writing' | StarterResult;

export function StarterRun({
  pages,
  saveFirst,
  hasBrief,
}: {
  pages: { page: string; label: string }[];
  /** Saves whatever has been typed into the description, so the run writes from it. Answers an
   *  error to show, or null. */
  saveFirst: () => Promise<string | null>;
  hasBrief: boolean;
}) {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    const failed = await saveFirst();
    if (failed) return setError(failed);
    setRunning(true);
    setStatus(Object.fromEntries(pages.map((p) => [p.page, 'waiting' as const])));
    for (const { page } of pages) {
      setStatus((s) => ({ ...s, [page]: 'writing' }));
      let result: StarterResult;
      try {
        result = await draftStarterPage(page);
      } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : 'That page did not work.' };
      }
      setStatus((s) => ({ ...s, [page]: result }));
    }
    setRunning(false);
  };

  const finished = !running && pages.length > 0 && pages.every((p) => typeof status[p.page] === 'object');
  const total = Object.values(status).reduce((n, s) => n + (typeof s === 'object' && s.ok ? s.drafted : 0), 0);

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={() => void run()}
        disabled={running || !hasBrief}
        title={hasBrief ? undefined : 'Describe the website first'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10,
          border: 'none', background: '#0C4A4A', color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: running || !hasBrief ? 'default' : 'pointer', opacity: running || !hasBrief ? 0.55 : 1,
        }}
      >
        {running ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {running ? 'Writing starter drafts' : finished ? 'Write drafts for anything still empty' : 'Write starter drafts'}
      </button>

      {error && <p style={{ color: '#C0392B', fontSize: 14, margin: '12px 0 0' }}>{error}</p>}

      {Object.keys(status).length > 0 && (
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
          {pages.map(({ page, label }) => {
            const s = status[page];
            return (
              <li key={page} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13.5, color: '#3D4F57', padding: '4px 0' }}>
                <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}>
                  {s === 'writing' ? <Loader2 size={13} className="animate-spin" />
                    : typeof s === 'object' && s.ok ? <Check size={13} color="#1A9090" />
                    : typeof s === 'object' ? <X size={13} color="#C0392B" /> : null}
                </span>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ color: '#5A6B72' }}>
                  {s === 'waiting' ? 'waiting'
                    : s === 'writing' ? 'writing'
                    : s.ok ? (s.offered === 0 ? 'nothing empty to write' : `${s.drafted} drafted`)
                    : s.error}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {finished && total > 0 && (
        <p style={{ color: '#3D4F57', fontSize: 14, lineHeight: 1.65, margin: '16px 0 0' }}>
          {total} starter drafts are waiting. Nothing has changed for visitors.{' '}
          {/* Preview turns the drafts on for you alone. Each page is then published, rewritten or
              thrown away from its own editor. */}
          <a href="/api/preview?on=1&back=/" style={{ color: '#1A9090', fontWeight: 700, textDecoration: 'none' }}>
            See the site with them
          </a>
          , then publish each page from its editor when you are happy with it.
        </p>
      )}
    </div>
  );
}
