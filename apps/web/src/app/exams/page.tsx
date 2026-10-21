import Link from 'next/link';
import { Editable } from '@/components/edit/Editable';
import type { Metadata } from 'next';
import { ClipboardList, Clock, Award, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata, JsonLd, faqPageJsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';
import { colors as c } from '@/lib/brand';
import { requireModule, moduleHidden } from '@/lib/module-gate';
import { getCopy, list, items } from '@/lib/copy';
import { Prose } from '@/lib/copy/Prose';
import { EmptySection } from '@/components/edit/EmptySection';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  // A page this site has switched off does not name itself. See lib/module-gate.ts.
  if (await moduleHidden('exams')) return {};
  const t = await getCopy('exams');
  return buildMetadata({
  title: t('exams.meta.titlePrefix'),
  description: t('exams.meta.description'),
  path: '/exams',
});
}

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
  await requireModule('exams');
  const [exams, t] = await Promise.all([getExams(), getCopy('exams')]);
  // The questions people ask, as this site answers them. They were a list in code making this
  // repository's claims about its own papers, in the first person, on every site and to Google.
  const faqs = items<{ question: string; answer: string }>(t('exams.faq.items'), ['question', 'answer']);
  const fill = (template: string, vars: Record<string, string | number | null>) =>
    template.replace(/\{(\w+)\}/g, (hole, name: string) => (name in vars ? String(vars[name] ?? '') : hole));

  return (
    <>
      {faqs.length > 0 && <JsonLd data={faqPageJsonLd(faqs.map((f) => ({ q: f.question, a: f.answer })))} />}
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('exams', '/exams', 'Practice Exams'))} />
      <JsonLd data={itemListJsonLd(exams.map((e) => ({ name: e.title, path: `/exams/${e.slug}` })))} />

      {/* Teal gradient hero */}
      <div style={{ background: `linear-gradient(135deg, ${c.deepTeal} 0%, ${c.heroTeal} 100%)`, padding: '48px 24px', textAlign: 'center' }}>
        <Editable k="exams.hero.heading" label="this heading" as="div" block>
          <h1 style={{ color: c.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{t('exams.hero.heading')}</h1>
        </Editable>
        <Prose k="exams.hero.intro" text={t('exams.hero.intro')} style={{ color: c.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginInline: 'auto' }} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.slug} className="exam-card" style={{ background: c.white, borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${c.deepTeal}, ${c.midTeal})` }} />
              <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ color: c.deepTeal, fontSize: 20, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>{exam.title}</h2>
                {exam.description && (
                  <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', flex: 1 }}>{exam.description}</p>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><HelpCircle size={14} /> {fill(t('exams.card.questions'), { n: exam.total_questions })}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><Clock size={14} /> {fill(t('exams.card.minutes'), { n: exam.duration_minutes })}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><Award size={14} /> {fill(t('exams.card.passMark'), { passMark: exam.pass_mark, total: exam.total_questions })}</span>
                </div>
                <Link href={`/exams/${exam.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.orange, color: c.deepTeal, padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', alignSelf: 'flex-start' }}>
                  <ClipboardList size={15} /> {t('exams.card.start')}
                </Link>
              </div>
            </div>
          ))}
          {exams.length === 0 && <Editable k="exams.empty" label="this text" as="div" block>
                                   <p style={{ color: c.muted }}>{t('exams.empty')}</p>
                                 </Editable>}
        </div>
      </div>

      {/* About + How to prepare + FAQ (content parity with the live page) */}
      <div style={{ background: c.white, borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px' }}>
          <Editable k="exams.about.heading" label="this text" as="div" block>
            <h2 style={{ color: c.deepTeal, fontSize: 26, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>{t('exams.about.heading')}</h2>
          </Editable>
          <Editable k="exams.about.p1" label="this text" as="div" block>
            <p style={{ color: c.muted, fontSize: 16, lineHeight: 1.7, margin: '0 0 16px' }}>
              {t('exams.about.p1')}
            </p>
          </Editable>
          <Editable k="exams.about.p2" label="this text" as="div" block>
            <p style={{ color: c.muted, fontSize: 16, lineHeight: 1.7, margin: '0 0 16px' }}>
              {t('exams.about.p2')}
            </p>
          </Editable>

          <Editable k="exams.prepare.heading" label="this text" as="div" block>
            <h2 style={{ color: c.deepTeal, fontSize: 26, fontWeight: 800, margin: '40px 0 16px', lineHeight: 1.25 }}>{t('exams.prepare.heading')}</h2>
          </Editable>
          <Editable k="exams.prepare.steps" label="these steps" as="div" block>
            <ul style={{ color: c.muted, fontSize: 16, lineHeight: 1.7, margin: 0, paddingLeft: 22 }}>
              {list(t('exams.prepare.steps')).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </Editable>

          {faqs.length > 0 && (
            <>
              <Editable k="exams.faq.heading" label="this text" as="div" block>
                <h2 style={{ color: c.deepTeal, fontSize: 26, fontWeight: 800, margin: '48px 0 20px', lineHeight: 1.25 }}>{t('exams.faq.heading')}</h2>
              </Editable>
              <Editable k="exams.faq.items" label="the questions and answers" as="div" block>
                {faqs.map((f) => (
                  <div key={f.question} style={{ marginBottom: 20 }}>
                    <h3 style={{ color: c.deepTeal, fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4 }}>{f.question}</h3>
                    <p style={{ color: c.body, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{f.answer}</p>
                  </div>
                ))}
              </Editable>
            </>
          )}
        </div>
      </div>

      {faqs.length === 0 && (
        <EmptySection
          name="Questions people ask"
          why="No questions yet. They are also what search engines are told this page answers, so nothing is said until you write them."
          fills={{ kind: 'field', k: 'exams.faq.items', label: 'the questions and answers' }}
          cards={2}
        />
      )}

      <style>{`.exams-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px}.exam-card{transition:box-shadow .2s,transform .2s}.exam-card:hover{box-shadow:0 8px 24px rgba(0,77,77,.10);transform:translateY(-2px)}`}</style>
    </>
  );
}
