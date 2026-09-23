import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { founderOf } from '@/lib/brand';

/** This deployment's public address. A second site sets NEXT_PUBLIC_SITE_URL; without it the
 *  canonical, the Open Graph url and every absolute link would point at altogetheragile.com from
 *  somebody else's domain, which is the one SEO mistake that is actively harmful rather than
 *  merely wrong. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://altogetheragile.com').replace(/\/$/, '');

/** The name this repository ships with. Used when a site has not set its own. */
export const SITE_NAME = 'Altogether Agile';

/** What this site calls itself.
 *
 *  It appeared as a constant in eleven places: the Open Graph site name, the Organization in four
 *  kinds of structured data, and the suffix on every page title. On a second site every one of
 *  those said Altogether Agile, which is the sort of thing a crawler believes. */
export async function siteName(): Promise<string> {
  const settings = await getSiteSettings();
  return settings.company_name?.trim() || SITE_NAME;
}

export function truncateText(str: string, len = 160): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1).trimEnd() + '…' : str;
}

/**
 * Build per-page metadata. This replaces scripts/prerender.mjs: each route owns
 * its own title/description/canonical/OG, generated from data, with no separate
 * list to drift out of sync.
 */
export async function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
}): Promise<Metadata> {
  const url = `${SITE_URL}${opts.path === '/' ? '' : opts.path}`;
  const name = await siteName();
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: name,
      type: opts.type ?? 'website',
      images: opts.ogImage ? [opts.ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: opts.ogImage ? [opts.ogImage] : undefined,
    },
  };
}

/** Render a JSON-LD block. Use inside a Server Component's JSX. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Data is built server-side from our own content, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** The Organization block on the home page.
 *
 *  This is the one that is actually SERVED. `/` is a Next route - the build cuts the prerendered
 *  SPA home page over to `_spa.html` and lets Next own the path - so the richer copy of this block
 *  in `src/components/seo/JsonLd.tsx` and `scripts/prerender.mjs` never reaches a crawler for the
 *  home page. This one had no logo, no founder and no contact point, so the front page of the site
 *  was emitting the least structured data of the three. */
export async function organizationJsonLd(logo?: string) {
  const settings = await getSiteSettings();
  const founder = founderOf(settings);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: await siteName(),
    url: SITE_URL,
    logo: logo ?? `${SITE_URL}/og-image.png`,
    description:
      'Practical agile training and coaching from the co-author of AgilePM3 v2 and AgileBA v3. 80+ techniques, 25 years of hands-on experience, delivered personally.',
    // Only claimed if this site has a founder. A business that does not lead with a person should
    // not be telling Google it was founded by one.
    ...(founder.shown
      ? {
          founder: {
            '@type': 'Person',
            name: founder.name,
            jobTitle: 'Agile Coach & Trainer',
            // What they are an authority ON, where a search engine can read it. The hero says the
            // same thing in words.
            knowsAbout: ['AgilePM3 v2', 'AgileBA v3', 'Agile Project Management', 'Agile Business Analysis', 'Scrum'],
          },
        }
      : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      email: settings.contact_email || 'info@altogetheragile.com',
      contactType: 'customer service',
    },
  };
}

export function faqPageJsonLd(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === '/' ? '' : it.path}`,
    })),
  };
}

export async function blogPostingJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
  const publisherName = await siteName();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    mainEntityOfPage: `${SITE_URL}${opts.path}`,
    image: opts.image || undefined,
    datePublished: opts.datePublished || undefined,
    dateModified: opts.dateModified || opts.datePublished || undefined,
    author: { '@type': 'Organization', name: publisherName, url: SITE_URL },
    publisher: { '@type': 'Organization', name: publisherName, url: SITE_URL },
  };
}

/** A function rather than a constant, because the name is no longer known at module load. */
const courseProvider = async () => ({
  '@type': 'Organization',
  name: await siteName(),
  url: SITE_URL,
  areaServed: ['London', 'United Kingdom'],
});

/** A single training course (provider = Altogether Agile). */
export async function courseJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    provider: await courseProvider(),
  };
}

/** ItemList of Course entries for the catalogue page. */
export async function courseListJsonLd(name: string, items: { name: string; description: string; path: string }[]) {
  const provider = await courseProvider();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: it.name,
        description: it.description,
        url: `${SITE_URL}${it.path}`,
        provider,
      },
    })),
  };
}

export function itemListJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: `${SITE_URL}${it.path}`,
    })),
  };
}
