'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/lib/site-settings';

const TOP_LINKS = [
  { label: 'Events', href: '/events', flag: 'show_events', def: true },
  { label: 'Coaching', href: '/coaching', flag: 'show_coaching', def: true },
  { label: 'About', href: '/about', flag: 'show_about', def: true },
  { label: 'Contact', href: '/contact', flag: 'show_contact', def: true },
  { label: 'Testimonials', href: '/testimonials', flag: 'show_testimonials', def: true },
] as const;

const RESOURCE_LINKS = [
  { label: 'Knowledge Base', href: '/knowledge-base', flag: 'show_knowledge', def: false },
  { label: 'Blog', href: '/blog', flag: 'show_blog', def: true },
  { label: 'Practice Exams', href: '/exams', flag: 'show_exams', def: true },
  { label: 'AI Tools', href: '/ai-tools', flag: 'show_ai_tools', def: false },
  { label: 'Flow Game', href: '/flow-game', flag: 'show_flow_game', def: true },
] as const;

export function Navigation({ settings, signedIn = false }: { settings: SiteSettings; signedIn?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // The App (the SPA) publishes a non-sensitive presence cookie; if it's set we point
  // people at their dashboard (still auth-gated on the App) instead of "Sign In".
  const authCta = signedIn ? { href: '/dashboard', label: 'Dashboard' } : { href: '/auth', label: 'Sign In' };

  const flag = (key: string, def: boolean) => {
    const v = settings[key as keyof SiteSettings];
    return v == null ? def : !!v;
  };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const topLinks = TOP_LINKS.filter((l) => flag(l.flag, l.def));
  const resourceLinks = flag('show_resources', true) ? RESOURCE_LINKS.filter((l) => flag(l.flag, l.def)) : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Altogether Agile home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup-horizontal-tight.svg" alt="Altogether Agile" className="h-9 w-auto" />
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
              {l.label}
            </Link>
          ))}

          {resourceLinks.length > 0 && (
            <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
              <button
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                aria-expanded={resourcesOpen}
                onClick={() => setResourcesOpen((o) => !o)}
              >
                Resources <ChevronDown size={16} />
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
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link
            href={authCta.href}
            className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {authCta.label}
          </Link>
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
                {l.label}
              </Link>
            ))}
            {resourceLinks.length > 0 && (
              <>
                <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resources</p>
                {resourceLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent" onClick={() => setMobileOpen(false)}>
                    {l.label}
                  </Link>
                ))}
              </>
            )}
            <Link href={authCta.href} className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground" onClick={() => setMobileOpen(false)}>
              {authCta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
