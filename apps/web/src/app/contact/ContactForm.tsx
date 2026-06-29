'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const MIN_SUBMIT_TIME_MS = 3000;

type Form = { name: string; email: string; phone: string; enquiry_type: string; subject: string; message: string; preferred_contact_method: string };
const EMPTY: Form = { name: '', email: '', phone: '', enquiry_type: 'general', subject: '', message: '', preferred_contact_method: 'email' };

const ENQUIRY_TYPES = [
  ['general', 'General Enquiry'], ['training', 'Training'], ['coaching', 'Coaching'], ['partnership', 'Partnership'], ['feedback', 'Feedback'],
] as const;

export function ContactForm() {
  const loadedAt = useRef(Date.now());
  const [form, setForm] = useState<Form>(EMPTY);
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
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('contacts').insert({
        full_name: form.name, email: form.email, phone: form.phone || null, subject: form.subject, message: form.message,
        enquiry_type: form.enquiry_type, preferred_contact_method: form.preferred_contact_method, ip_address: ipAddress, status: 'unread',
      });
      if (insertError) throw insertError;
      setSubmitted(true);
      void supabase.functions.invoke('send-contact-email', { body: { name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message, enquiry_type: form.enquiry_type, preferred_contact_method: form.preferred_contact_method } }).catch(() => {});
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
        <h2 style={{ color: p.deepTeal, fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>Message Sent</h2>
        <p style={{ color: p.muted, fontSize: 14, margin: '0 0 20px' }}>Thanks for getting in touch. We&apos;ll get back to you as soon as possible.</p>
        <button onClick={() => { setForm(EMPTY); setSubmitted(false); loadedAt.current = Date.now(); }} style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Send Another Message</button>
      </div>
    );
  }

  const set = (k: keyof Form, v: string) => { setForm((d) => ({ ...d, [k]: v })); if (vErrors[k]) setVErrors((e) => ({ ...e, [k]: undefined })); };
  const labelStyle: React.CSSProperties = { color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 };
  const inputStyle = (invalid?: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${invalid ? '#DC2626' : p.paleTeal}`, fontSize: 14, color: p.body, background: p.skyTeal, outline: 'none', boxSizing: 'border-box' });
  const err = (k: keyof Form) => vErrors[k] && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{vErrors[k]}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ background: p.white, borderRadius: 16, padding: '40px 40px', border: `1px solid ${p.paleTeal}` }}>
      <h2 style={{ color: p.deepTeal, fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Send us a Message</h2>
      <p style={{ color: p.muted, fontSize: 14, margin: '0 0 24px' }}>Fill out the form below and we&apos;ll get back to you shortly.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" autoComplete="name" style={inputStyle(!!vErrors.name)} />{err('name')}
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="your.email@example.com" autoComplete="email" style={inputStyle(!!vErrors.email)} />{err('email')}
        </div>
        <div>
          <label style={labelStyle}>Phone (Optional)</label>
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+44 7XXX XXX XXX" autoComplete="tel" style={inputStyle()} />
        </div>
        <div>
          <label style={labelStyle}>Enquiry Type *</label>
          <select value={form.enquiry_type} onChange={(e) => set('enquiry_type', e.target.value)} style={inputStyle()}>
            {ENQUIRY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Subject *</label>
          <input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="What is this about?" style={inputStyle(!!vErrors.subject)} />{err('subject')}
        </div>
        <div>
          <label style={labelStyle}>Message *</label>
          <textarea value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us more about your enquiry..." style={{ ...inputStyle(!!vErrors.message), minHeight: 150, resize: 'vertical', fontFamily: 'inherit' }} />{err('message')}
        </div>
        <div>
          <label style={labelStyle}>Preferred Contact Method</label>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['email', 'Email'], ['phone', 'Phone']].map(([v, l]) => (
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
        {error && <div style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
        <button type="submit" disabled={submitting} style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
