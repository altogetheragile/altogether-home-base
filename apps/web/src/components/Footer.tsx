import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Youtube, Github } from 'lucide-react';
import type { SiteSettings } from '@/lib/site-settings';
import { SiteLogo } from '@/components/SiteLogo';
import { moduleIsOn } from '@altogether/ui/modules';
import { Editable } from '@/components/edit/Editable';
import { isOurSite } from '@/lib/ourSite';

// Server component (no interactivity). The auth-only links (Dashboard, Admin) from
// the Vite footer are intentionally dropped - this is the public content surface.
export function Footer({ settings, year, t, signedInAsAdmin = false }: {
  settings: SiteSettings;
  year: number;
  /** Keep hidden pages listed, marked, for somebody who can unhide them. The menu does the same;
   *  the footer used to drop them, so a page hidden from the menu vanished from here entirely and
   *  looked deleted rather than hidden. */
  signedInAsAdmin?: boolean;
  /** The navigation registry's reader, so the footer and the menu agree on what a page is called. */
  t: (key: string) => string;
}) {
  // The shared list, not a fourth copy. This was the last place still carrying its own.
  const on = (key: string) => moduleIsOn(key.replace(/^show_/, ''), settings as Record<string, unknown>);

  // Same copy keys as the menu, and the same rule about hidden pages.
  const quickLinks = [
    { key: 'nav.home', label: t('nav.home'), href: '/', show: true },
    { key: 'nav.events', label: t('nav.events'), href: '/events', show: on('show_events') },
    { key: 'nav.coaching', label: t('nav.coaching'), href: '/coaching', show: on('show_coaching') },
    { key: 'nav.about', label: t('nav.about'), href: '/about', show: on('show_about') },
    { key: 'nav.blog', label: t('nav.blog'), href: '/blog', show: on('show_blog') },
    { key: 'nav.exams', label: t('nav.exams'), href: '/exams', show: on('show_exams') },
    { key: 'nav.contact', label: t('nav.contact'), href: '/contact', show: on('show_contact') },
    { key: 'nav.testimonials', label: t('nav.testimonials'), href: '/testimonials', show: on('show_testimonials') },
  ].map((l) => ({ ...l, hidden: !l.show }))
    .filter((l) => l.show || signedInAsAdmin);

  // The three pages these used to point at are this repository's own legal documents, naming its
  // company number and registered office, and every site linked to them. A site says where its
  // own are; until it does, there is no link. Ours keeps its pages without having to say so.
  const ours = isOurSite();
  const legal = (['privacy', 'terms', 'cookies'] as const)
    .map((page) => ({
      key: `footer.${page}`,
      label: t(`footer.${page}`),
      href: t(`footer.${page}.href`).trim() || (ours ? `/${page}` : ''),
    }))
    .filter((l) => l.href && l.label.trim());

  const description = settings.company_description?.trim()
    || (ours ? 'Empowering teams and organizations through agile training and coaching.' : '');

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
            <SiteLogo brand={settings.brand} companyName={settings.company_name} height={32} className="mb-4" />
            {/* The sentence under the name. It fell back to this repository's own, so a site that
                had not written one described itself as agile training and coaching. Ours keeps
                it; anybody else's says nothing until they write their own. */}
            {description && (
              <Editable k="site.company_description" label="this sentence" as="div" block>
                <p className="text-muted-foreground">{description}</p>
              </Editable>
            )}
          </div>

          <div>
            <Editable k="footer.quicklinks" label="this heading" as="div" block>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('footer.quicklinks')}</h3>
            </Editable>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Editable k={l.key} label="this link" outside>
                  <Link href={l.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                    {l.hidden && (
                      <span
                        title="Hidden from visitors"
                        className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
                      />
                    )}
                  </Link>
                  </Editable>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Editable k="footer.contact" label="this heading" as="div" block>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('footer.contact')}</h3>
            </Editable>
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
          <Editable k="site.copyright_text" label="the copyright line" as="div" block>
            {/* No name, no full stop after nothing: it read "© 2026 . All rights reserved." */}
            <p>{['©', year, settings.company_name?.trim() ? `${settings.company_name.trim()}.` : ''].filter(Boolean).join(' ')} {settings.copyright_text || 'All rights reserved.'}</p>
          </Editable>
          {legal.length > 0 && (
            <div className="flex gap-6">
              {legal.map((l) => (
                <Editable key={l.key} k={l.key} label="this link" outside>
                  <Link href={l.href} className="transition-colors hover:text-primary">{l.label}</Link>
                </Editable>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
