import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata, JsonLd, breadcrumbJsonLd, siteName } from '@/lib/seo';
import { requireModule } from '@/lib/module-gate';
import { boardContent, pageIn } from '@/lib/scrumBoard/content';
import { BOARD_PAGES } from '@/lib/scrumBoard/boardPages';
import { Prose } from '@/lib/scrumBoard/prose';
import { colors as p } from '@/lib/brand';
import '../board.css';

export const dynamic = 'force-dynamic';

const BASE = '/scrum-on-one-page';

/** One URL per page behind the board. The design file routes these on the hash, which is one page
 *  as far as anybody searching is concerned; here they are 28, each about one thing. */
export function generateStaticParams() {
  return BOARD_PAGES.map((page) => ({ slug: page.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await boardContent().then((c) => pageIn(c, slug));
  if (!page) return {};
  const title = `${page.title} - Scrum on One Page - ${await siteName()}`;
  return {
    ...(await buildMetadata({ title, description: page.lede, path: `${BASE}/${slug}` })),
    title: { absolute: title },
  };
}

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireModule('zoo_game');
  const content = await boardContent();
  const page = pageIn(content, slug);
  if (!page) notFound();

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1rem 3rem' }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Scrum on One Page', path: BASE },
        { name: page.title, path: `${BASE}/${slug}` },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'DefinedTerm',
        name: page.title, description: page.lede,
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Scrum on One Page' },
      }} />

      <Link href={BASE} style={{ color: p.midTeal, fontSize: 13 }}>&larr; Back to the board</Link>

      <header style={{ margin: '.75rem 0 1rem' }}>
        {page.kind && <p style={{ color: p.orange, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>{page.kind}</p>}
        <h1 style={{ color: p.deepTeal, fontSize: 34, lineHeight: 1.15, margin: '.2rem 0 0' }}>{page.title}</h1>
        {page.lede && <p style={{ color: p.body, marginTop: '.5rem' }}>{page.lede}</p>}
      </header>

      {page.facts.length > 0 && (
        <dl className="board-facts">
          {page.facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {page.secs.map(([heading, body]) => (
        <section key={heading} style={{ marginTop: '1.25rem' }}>
          <h2 style={{ color: p.deepTeal, fontSize: 19, margin: '0 0 .35rem' }}>{heading}</h2>
          <Prose html={body} base={BASE} />
        </section>
      ))}

      {page.rel.length > 0 && (
        <nav aria-label="Read next" style={{ marginTop: '1.75rem', borderTop: '1px solid #E5E7EB', paddingTop: '.75rem' }}>
          <span style={{ color: p.muted, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Read next</span>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', listStyle: 'none', padding: 0, margin: '.4rem 0 0' }}>
            {page.rel.map((id) => {
              const to = pageIn(content, id);
              // Chips, not a run of links. Side by side with only a gap between them, "Definition
              // of Done Sprint Review Daily Scrum" reads as one phrase rather than three places
              // to go.
              return to ? (
                <li key={id}>
                  <Link href={`${BASE}/${id}`} className="board-next">{to.title}</Link>
                </li>
              ) : null;
            })}
          </ul>
        </nav>
      )}

      <p style={{ color: p.muted, fontSize: 13, marginTop: '2rem' }}>
        Draws on the Scrum Guide 2020, used under CC BY-SA 4.0.
      </p>
    </main>
  );
}
