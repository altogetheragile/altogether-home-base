'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>;
const CheckCircle = () => <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" /></svg>;

export function CoachingEnquiryForm() {
  const [form, setForm] = useState({ name: '', email: '', service: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vErrors, setVErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  function validate() {
    const e: typeof vErrors = {};
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    const email = form.email.trim();
    if (!email.includes('@') || !email.includes('.')) e.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    setVErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    const subject = `Coaching enquiry: ${form.service || 'Not specified'}`;
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('contacts').insert({
        full_name: form.name, email: form.email, subject, message: form.message, enquiry_type: 'general', status: 'unread',
      });
      if (insertError) throw insertError;
      void supabase.functions.invoke('send-contact-email', { body: { name: form.name, email: form.email, subject, message: form.message, enquiry_type: 'general' } }).catch(() => {});
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('Rate limit') ? 'Please wait a few minutes before submitting again.' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ background: p.white, borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E6F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#1A9090' }}><CheckCircle /></div>
        <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Message sent</div>
        <div style={{ color: p.muted, fontSize: 14 }}>Thanks - I&apos;ll be in touch within one working day.</div>
      </div>
    );
  }

  const field = (key: 'name' | 'email' | 'message', value: string) => setForm((d) => ({ ...d, [key]: value }));
  const clearErr = (key: 'name' | 'email' | 'message') => { if (vErrors[key]) setVErrors((e) => ({ ...e, [key]: undefined })); };
  const inputStyle = (invalid?: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${invalid ? '#DC2626' : p.paleTeal}`, fontSize: 14, color: p.body, background: p.skyTeal, outline: 'none', boxSizing: 'border-box' });
  const labelStyle: React.CSSProperties = { color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 };

  return (
    <div style={{ background: p.white, borderRadius: 16, padding: '40px 40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => { field('name', e.target.value); clearErr('name'); }} style={inputStyle(!!vErrors.name)} />
          {vErrors.name && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{vErrors.name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Email address</label>
          <input type="email" placeholder="jane@company.com" value={form.email} onChange={(e) => { field('email', e.target.value); clearErr('email'); }} style={inputStyle(!!vErrors.email)} />
          {vErrors.email && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{vErrors.email}</div>}
        </div>
        <div>
          <label style={labelStyle}>I&apos;m interested in</label>
          <select value={form.service} onChange={(e) => setForm((d) => ({ ...d, service: e.target.value }))} style={{ ...inputStyle(), color: form.service ? p.body : p.muted }}>
            <option value="">Select a service...</option>
            <option value="one-to-one">One-to-One Professional Coaching</option>
            <option value="team">Agile Team Coaching</option>
            <option value="chemistry">Free Chemistry Session</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>What&apos;s on your mind?</label>
          <textarea placeholder="Tell me a bit about what you're working through or what you're looking for..." value={form.message} onChange={(e) => { field('message', e.target.value); clearErr('message'); }} rows={5} style={{ ...inputStyle(!!vErrors.message), resize: 'vertical', fontFamily: 'inherit' }} />
          {vErrors.message && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{vErrors.message}</div>}
        </div>
        {error && <div style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
        <button onClick={handleSubmit} disabled={submitting} style={{ background: submitting ? p.muted : p.orange, color: submitting ? p.white : p.deepTeal, border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Sending...' : <>Send enquiry <ArrowRight /></>}
        </button>
        <div style={{ color: p.muted, fontSize: 12, textAlign: 'center' }}>I aim to respond within one working day. No hard sell - just a conversation.</div>
      </div>
    </div>
  );
}
