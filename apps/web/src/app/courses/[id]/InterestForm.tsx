'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const c = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };

const MIN_SUBMIT_TIME_MS = 3000;
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.lightTeal}`,
  fontSize: 14, color: c.body, fontFamily: 'inherit', boxSizing: 'border-box', background: c.white,
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: c.deepTeal, margin: '0 0 5px' };

export function InterestForm({ courseTitle }: { courseTitle: string }) {
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

      // Notify (best-effort; the lead is already saved).
      await supabase.functions
        .invoke('send-contact-email', {
          body: { name: name.trim(), email: email.trim(), subject, message, enquiry_type: 'general' },
        })
        .catch(() => {});

      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('Rate limit') ? 'Please wait a few minutes before submitting again.' : 'Something went wrong. Please try again, or email us.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div style={{ textAlign: 'center', background: c.skyTeal, borderRadius: 10, padding: 18, marginTop: 16 }}>
        <div style={{ color: c.midTeal, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Thanks for your interest!</div>
        <div style={{ color: c.muted, fontSize: 13, lineHeight: 1.5 }}>We&apos;ll be in touch when dates are confirmed.</div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor="ci-name" style={labelStyle}>Your name</label>
        <input id="ci-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" style={inputStyle} />
      </div>
      <div>
        <label htmlFor="ci-email" style={labelStyle}>Email</label>
        <input id="ci-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
      </div>
      <div>
        <label htmlFor="ci-note" style={labelStyle}>Anything we should know? <span style={{ color: c.muted, fontWeight: 400 }}>(optional)</span></label>
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
        {state === 'sending' ? 'Sending...' : 'Register My Interest'}
      </button>
      <div style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>No spam. We&apos;ll only contact you about this course.</div>
    </form>
  );
}
