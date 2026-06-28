import { notFound } from 'next/navigation';
import Link from 'next/link';
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

  const subject = examSubject(exam.title);
  const facts = [
    exam.total_questions ? `${exam.total_questions} questions` : null,
    exam.duration_minutes ? `${exam.duration_minutes} minutes` : null,
    exam.pass_mark && exam.total_questions ? `pass mark ${exam.pass_mark} of ${exam.total_questions}` : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={quizJsonLd(exam, slug)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Practice Exams', path: '/exams' },
          { name: exam.title, path: `/exams/${slug}` },
        ])}
      />

      {/* Server-rendered SEO content shell */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        {' / '}
        <Link href="/exams" className="hover:underline">Practice Exams</Link>
        {' / '}
        {exam.title}
      </nav>

      <h1 className="text-4xl font-bold tracking-tight text-foreground">{exam.title}</h1>
      {exam.description && (
        <p className="mt-4 text-base leading-7 text-muted-foreground">{exam.description}</p>
      )}
      {facts.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-muted-foreground">
          {facts.map((f) => (
            <li key={f as string}>{f}</li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-base leading-7 text-muted-foreground">
        This free practice exam helps you prepare for {subject}. Sit it as a timed mock exam, or
        switch to revision mode to work through the questions at your own pace, with answers and
        explanations for each one.
      </p>

      {/* Interactive widget (client) */}
      <div className="mt-8">
        <ExamPlayer exam={exam} />
      </div>
    </main>
  );
}
