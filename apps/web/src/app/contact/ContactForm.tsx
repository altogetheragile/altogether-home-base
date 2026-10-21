'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { colors as p } from '@/lib/brand';
import { Editable } from '@/components/edit/Editable';
import registry from '@/lib/copy/contact.json';

const MIN_SUBMIT_TIME_MS = 3000;

const WORDS = ['heading', 'intro', 'nameLabel', 'namePlaceholder', 'emailLabel', 'emailPlaceholder', 'phoneLabel',
  'phonePlaceholder', 'typeLabel', 'subjectLabel', 'subjectPlaceholder', 'messageLabel', 'messagePlaceholder',
  'methodLabel', 'methodEmail', 'methodPhone', 'submit', 'sending', 'sentHeading', 'sentBody', 'sentAgain'] as const;
export type ContactWords = Record<(typeof WORDS)[number], string>;

// The page passes this site's words in. Falling back to the shipped ones, read from the registry
// rather than written here a second time, so a caller that passes nothing still says something.
const entries = registry.entries as Record<string, { value: string }>;
const shipped = Object.fromEntries(WORDS.map((w) => [w, entries[`contact.form.${w}`].value])) as ContactWords;
const shippedTypes = entries['contact.form.types'].value.split('\n').map((l) => l.trim()).filter(Boolean);

// The database only accepts these, so an enquiry type somebody has written themselves is stored as
// the nearest one it names, or 'other'. The words they chose still reach the email, which is where
// they are read.
const STORED = ['general', 'support', 'partnership', 'feedback', 'other', 'training', 'coaching'] as const;
const storedType =(label: string): string =>
  STORED.find((s) => label.toLowerCase().includes(s)) ?? 'other';

type Form = { name: string; email: string; phone: string; enquiry_type: string; subject: string; message: string; preferred_contact_method: string };

export function ContactForm({ words: given, types = shippedTypes }: {
  words?: Partial<ContactWords>;
  /** The drop-down's choices, in the site's own words. Empty means the question is not asked. */
  types?: string[];
} = {}) {
  const w = { ...shipped, ...given };
  const empty: Form = { name: '', email: '', phone: '', enquiry_type: types[0] ?? '', subject: '', message: '', preferred_contact_method: 'email' };
  const loadedAt = useRef(Date.now());
  const [form, setForm] = useState<Form>(empty);
  const [website, setWebsite] = useState(''); // honeypot
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vErrors, setVErrors] = useState<Partial<Record<keyof Form, string>>>({});

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address';
    if (form.subject.trim().length < 5) e.subject = 'Subject must be at least 5 characters';
    if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    setVErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (website) { setSubmitted(true); return; } // honeypot
    if (Date.now() - loadedAt.current < MIN_SUBMIT_TIME_MS) { setSubmitted(true); return; } // too fast
    if (!validate()) return;

    setSubmitting(true);
    const ipAddress = await fetch('https://api.ipify.org?format=json').then((r) => r.json()).then((r) => r.ip).catch(() => 'unknown');
    // No drop-down at all means a general enquiry, which is what the table assumes when told nothing.
    const stored = form.enquiry_type ? storedType(form.enquiry_type) : 'general';
    const said = form.enquiry_type || 'general';
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('contacts').insert({
        full_name: form.name, email: form.email, phone: form.phone || null, subject: form.subject, message: form.message,
        enquiry_type: stored, preferred_contact_method: form.preferred_contact_method, ip_address: ipAddress, status: 'unread',
      });
      if (insertError) throw insertError;
      setSubmitted(true);
      void supabase.functions.invoke('send-contact-email', { body: { name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message, enquiry_type: said, preferred_contact_method: form.preferred_contact_method } }).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('Rate limit') ? 'Please wait 5 minutes before submitting another message.' : 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ background: p.white, borderRadius: 16, padding: '48px 32px', textAlign: 'center', border: `1px solid ${p.paleTeal}` }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E6F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: p.midTeal }}>
          <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" /></svg>
        </div>
        <h2 style={{ color: p.deepTeal, fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>{w.sentHeading}</h2>
        {w.sentBody.trim() && <p style={{ color: p.muted, fontSize: 14, margin: '0 0 20px' }}>{w.sentBody}</p>}
        <button onClick={() => { setForm(empty); setSubmitted(false); loadedAt.current = Date.now(); }} style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{w.sentAgain}</button>
      </div>
    );
  }

  const set = (k: keyof Form, v: string) => { setForm((d) => ({ ...d, [k]: v })); if (vErrors[k]) setVErrors((e) => ({ ...e, [k]: undefined })); };
  const labelStyle: React.CSSProperties = { color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 };
  const inputStyle = (invalid?: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${invalid ? p.danger : p.paleTeal}`, fontSize: 14, color: p.body, background: p.skyTeal, outline: 'none', boxSizing: 'border-box' });
  const err = (k: keyof Form) => vErrors[k] && <div style={{ color: p.danger, fontSize: 12, marginTop: 4 }}>{vErrors[k]}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ background: p.white, borderRadius: 16, padding: '40px 40px', border: `1px solid ${p.paleTeal}` }}>
      <Editable k="contact.form.heading" label="the form's words" as="div" block>
        <h2 style={{ color: p.deepTeal, fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>{w.heading}</h2>
      </Editable>
      {w.intro.trim() && <p style={{ color: p.muted, fontSize: 14, margin: '0 0 24px' }}>{w.intro}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: w.intro.trim() ? 0 : 20 }}>
        <div>
          <label style={labelStyle}>{w.nameLabel}</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={w.namePlaceholder} autoComplete="name" style={inputStyle(!!vErrors.name)} />{err('name')}
        </div>
        <div>
          <label style={labelStyle}>{w.emailLabel}</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={w.emailPlaceholder} autoComplete="email" style={inputStyle(!!vErrors.email)} />{err('email')}
        </div>
        <div>
          <label style={labelStyle}>{w.phoneLabel}</label>
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder={w.phonePlaceholder} autoComplete="tel" style={inputStyle()} />
        </div>
        {types.length > 0 && (
          <div>
            <label style={labelStyle}>{w.typeLabel}</label>
            <select value={form.enquiry_type} onChange={(e) => set('enquiry_type', e.target.value)} style={inputStyle()}>
              {types.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>{w.subjectLabel}</label>
          <input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder={w.subjectPlaceholder} style={inputStyle(!!vErrors.subject)} />{err('subject')}
        </div>
        <div>
          <label style={labelStyle}>{w.messageLabel}</label>
          <textarea value={form.message} onChange={(e) => set('message', e.target.value)} placeholder={w.messagePlaceholder} style={{ ...inputStyle(!!vErrors.message), minHeight: 150, resize: 'vertical', fontFamily: 'inherit' }} />{err('message')}
        </div>
        <div>
          <label style={labelStyle}>{w.methodLabel}</label>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['email', w.methodEmail], ['phone', w.methodPhone]].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, color: p.body, fontSize: 14, cursor: 'pointer' }}>
                <input type="radio" name="pcm" value={v} checked={form.preferred_contact_method === v} onChange={(e) => set('preferred_contact_method', e.target.value)} />{l}
              </label>
            ))}
          </div>
        </div>
        {/* Honeypot */}
        <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        {error && <div style={{ color: p.danger, fontSize: 13, textAlign: 'center' }}>{error}</div>}
        <button type="submit" disabled={submitting} style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? w.sending : w.submit}
        </button>
      </div>
    </form>
  );
}
