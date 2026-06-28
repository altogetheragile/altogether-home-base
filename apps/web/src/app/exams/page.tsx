import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata, JsonLd, faqPageJsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';
import { EXAM_FAQS } from '@/lib/exam-faqs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'AgilePM & Scrum Practice Exams',
  description:
    'Free AgilePM Foundation and Scrum Master practice exam questions with answers. Timed mock exams and revision mode to prepare for your agile certification.',
  path: '/exams',
});

type ExamRow = {
  slug: string;
  title: string;
  description: string | null;
  total_questions: number | null;
  duration_minutes: number | null;
  pass_mark: number | null;
};

async function getExams(): Promise<ExamRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exams')
      .select('slug, title, description, total_questions, duration_minutes, pass_mark')
      .eq('status', 'published')
      .order('title');
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ExamsPage() {
  const exams = await getExams();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <JsonLd data={faqPageJsonLd(EXAM_FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Practice Exams', path: '/exams' },
        ])}
      />
      <JsonLd data={itemListJsonLd(exams.map((e) => ({ name: e.title, path: `/exams/${e.slug}` })))} />

      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Free Agile Practice Exams</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Free practice papers for AgilePM Foundation, AgilePM Practitioner and Professional Scrum
          Master. Sit a timed mock exam or revise at your own pace, with answers and explanations for
          every question.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {exams.map((exam) => {
          const facts = [
            exam.total_questions ? `${exam.total_questions} questions` : null,
            exam.duration_minutes ? `${exam.duration_minutes} min` : null,
            exam.pass_mark && exam.total_questions ? `pass ${exam.pass_mark}/${exam.total_questions}` : null,
          ].filter(Boolean);
          return (
            <Card key={exam.slug} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  <Link href={`/exams/${exam.slug}`} className="text-primary hover:underline">
                    {exam.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {exam.description && (
                  <p className="text-sm leading-6 text-muted-foreground">{exam.description}</p>
                )}
                {facts.length > 0 && (
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{facts.join(' · ')}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild size="sm">
                  <Link href={`/exams/${exam.slug}`}>Start the practice exam</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {exams.length === 0 && (
          <p className="text-sm text-muted-foreground">No published exams found.</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-6">
          {EXAM_FAQS.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-foreground">{f.q}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
