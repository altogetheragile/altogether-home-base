'use client';

import { moduleIsOn } from '@altogether/ui/modules';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteLogo } from '@/components/SiteLogo';
import type { SiteSettings } from '@/lib/site-settings';

// The URL is fixed by the file that answers it; the label is not. A freelancer who sells
// "Services" should not have to say "Coaching" because that is what the folder is called, so
// every label here is a copy key an admin can edit. Defaults live in copy/navigation.json.
const TOP_LINKS = [
  { key: 'nav.events', href: '/events', flag: 'show_events' },
  { key: 'nav.coaching', href: '/coaching', flag: 'show_coaching' },
  { key: 'nav.about', href: '/about', flag: 'show_about' },
  { key: 'nav.contact', href: '/contact', flag: 'show_contact' },
  { key: 'nav.testimonials', href: '/testimonials', flag: 'show_testimonials' },
] as const;

const RESOURCE_LINKS = [
  { key: 'nav.knowledge', href: '/knowledge-base', flag: 'show_knowledge' },
  { key: 'nav.blog', href: '/blog', flag: 'show_blog' },
  { key: 'nav.exams', href: '/exams', flag: 'show_exams' },
  { key: 'nav.ai_tools', href: '/ai-tools', flag: 'show_ai_tools' },
  { key: 'nav.flow_game', href: '/flow-game', flag: 'show_flow_game' },
] as const;

/** Shipped wording, so this renders correctly in a test and if the copy fetch fails. */
const FALLBACK: Record<string, string> = {
  'nav.events': 'Events', 'nav.coaching': 'Coaching', 'nav.about': 'About',
  'nav.contact': 'Contact', 'nav.testimonials': 'Testimonials', 'nav.resources': 'Resources',
  'nav.knowledge': 'Knowledge Base', 'nav.blog': 'Blog', 'nav.exams': 'Practice Exams',
  'nav.ai_tools': 'AI Tools', 'nav.flow_game': 'Flow Game',
};

export function Navigation({
  settings,
  signedIn = false,
  name = null,
  labels,
}: {
  settings: SiteSettings;
  signedIn?: boolean;
  /** Their own name, read from the real session on the server. Null when signed out. */
  name?: string | null;
  /** Menu labels, resolved on the server because getCopy needs a server client. */
  labels?: Record<string, string>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Read from the real session on the server (lib/auth.ts), not from the presence cookie this
  // used to trust. /dashboard is still gated by the App; this only decides what the button says.
  const authCta = signedIn ? { href: '/dashboard', label: 'Dashboard' } : { href: '/auth', label: 'Sign In' };

  // One list of defaults, shared with the module gate. They used to disagree, and a site with
  // no settings row showed links to pages that answered 404.
  const flag = (key: string) => moduleIsOn(key.replace(/^show_/, ''), settings as Record<string, unknown>);
  const label = (key: string) => labels?.[key] || FALLBACK[key] || '';
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const topLinks = TOP_LINKS.filter((l) => flag(l.flag));
  const resourceLinks = settings.show_resources !== false ? RESOURCE_LINKS.filter((l) => flag(l.flag)) : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={`${settings.company_name ?? 'Home'}, home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <SiteLogo brand={settings.brand} companyName={settings.company_name} height={36} className="" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {topLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                isActive(l.href) ? 'text-primary' : 'text-foreground',
              )}
            >
              {label(l.key)}
            </Link>
          ))}

          {resourceLinks.length > 0 && (
            <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
              <button
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                aria-expanded={resourcesOpen}
                onClick={() => setResourcesOpen((o) => !o)}
              >
                {label('nav.resources')} <ChevronDown size={16} />
              </button>
              {resourcesOpen && (
                <div className="absolute left-0 top-full min-w-[200px] rounded-md border border-border bg-background py-1 shadow-lg">
                  {resourceLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-primary"
                      onClick={() => setResourcesOpen(false)}
                    >
                      {label(l.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {name && (
            <span className="ml-2 hidden text-sm text-muted-foreground lg:inline" data-testid="nav-greeting">
              Hi, {name}
            </span>
          )}
          {/* A plain anchor, not <Link>: /auth and /dashboard are App-owned URLs this app does
              not serve, so a client transition would prefetch a route that cannot answer and
              then fall back to a full load anyway. */}
          <a
            href={authCta.href}
            className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {authCta.label}
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {topLinks.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent" onClick={() => setMobileOpen(false)}>
                {label(l.key)}
              </Link>
            ))}
            {resourceLinks.length > 0 && (
              <>
                <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label('nav.resources')}</p>
                {resourceLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent" onClick={() => setMobileOpen(false)}>
                    {label(l.key)}
                  </Link>
                ))}
              </>
            )}
            {name && (
              <span className="mt-2 px-3 text-sm text-muted-foreground" data-testid="nav-greeting-mobile">
                Hi, {name}
              </span>
            )}
            <a href={authCta.href} className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground" onClick={() => setMobileOpen(false)}>
              {authCta.label}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
