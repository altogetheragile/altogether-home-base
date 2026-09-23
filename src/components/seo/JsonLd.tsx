import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';

// The App's structured data does not reach a crawler - prerender.mjs writes what Google sees - but
// it is in the DOM, and a second site should not have somebody else's founder in its DOM either.
// A constant rather than a settings read: this file is a pure component and the App has no server
// render to resolve it in. scripts/prerender.mjs reads the real value.
const FOUNDER_NAME = 'Alun Davies-Baker';

// The same reasoning as FOUNDER_NAME. These are pure components with no server render to resolve a
// setting in, and prerender.mjs writes what a crawler actually reads. A second site should still
// not have this one's name in its DOM, so the value is in one place rather than five.
const COMPANY_NAME = 'Altogether Agile';

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
    name: COMPANY_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description: 'Practical agile training and coaching from the co-author of AgilePM3 v2 and AgileBA v3. 80+ techniques, 25 years of hands-on experience, delivered personally.',
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      jobTitle: 'Agile Coach & Trainer',
      // What he is an authority ON, in the machine-readable half of the page. The visible hero
      // says he co-wrote these; this is the same claim where a search engine can read it.
      knowsAbout: ['AgilePM3 v2', 'AgileBA v3', 'Agile Project Management', 'Agile Business Analysis', 'Scrum'],
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
    description: description || `${title} - professional training course by ${COMPANY_NAME}.`,
    url,
    provider: {
      '@type': 'Organization',
      name: COMPANY_NAME,
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
      name: FOUNDER_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY_NAME,
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
    description: description || `Learn about ${name} - a practical agile technique.`,
    url,
    ...(category && {
      about: {
        '@type': 'Thing',
        name: category,
      },
    }),
    author: {
      '@type': 'Organization',
      name: COMPANY_NAME,
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
