import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import { colors as p } from '@/theme/colors';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BreadcrumbSchema } from '@/components/seo/JsonLd';
import { ClipboardList, Clock, Award, HelpCircle } from 'lucide-react';

interface PublicExam {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  pass_mark: number;
  total_questions: number;
}

const usePublishedExams = () =>
  useQuery({
    queryKey: ['published-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('id, slug, title, description, duration_minutes, pass_mark, total_questions')
        .eq('status', 'published')
        .order('title');
      if (error) throw error;
      return (data || []) as PublicExam[];
    },
  });

// FAQ content. Mirrored in scripts/prerender.mjs as FAQPage JSON-LD so it is
// crawler-visible. Figures match the published practice papers in the exams table.
const EXAM_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the AgilePM Foundation exam?',
    a: 'The AgilePM Foundation exam is a closed-book, multiple-choice paper that tests your knowledge of the AgilePM framework, including its principles, roles, products, and the agile project lifecycle. It is the entry-level AgilePM qualification and the prerequisite for the AgilePM Practitioner exam.',
  },
  {
    q: 'How many questions are in the AgilePM Foundation exam?',
    a: 'Our AgilePM3 Foundation practice papers contain 50 questions to answer in 40 minutes, with a pass mark of 25 out of 50 (50%). They follow the multiple-choice format of the Foundation paper and are based on the latest version of the AgilePM Handbook.',
  },
  {
    q: 'Are these AgilePM practice exams free?',
    a: 'Yes. Every practice paper on this page is free. You can sit a timed mock exam or switch to revision mode and work through the questions at your own pace, with answers and explanations.',
  },
  {
    q: 'What is the difference between AgilePM Foundation and Practitioner?',
    a: 'Foundation tests whether you understand the AgilePM framework and terminology. Practitioner goes further and tests whether you can apply the framework to a realistic project scenario. You need to pass Foundation before taking Practitioner.',
  },
  {
    q: 'How should I prepare for the AgilePM Foundation exam?',
    a: 'Read the AgilePM Handbook, learn the roles, products, and the eight principles, then practise under timed conditions. Sitting full practice papers helps you manage the time limit and spot the topics you still need to revise.',
  },
  {
    q: 'Do you offer Scrum Master practice questions?',
    a: 'Yes. Our Professional Scrum Master practice exam has 40 questions to answer in 30 minutes, with a pass mark of 34 out of 40, so you can prepare for the Scrum Master assessment alongside AgilePM.',
  },
];

const Exams = () => {
  const { data: exams, isLoading } = usePublishedExams();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Helmet>
        <title>AgilePM & Scrum Practice Exam Questions - Altogether Agile</title>
        <meta name="description" content="Free AgilePM Foundation and Scrum Master practice exam questions with answers. Timed mock exams and revision mode to prepare for your agile certification." />
        <link rel="canonical" href={`${SITE_URL}/exams`} />
        <meta property="og:title" content="AgilePM & Scrum Practice Exam Questions - Altogether Agile" />
        <meta property="og:description" content="Free AgilePM Foundation and Scrum Master practice exam questions with answers. Timed mock exams and revision mode." />
        <meta property="og:url" content={`${SITE_URL}/exams`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Practice Exams', url: `${SITE_URL}/exams` },
      ]} />
      <Navigation />

      {/* Hero */}
      <div id="main-content" style={{ background: `linear-gradient(135deg, ${p.deepTeal} 0%, #006666 100%)`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: p.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            AgilePM & Scrum Practice Exam Questions
          </h1>
          <p style={{ color: p.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Prepare for your agile certification with timed mock exams or work through questions at your own pace in revision mode. Free AgilePM Foundation and Scrum Master practice questions with answers.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        {isLoading ? (
          <div className="aa-exams-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 28, border: '1px solid #E5E7EB' }}>
                <Skeleton style={{ height: 24, width: '70%', marginBottom: 12 }} />
                <Skeleton style={{ height: 14, width: '100%', marginBottom: 6 }} />
                <Skeleton style={{ height: 14, width: '80%', marginBottom: 20 }} />
                <Skeleton style={{ height: 40, width: 140 }} />
              </div>
            ))}
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="aa-exams-grid">
            {exams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,77,77,0.10)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Teal top accent */}
                <div style={{ height: 6, background: `linear-gradient(90deg, ${p.deepTeal}, ${p.midTeal})` }} />
                <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ color: p.deepTeal, fontSize: 20, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>
                    {exam.title}
                  </h2>
                  {exam.description && (
                    <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', flex: 1 }}>
                      {exam.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: p.muted }}>
                      <HelpCircle size={14} /> {exam.total_questions} questions
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: p.muted }}>
                      <Clock size={14} /> {exam.duration_minutes} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: p.muted }}>
                      <Award size={14} /> Pass: {exam.pass_mark}/{exam.total_questions}
                    </span>
                  </div>

                  <Link
                    to={`/exams/${exam.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: p.orange,
                      color: p.deepTeal,
                      padding: '10px 24px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                      alignSelf: 'flex-start',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <ClipboardList size={15} /> Start Exam
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <ClipboardList style={{ width: 48, height: 48, color: '#9CA3AF', margin: '0 auto 16px' }} />
            <h3 style={{ color: p.deepTeal, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No exams available yet</h3>
            <p style={{ color: p.muted, fontSize: 15 }}>Check back soon for practice exams.</p>
          </div>
        )}
      </div>

      {/* About the exams */}
      <div style={{ background: '#fff', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px' }}>
          <h2 style={{ color: p.deepTeal, fontSize: 26, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>
            About the AgilePM Foundation Exam
          </h2>
          <p style={{ color: p.muted, fontSize: 16, lineHeight: 1.7, margin: '0 0 16px' }}>
            The AgilePM Foundation exam tests your understanding of the AgilePM framework: its eight
            principles, the team roles, the products produced through a project, and the agile project
            lifecycle. It is a closed-book, multiple-choice paper based on the AgilePM Handbook, and it
            is the entry-level AgilePM qualification. Passing Foundation is the prerequisite for the
            AgilePM Practitioner exam, which tests how well you can apply the framework to a real project
            scenario.
          </p>
          <p style={{ color: p.muted, fontSize: 16, lineHeight: 1.7, margin: '0 0 16px' }}>
            Our free AgilePM3 Foundation practice papers follow the Foundation format: 50 questions to
            complete in 40 minutes, with a pass mark of 25 out of 50 (50%). They are based on the latest version
            of the AgilePM Handbook. Sit a paper as a timed mock exam to rehearse the real thing, or switch
            to revision mode and work through the questions at your own pace with answers and explanations.
          </p>

          <h2 style={{ color: p.deepTeal, fontSize: 26, fontWeight: 800, margin: '40px 0 16px', lineHeight: 1.25 }}>
            How to Prepare
          </h2>
          <ul style={{ color: p.muted, fontSize: 16, lineHeight: 1.7, margin: 0, paddingLeft: 22 }}>
            <li>Read the AgilePM Handbook and learn the eight principles, the roles, and the products.</li>
            <li>Understand the agile project lifecycle and how the phases fit together.</li>
            <li>Practise under timed conditions so the 40-minute limit feels comfortable.</li>
            <li>Use revision mode to focus on the topics you find hardest, then re-sit a full paper.</li>
          </ul>

          <h2 style={{ color: p.deepTeal, fontSize: 26, fontWeight: 800, margin: '48px 0 20px', lineHeight: 1.25 }}>
            Frequently Asked Questions
          </h2>
          <div>
            {EXAM_FAQS.map((item) => (
              <div key={item.q} style={{ borderTop: '1px solid #E5E7EB', padding: '20px 0' }}>
                <h3 style={{ color: p.deepTeal, fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4 }}>
                  {item.q}
                </h3>
                <p style={{ color: p.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .aa-exams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
      `}</style>
    </div>
  );
};

export default Exams;
