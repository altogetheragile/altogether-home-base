import type { Metadata } from 'next';
import { Editable } from '@/components/edit/Editable';
import { buildMetadata, JsonLd, breadcrumbJsonLd, siteName, SITE_URL } from '@/lib/seo';
import { colors as c, fonts } from '@/lib/brand';
import { requireModule, moduleHidden } from '@/lib/module-gate';
import { getSiteSettings } from '@/lib/site-settings';
import { getCopy } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';
import { getReadingList } from '@/lib/readingList';
import { amazonLink, AMAZON_DISCLOSURE } from '@altogether/ui/amazon';
import { ReadingListBrowser } from './ReadingListBrowser';

// The books are server-rendered, every visible one in the HTML, so a crawler that runs no script
// still reads the whole list. Searching and the topic buttons are the browser narrowing what is
// already there.

export const dynamic = 'force-dynamic';

const PATH = '/resources/reading-list';

export async function generateMetadata(): Promise<Metadata> {
  // A page this site has switched off does not name itself. See lib/module-gate.ts.
  if (await moduleHidden('reading_list')) return {};
  const t = await getCopy('readingList');
  const title = `${t('readingList.meta.titlePrefix')} - ${await siteName()}`;
  return {
    ...(await buildMetadata({ title, description: t('readingList.meta.description'), path: PATH })),
    title: { absolute: title },
  };
}

export default async function ReadingListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  await requireModule('reading_list');
  const [shelves, settings, t, params] = await Promise.all([
    getReadingList(), getSiteSettings(), getCopy('readingList'), searchParams,
  ]);
  const tag = (settings as { amazon_associate_tag?: string | null }).amazon_associate_tag ?? '';

  // Links are built here, once, so the browser is handed finished URLs and never the tag logic.
  const withLinks = shelves.map((s) => ({
    category: { id: s.category.id, name: s.category.name, slug: s.category.slug, description: s.category.description },
    books: s.books.map((b) => ({
      id: b.id, title: b.title, author: b.author, blurb: b.blurb, featured: b.is_featured,
      href: amazonLink(b, tag),
    })),
  }));

  const wanted = typeof params.category === 'string' ? params.category : '';
  const initialCategory = withLinks.some((s) => s.category.slug === wanted) ? wanted : '';

  // Every visible book, in the order the page shows them. Book is the honest type: these are
  // recommendations, not products this site sells, so no Offer and no price.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('readingList.hero.heading'),
    url: `${SITE_URL}${PATH}`,
    numberOfItems: withLinks.reduce((n, s) => n + s.books.length, 0),
    itemListElement: withLinks
      .flatMap((s) => s.books.map((b) => ({ b, genre: s.category.name })))
      .map(({ b, genre }, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Book',
          name: b.title,
          ...(b.author ? { author: b.author.split(/,\s*|\s+and\s+/).map((name) => ({ '@type': 'Person', name })) } : {}),
          genre,
          url: b.href,
        },
      })),
  };

  return (
    <div style={{ fontFamily: fonts.sans, background: c.white }}>
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('readingList', PATH, 'Reading List'))} />
      <JsonLd data={itemList} />

      <div id="main-content" style={{ background: c.paleTeal, padding: '56px 16px', textAlign: 'center' }}>
        <Editable k="readingList.hero.heading" label="this text" as="div" block>
          <h1 style={{ fontFamily: fonts.serif, color: c.deepTeal, fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 400, margin: '0 0 12px', lineHeight: 1.15 }}>
            {t('readingList.hero.heading')}
          </h1>
        </Editable>
        <Editable k="readingList.hero.intro" label="this text" as="div" block>
          <p style={{ color: c.body, fontSize: 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 640 }}>{t('readingList.hero.intro')}</p>
        </Editable>
        <p style={{ color: c.body, fontSize: 13, margin: '14px auto 0', maxWidth: 640 }}>{AMAZON_DISCLOSURE}</p>
      </div>

      <ReadingListBrowser
        shelves={withLinks}
        initialCategory={initialCategory}
        words={{
          all: t('readingList.filter.all'),
          reset: t('readingList.reset'),
          filterLabel: t('readingList.filter.label'),
          searchLabel: t('readingList.search.label'),
          count: t('readingList.count'),
          empty: t('readingList.empty'),
          button: t('readingList.button'),
          featured: t('readingList.featured'),
        }}
      />

      <p style={{ color: c.muted, fontSize: 13, textAlign: 'center', padding: '0 16px 48px', margin: 0 }}>{AMAZON_DISCLOSURE}</p>
    </div>
  );
}
