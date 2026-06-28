import Link from 'next/link';
import type { Metadata } from 'next';
import { ClipboardList, Clock, Award, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata, JsonLd, faqPageJsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';
import { EXAM_FAQS } from '@/lib/exam-faqs';

export const dynamic = 'force-dynamic';

// Brand teal palette (mirrors src/theme/colors.ts in the Vite app).
const c = {
  white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF',
  midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280',
};

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
    <>
      <JsonLd data={faqPageJsonLd(EXAM_FAQS)} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Practice Exams', path: '/exams' }])} />
      <JsonLd data={itemListJsonLd(exams.map((e) => ({ name: e.title, path: `/exams/${e.slug}` })))} />

      {/* Teal gradient hero */}
      <div style={{ background: `linear-gradient(135deg, ${c.deepTeal} 0%, #006666 100%)`, padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: c.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          Free Agile Practice Exams
        </h1>
        <p style={{ color: c.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginInline: 'auto' }}>
          Prepare for your agile certification with timed mock exams or work through questions at your
          own pace in revision mode. Free AgilePM Foundation and Scrum Master practice questions with
          answers.
        </p>
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><HelpCircle size={14} /> {exam.total_questions} questions</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><Clock size={14} /> {exam.duration_minutes} min</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: c.muted }}><Award size={14} /> Pass: {exam.pass_mark}/{exam.total_questions}</span>
                </div>
                <Link href={`/exams/${exam.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.orange, color: c.deepTeal, padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', alignSelf: 'flex-start' }}>
                  <ClipboardList size={15} /> Start Exam
                </Link>
              </div>
            </div>
          ))}
          {exams.length === 0 && <p style={{ color: c.muted }}>No exams available yet. Check back soon.</p>}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: c.white, borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
          <h2 style={{ color: c.deepTeal, fontSize: 26, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.25 }}>Frequently Asked Questions</h2>
          {EXAM_FAQS.map((f) => (
            <div key={f.q} style={{ marginBottom: 20 }}>
              <h3 style={{ color: c.deepTeal, fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4 }}>{f.q}</h3>
              <p style={{ color: c.body, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`.exams-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px}.exam-card{transition:box-shadow .2s,transform .2s}.exam-card:hover{box-shadow:0 8px 24px rgba(0,77,77,.10);transform:translateY(-2px)}`}</style>
    </>
  );
}
