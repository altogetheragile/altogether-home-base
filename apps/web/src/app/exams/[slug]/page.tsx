import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata, JsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { ExamPlayer, type ExamForPlayer } from './ExamPlayer';

export const dynamic = 'force-dynamic';

type ExamRow = ExamForPlayer & {
  seo_title: string | null;
  seo_description: string | null;
};

async function getExam(slug: string): Promise<ExamRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exams')
      .select(
        'id, title, description, scenario, shuffle, duration_minutes, pass_mark, total_questions, seo_title, seo_description',
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
  const { slug } = await params;
  const exam = await getExam(slug);
  if (!exam) return { title: 'Exam not found' };
  return buildMetadata({
    title: exam.seo_title || exam.title,
    description:
      exam.seo_description ||
      exam.description ||
      `Free ${examSubject(exam.title)} practice exam with answers and explanations.`,
    path: `/exams/${slug}`,
    ogImage: `${SITE_URL}/og/exams/${slug}.png`,
  });
}

function quizJsonLd(exam: ExamRow, slug: string) {
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
    provider: { '@type': 'Organization', name: 'Altogether Agile', url: SITE_URL },
  };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = await getExam(slug);
  if (!exam) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* SEO structured data; the visible h1/description/stats are server-rendered
          by the player's start card (a client component, SSR'd by Next). */}
      <JsonLd data={quizJsonLd(exam, slug)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Practice Exams', path: '/exams' },
          { name: exam.title, path: `/exams/${slug}` },
        ])}
      />
      <ExamPlayer exam={exam} />
    </main>
  );
}
