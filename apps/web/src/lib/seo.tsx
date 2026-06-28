import type { Metadata } from 'next';

export const SITE_URL = 'https://altogetheragile.com';
export const SITE_NAME = 'Altogether Agile';

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

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
  };
}
