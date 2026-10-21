'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { colors as c } from '@/lib/brand';
import registry from '@/lib/copy/training.json';

const WORDS = ['nameLabel', 'emailLabel', 'noteLabel', 'noteOptional', 'submit', 'footnote', 'sentHeading', 'sentBody'] as const;
export type InterestWords = Record<(typeof WORDS)[number], string>;

// The page passes this site's words in. The shipped ones are read from the registry rather than
// written here a second time, so a caller that passes nothing still says something.
const entries = registry.entries as Record<string, { value: string }>;
const shipped = Object.fromEntries(WORDS.map((w) => [w, entries[`training.interest.${w}`].value])) as InterestWords;


const MIN_SUBMIT_TIME_MS = 3000;
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.lightTeal}`,
  fontSize: 14, color: c.body, fontFamily: 'inherit', boxSizing: 'border-box', background: c.white,
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: c.deepTeal, margin: '0 0 5px' };

export function InterestForm({ courseTitle, words: given }: { courseTitle: string; words?: Partial<InterestWords> }) {
  const w = { ...shipped, ...given };
  const loadedAt = useRef(Date.now());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Bot checks (mirror the site contact form): honeypot + minimum fill time.
    if (website) { setState('done'); return; }
    if (Date.now() - loadedAt.current < MIN_SUBMIT_TIME_MS) { setState('done'); return; }
    if (!name.trim() || !email.trim()) { setError('Please add your name and email.'); return; }

    setState('sending');
    const subject = `Course interest: ${courseTitle}`;
    const message = note.trim()
      ? `Registering interest in "${courseTitle}".\n\n${note.trim()}`
      : `Registering interest in "${courseTitle}" - please let me know about upcoming dates.`;

    try {
      const supabase = createClient();
      // Persist the lead (ip_address omitted: the rate-limit trigger keys on it, so a
      // shared sentinel would collide across users; honeypot + timing guard instead).
      const { error: insertError } = await supabase.from('contacts').insert({
        full_name: name.trim(),
        email: email.trim(),
        subject,
        message,
        enquiry_type: 'general',
        status: 'unread',
      });
      if (insertError) throw insertError;

      // Lead is saved - show success immediately; don't make the user wait on email.
      setState('done');

      // Notify (best-effort, fire-and-forget; the lead is already persisted).
      void supabase.functions
        .invoke('send-contact-email', {
          body: { name: name.trim(), email: email.trim(), subject, message, enquiry_type: 'general' },
        })
        .catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('Rate limit') ? 'Please wait a few minutes before submitting again.' : 'Something went wrong. Please try again, or email us.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div style={{ textAlign: 'center', background: c.skyTeal, borderRadius: 10, padding: 18, marginTop: 16 }}>
        <div style={{ color: c.midTeal, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{w.sentHeading}</div>
        {w.sentBody.trim() && <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.5 }}>{w.sentBody}</div>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor="ci-name" style={labelStyle}>{w.nameLabel}</label>
        <input id="ci-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" style={inputStyle} />
      </div>
      <div>
        <label htmlFor="ci-email" style={labelStyle}>{w.emailLabel}</label>
        <input id="ci-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
      </div>
      <div>
        <label htmlFor="ci-note" style={labelStyle}>{w.noteLabel}{w.noteOptional.trim() && <> <span style={{ color: c.muted, fontWeight: 400 }}>{w.noteOptional}</span></>}</label>
        <textarea id="ci-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      {/* Honeypot: hidden from real users, bots fill it */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="ci-website">Website</label>
        <input id="ci-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {error && <div style={{ color: '#B91C1C', fontSize: 13 }}>{error}</div>}
      <button
        type="submit"
        disabled={state === 'sending'}
        style={{ background: c.orange, color: c.white, border: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: state === 'sending' ? 'default' : 'pointer', opacity: state === 'sending' ? 0.7 : 1, width: '100%' }}
      >
        {state === 'sending' ? 'Sending...' : w.submit}
      </button>
      {w.footnote.trim() && <div style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>{w.footnote}</div>}
    </form>
  );
}
