import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, ContactFormData } from '@/schemas/contactForm';
import { useContactForm } from '@/hooks/useContactForm';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// ─── Palette ────────────────────────────────────────────────────────────────
const p = {
  deepTeal: '#004D4D',
  midTeal: '#007A7A',
  lightTeal: '#D9F2F2',
  paleTeal: '#F0FAFA',
  orange: '#FF9715',
  text: '#374151',
  textLight: '#B2DFDF',
};

// ─── Mobile detection hook ──────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── Responsive CSS classes ─────────────────────────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-hamburger { display: none; }

    @media (max-width: 767px) {
      .aa-hamburger { display: block !important; }
      .aa-nav-links { display: none; }
      .aa-contact-grid { grid-template-columns: 1fr; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
      .aa-section-pad { padding: 40px 20px; }
    }
  `}</style>
);

// ─── Two-colour wordmark ────────────────────────────────────────────────────
const LogoFull = ({ height = 48, light = false }: { height?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
    <span style={{ color: light ? '#fff' : p.deepTeal, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Altogether</span>
    <span style={{ color: p.orange, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Agile</span>
  </div>
);

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icons = {
  Mail: () => (
    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>
    </svg>
  ),
};

const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Knowledge Base', to: '/knowledge' },
  { label: 'Coaching', to: '/coaching' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const Contact: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      enquiry_type: 'general',
      preferred_contact_method: 'email',
    },
  });

  const { mutate: submitContact, isPending } = useContactForm();

  const onSubmit = (data: ContactFormData) => {
    submitContact(data, {
      onSuccess: () => {
        form.reset();
        setSubmitted(true);
      },
    });
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF' }}>
      <Helmet>
        <title>Contact — Altogether Agile</title>
        <meta name="description" content="Get in touch with Altogether Agile for coaching, training enquiries, or to book a free chemistry session." />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <nav style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, padding: isMobile ? '0 20px' : '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/"><LogoFull height={38} /></Link>
        <div className="aa-nav-links" style={{ gap: 32 }}>
          {NAV_LINKS.map((item) => {
            const active = item.to === '/contact';
            return (
              <Link key={item.label} to={item.to} style={{ color: active ? p.orange : p.text, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', textDecoration: 'none', borderBottom: active ? `2px solid ${p.orange}` : '2px solid transparent', paddingBottom: 2 }}>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <Link to="/dashboard" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <Link to="/auth" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Sign In</Link>
          )}
          <button className="aa-hamburger" onClick={() => setMenuOpen((v) => !v)} style={{ background: 'none', border: 'none', color: p.deepTeal, fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, position: 'sticky', top: 64, zIndex: 99 }}>
          {NAV_LINKS.map((item, i) => (
            <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 20px', color: p.text, fontSize: 15, fontWeight: 500, textDecoration: 'none', borderBottom: i < NAV_LINKS.length - 1 ? `1px solid ${p.lightTeal}` : 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ─── HERO ─── */}
      <div className="aa-section-pad" style={{ background: p.paleTeal, textAlign: 'center' }}>
        <h1 style={{ color: p.deepTeal, fontWeight: 800, fontSize: isMobile ? 34 : 44, lineHeight: 1.15, margin: '0 0 16px' }}>Get in Touch</h1>
        <p style={{ color: p.text, fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          Whether you have a question about our courses, want to discuss coaching, or just want to say hello — we'd love to hear from you.
        </p>
      </div>

      {/* ─── CONTACT INFO CARDS ─── */}
      <div className="aa-section-pad" style={{ background: '#fff' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 48 }}>
          {[
            { icon: <Icons.Mail />, title: 'Email', detail: 'info@altogetheragile.com', href: 'mailto:info@altogetheragile.com' },
            { icon: <Icons.MapPin />, title: 'Location', detail: 'London, England', href: undefined },
            { icon: <Icons.Calendar />, title: 'Book a Call', detail: 'Free 30-min chemistry session', href: 'https://calendly.com/altogetheragile/chemistry' },
          ].map((card) => (
            <div key={card.title} style={{ background: p.paleTeal, borderRadius: 12, padding: '28px 32px', textAlign: 'center', flex: '1 1 200px', maxWidth: 280 }}>
              <div style={{ color: p.midTeal, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{card.icon}</div>
              <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{card.title}</div>
              {card.href ? (
                <a href={card.href} target={card.href.startsWith('http') ? '_blank' : undefined} rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ color: p.midTeal, fontSize: 13, textDecoration: 'none' }}>
                  {card.detail}
                </a>
              ) : (
                <div style={{ color: p.text, fontSize: 13 }}>{card.detail}</div>
              )}
            </div>
          ))}
        </div>

        {/* ─── FORM ─── */}
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: p.paleTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 256 256" fill={p.midTeal}>
                <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
              </svg>
            </div>
            <h2 style={{ color: p.deepTeal, fontWeight: 700, fontSize: 24, marginBottom: 12 }}>Message Sent</h2>
            <p style={{ color: p.text, fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 24px' }}>
              Thanks for getting in touch. We'll get back to you as soon as possible.
            </p>
            <button onClick={() => setSubmitted(false)} style={{ background: p.orange, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Send Another Message
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ color: p.deepTeal, fontWeight: 700, fontSize: 24, marginBottom: 8, textAlign: 'center' }}>Send us a Message</h2>
            <p style={{ color: p.text, fontSize: 14, marginBottom: 32, textAlign: 'center' }}>Fill out the form below and we'll get back to you shortly.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl><Input placeholder="Your name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl><Input type="tel" placeholder="+44 7XXX XXX XXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="enquiry_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enquiry Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General Enquiry</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="coaching">Coaching</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl><Input placeholder="What is this about?" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us more about your enquiry..." style={{ minHeight: 150 }} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="preferred_contact_method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Method</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="contact-email" />
                          <Label htmlFor="contact-email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="phone" id="contact-phone" />
                          <Label htmlFor="contact-phone">Phone</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <button type="submit" disabled={isPending} style={{ background: p.orange, color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, marginTop: 8 }}>
                  {isPending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </Form>
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: p.deepTeal, padding: '48px 20px 32px' }}>
        <div className="aa-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><LogoFull height={40} light /></div>
            <div style={{ color: p.textLight, fontSize: 14, lineHeight: 1.75, maxWidth: 300 }}>
              Agile training, coaching and facilitation — grounded in 25 years of real experience. Based in London, working everywhere.
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</div>
            {[
              { label: 'Events', to: '/events' },
              { label: 'Knowledge Base', to: '/knowledge' },
              { label: 'Coaching', to: '/coaching' },
              { label: 'About', to: '/about' },
              { label: 'Contact', to: '/contact' },
            ].map((link) => (
              <Link key={link.label} to={link.to} style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>{link.label}</Link>
            ))}
            <Link to="/testimonials" style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>Testimonials</Link>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get in Touch</div>
            <div style={{ color: p.textLight, fontSize: 13, marginBottom: 8 }}>info@altogetheragile.com</div>
            <div style={{ color: p.textLight, fontSize: 13 }}>London, England</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, color: p.textLight, fontSize: 12, textAlign: 'center' }}>
          &copy; 2026 Altogether Agile. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Contact;
