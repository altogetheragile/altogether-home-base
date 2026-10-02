import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, JsonLd, breadcrumbJsonLd, siteName } from '@/lib/seo';
import { requireModule } from '@/lib/module-gate';
import { boardContent } from '@/lib/scrumBoard/content';
import { Board } from './Board';
import { colors as p } from '@/lib/brand';
import './board.css';

export const dynamic = 'force-dynamic';

const PATH = '/scrum-on-one-page';
const LEDE = 'The whole of Scrum on one page: the Sprint, its five events, three accountabilities, three artifacts and their commitments. Every shape opens the page behind it.';

export async function generateMetadata(): Promise<Metadata> {
  const title = `Scrum on One Page - ${await siteName()}`;
  return { ...(await buildMetadata({ title, description: LEDE, path: PATH })), title: { absolute: title } };
}

export default async function ScrumOnOnePage() {
  await requireModule('zoo_game');
  const content = await boardContent();
  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 1rem 3rem' }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Scrum on One Page', path: PATH }])} />
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 40, lineHeight: 1.1, margin: 0 }}>Scrum on One Page</h1>
        <p style={{ color: p.body, maxWidth: '46rem', marginTop: '.6rem' }}>{LEDE}</p>
      </header>

      <Board content={content} base={PATH} />

      {/* Every page, listed. The board is the way in for somebody who wants the shape of Scrum;
          this is the way in for somebody who came looking for one word of it, and it is what makes
          all 28 reachable without a pointer. */}
      <nav aria-label="Every page" style={{ marginTop: '2rem' }}>
        <h2 style={{ color: p.deepTeal, fontSize: 22, marginBottom: '.6rem' }}>Everything on the board</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '.35rem .9rem', listStyle: 'none', padding: 0 }}>
          {content.pages.map((page) => (
            <li key={page.id}>
              <Link href={`${PATH}/${page.id}`} style={{ color: p.midTeal }}>{page.title}</Link>
              {page.kind && <span style={{ color: p.muted, fontSize: 12 }}> · {page.kind}</span>}
            </li>
          ))}
        </ul>
      </nav>

      <p style={{ color: p.muted, fontSize: 13, marginTop: '2rem' }}>
        Text on these pages draws on the Scrum Guide 2020, used under CC BY-SA 4.0. The board,
        its icons and the exercises are Altogether Agile&rsquo;s own.
      </p>
    </main>
  );
}
