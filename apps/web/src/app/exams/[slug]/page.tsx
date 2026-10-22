import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata, JsonLd, breadcrumbJsonLd, SITE_URL, siteName } from '@/lib/seo';
import { ExamPlayer, type ExamForPlayer, type Sibling } from './ExamPlayer';
import { requireModule, moduleHidden } from '@/lib/module-gate';
import { showsAdminView } from '@/lib/auth';
import { GuideEditor } from './GuideEditor';
import { getCopy } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';

type ExamRow = ExamForPlayer & {
  seo_title: string | null;
  seo_description: string | null;
};

/** The other papers for the same qualification, for the links between them. */
async function getSiblings(subject: string, slug: string): Promise<Sibling[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exams')
      .select('title, slug, total_questions, duration_minutes')
      .eq('status', 'published');
    return ((data ?? []) as Sibling[])
      .filter((e) => e.slug !== slug && examSubject(e.title) === subject)
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

async function getExam(slug: string): Promise<ExamRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exams')
      .select(
        'id, title, description, guide, scenario, shuffle, duration_minutes, pass_mark, total_questions, seo_title, seo_description',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    return (data as ExamRow) ?? null;
  } catch {
    return null;
  }
}

/** Drop "- Paper N" / "- Sample" to get the qualification subject. */
function examSubject(title: string) {
  return title.replace(/\s*[-–]\s*(Paper|Sample).*$/i, '').trim() || title;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // A page this site has switched off does not name itself. See lib/module-gate.ts.
  if (await moduleHidden('exams')) return {};
  const { slug } = await params;
  const [exam, t] = await Promise.all([getExam(slug), getCopy('exam')]);
  if (!exam) return { title: t('exam.meta.notFound') };
  return buildMetadata({
    title: exam.seo_title || exam.title,
    description:
      exam.seo_description ||
      exam.description ||
      t('exam.meta.description').replace('{subject}', examSubject(exam.title)),
    path: `/exams/${slug}`,
    ogImage: `${SITE_URL}/og/exams/${slug}.png`,
  });
}

async function quizJsonLd(exam: ExamRow, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: exam.title,
    description: exam.description || `Practice exam: ${exam.title}.`,
    url: `${SITE_URL}/exams/${slug}`,
    educationalUse: 'practice',
    learningResourceType: 'Practice exam',
    isAccessibleForFree: true,
    about: { '@type': 'Thing', name: examSubject(exam.title) },
    provider: { '@type': 'Organization', name: await siteName(), url: SITE_URL },
  };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireModule('exams');
  const { slug } = await params;
  const exam = await getExam(slug);
  if (!exam) notFound();
  const [siblings, t] = await Promise.all([getSiblings(examSubject(exam.title), slug), getCopy('exam')]);
  // Every word the player says, read here because the player runs in the browser and this site's
  // copy is read on the server. Listed out rather than looped so each key is visibly read, which is
  // how the registry test knows the page uses it.
  const words = {
    'start.back': t('exam.start.back'), 'start.questions': t('exam.start.questions'),
    'start.duration': t('exam.start.duration'), 'start.passMark': t('exam.start.passMark'),
    'start.minutes': t('exam.start.minutes'), 'start.shuffle': t('exam.start.shuffle'),
    'start.shuffleHint': t('exam.start.shuffleHint'), 'start.examMode': t('exam.start.examMode'),
    'start.practiceMode': t('exam.start.practiceMode'), 'start.modesHint': t('exam.start.modesHint'),
    'others.one': t('exam.others.one'), 'others.many': t('exam.others.many'), 'others.questions': t('exam.others.questions'),
    'play.loading': t('exam.play.loading'), 'play.question': t('exam.play.question'),
    'play.answered': t('exam.play.answered'), 'play.flagged': t('exam.play.flagged'),
    'play.scenario': t('exam.play.scenario'), 'play.matching': t('exam.play.matching'),
    'play.options': t('exam.play.options'), 'play.selectN': t('exam.play.selectN'), 'play.confirm': t('exam.play.confirm'),
    'nav.prev': t('exam.nav.prev'), 'nav.next': t('exam.nav.next'), 'nav.unanswered': t('exam.nav.unanswered'),
    'nav.flagged': t('exam.nav.flagged'), 'nav.flag': t('exam.nav.flag'), 'nav.unflag': t('exam.nav.unflag'),
    'nav.finish': t('exam.nav.finish'), 'nav.progress': t('exam.nav.progress'),
    'nav.legendAnswered': t('exam.nav.legendAnswered'), 'nav.legendFlagged': t('exam.nav.legendFlagged'),
    'nav.legendCurrent': t('exam.nav.legendCurrent'),
    'results.passed': t('exam.results.passed'), 'results.notPassed': t('exam.results.notPassed'),
    'results.summary': t('exam.results.summary'), 'results.retake': t('exam.results.retake'),
    'results.reference': t('exam.results.reference'),
  };
  // Read from the real session on the server. A visitor never receives the editor's code, and
  // saving re-checks this anyway (see actions.ts).
  const canEdit = await showsAdminView();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* SEO structured data; the visible h1/description/stats are server-rendered
          by the player's start card (a client component, SSR'd by Next). */}
      <JsonLd data={await quizJsonLd(exam, slug)} />
      <JsonLd
        data={breadcrumbJsonLd([
          // Home and the exams page under whatever this site calls them, as on every other page.
          ...(await pageCrumbs('exams', '/exams', 'Practice Exams')),
          { name: exam.title, path: `/exams/${slug}` },
        ])}
      />
      <ExamPlayer exam={exam} siblings={siblings} words={words} />
      {canEdit && <GuideEditor examId={exam.id} initial={exam.guide ?? ''} />}
    </main>
  );
}
