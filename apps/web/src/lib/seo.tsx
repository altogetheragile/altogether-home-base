import type { Metadata } from 'next';

export const SITE_URL = 'https://altogetheragile.com';
export const SITE_NAME = 'Altogether Agile';

export function truncateText(str: string, len = 160): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1).trimEnd() + '…' : str;
}

/**
 * Build per-page metadata. This replaces scripts/prerender.mjs: each route owns
 * its own title/description/canonical/OG, generated from data, with no separate
 * list to drift out of sync.
 */
export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${SITE_URL}${opts.path === '/' ? '' : opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
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
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description:
      'Practical agile training and coaching from the co-author of AgilePM3 v2 and AgileBA v3. 80+ techniques, 25 years of hands-on experience, delivered personally.',
    founder: {
      '@type': 'Person',
      name: 'Alun Davies-Baker',
      jobTitle: 'Agile Coach & Trainer',
      // What he is an authority ON, where a search engine can read it. The hero says the same
      // thing in words.
      knowsAbout: ['AgilePM3 v2', 'AgileBA v3', 'Agile Project Management', 'Agile Business Analysis', 'Scrum'],
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@altogetheragile.com',
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

export function blogPostingJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
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
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}

const COURSE_PROVIDER = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  areaServed: ['London', 'United Kingdom'],
};

/** A single training course (provider = Altogether Agile). */
export function courseJsonLd(opts: {
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
    provider: COURSE_PROVIDER,
  };
}

/** ItemList of Course entries for the catalogue page. */
export function courseListJsonLd(name: string, items: { name: string; description: string; path: string }[]) {
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
        provider: COURSE_PROVIDER,
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
