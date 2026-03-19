import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd = ({ data }: JsonLdProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

export const OrganizationSchema = () => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Altogether Agile',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description: 'Certified agile courses, practical coaching, and 80+ techniques for teams who want real results.',
    founder: {
      '@type': 'Person',
      name: 'Alun Davies-Baker',
      jobTitle: 'Agile Coach & Trainer',
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@altogetheragile.com',
    },
  }} />
);

export const CourseSchema = ({ title, description, url, startDate, endDate, locationName, priceCents, currency }: {
  title: string;
  description?: string | null;
  url: string;
  startDate?: string | null;
  endDate?: string | null;
  locationName?: string | null;
  priceCents?: number | null;
  currency?: string | null;
}) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description || `${title} — professional training course by Altogether Agile.`,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Altogether Agile',
      url: SITE_URL,
    },
    ...(startDate && {
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: locationName ? 'Blended' : 'Online',
        startDate,
        ...(endDate && { endDate }),
        ...(locationName && {
          location: {
            '@type': 'Place',
            name: locationName,
          },
        }),
        ...((priceCents && priceCents > 0) && {
          offers: {
            '@type': 'Offer',
            price: (priceCents / 100).toFixed(2),
            priceCurrency: currency || 'GBP',
            availability: 'https://schema.org/InStock',
          },
        }),
      },
    }),
  }} />
);

export const BlogPostSchema = ({ title, description, url, datePublished, dateModified, imageUrl }: {
  title: string;
  description?: string | null;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  imageUrl?: string | null;
}) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    ...(description && { description }),
    url,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(imageUrl && { image: imageUrl }),
    author: {
      '@type': 'Person',
      name: 'Alun Davies-Baker',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Altogether Agile',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
  }} />
);

export const TechniqueSchema = ({ name, description, url, category }: {
  name: string;
  description?: string | null;
  url: string;
  category?: string | null;
}) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description: description || `Learn about ${name} — a practical agile technique.`,
    url,
    ...(category && {
      about: {
        '@type': 'Thing',
        name: category,
      },
    }),
    author: {
      '@type': 'Organization',
      name: 'Altogether Agile',
    },
  }} />
);

export const BreadcrumbSchema = ({ items }: { items: { name: string; url: string }[] }) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }} />
);
