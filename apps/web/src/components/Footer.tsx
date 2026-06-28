import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Youtube, Github } from 'lucide-react';
import type { SiteSettings } from '@/lib/site-settings';

// Server component (no interactivity). The auth-only links (Dashboard, Admin) from
// the Vite footer are intentionally dropped - this is the public content surface.
export function Footer({ settings, year }: { settings: SiteSettings; year: number }) {
  const flag = (key: keyof SiteSettings, def: boolean) => {
    const v = settings[key];
    return v == null ? def : !!v;
  };

  const quickLinks = [
    { label: 'Home', href: '/', show: true },
    { label: 'Events', href: '/events', show: flag('show_events', true) },
    { label: 'Coaching', href: '/coaching', show: flag('show_coaching', true) },
    { label: 'About', href: '/about', show: flag('show_about', true) },
    { label: 'Blog', href: '/blog', show: flag('show_blog', true) },
    { label: 'Practice Exams', href: '/exams', show: flag('show_exams', true) },
    { label: 'Contact', href: '/contact', show: flag('show_contact', true) },
    { label: 'Testimonials', href: '/testimonials', show: flag('show_testimonials', true) },
  ].filter((l) => l.show);

  const social = [
    { icon: Linkedin, url: settings.social_linkedin, label: 'LinkedIn' },
    { icon: Twitter, url: settings.social_twitter, label: 'Twitter' },
    { icon: Facebook, url: settings.social_facebook, label: 'Facebook' },
    { icon: Youtube, url: settings.social_youtube, label: 'YouTube' },
    { icon: Github, url: settings.social_github, label: 'GitHub' },
  ].filter((s) => s.url);

  return (
    <footer className="mt-auto bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-horizontal-tight.svg" alt="Altogether Agile" className="mb-4 h-8 w-auto" />
            <p className="text-muted-foreground">
              {settings.company_description ||
                'Empowering teams and organizations through agile training and coaching.'}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Contact</h3>
            <div className="space-y-2">
              {settings.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Mail className="h-4 w-4" /> {settings.contact_email}
                </a>
              )}
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                  <Phone className="h-4 w-4" /> {settings.contact_phone}
                </a>
              )}
              {settings.contact_location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {settings.contact_location}
                </p>
              )}
              {social.length > 0 && (
                <div className="mt-4 flex gap-3">
                  {social.map((s) => {
                    const Icon = s.icon;
                    return (
                      <a key={s.label} href={s.url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="text-muted-foreground transition-colors hover:text-primary">
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            © {year} {settings.company_name || 'Altogether Agile'}. {settings.copyright_text || 'All rights reserved.'}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">Terms &amp; Conditions</Link>
            <Link href="/cookies" className="transition-colors hover:text-primary">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
