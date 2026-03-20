import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import { colors as p } from '@/theme/colors';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Clock, Award, HelpCircle } from 'lucide-react';

interface PublicExam {
  id: string;
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
        .select('id, title, description, duration_minutes, pass_mark, total_questions')
        .eq('status', 'published')
        .order('title');
      if (error) throw error;
      return (data || []) as PublicExam[];
    },
  });

const Exams = () => {
  const { data: exams, isLoading } = usePublishedExams();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Helmet>
        <title>Practice Exams — Altogether Agile</title>
        <meta name="description" content="Test your agile knowledge with timed practice exams and revision mode." />
        <link rel="canonical" href={`${SITE_URL}/exams`} />
      </Helmet>
      <Navigation />

      {/* Hero */}
      <div id="main-content" style={{ background: `linear-gradient(135deg, ${p.deepTeal} 0%, #006666 100%)`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: p.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Practice Exams
          </h1>
          <p style={{ color: p.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Test your knowledge with timed exam simulations or work through questions at your own pace in practice mode.
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
                    to={`/exams/${exam.id}`}
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

      <Footer />

      <style>{`
        .aa-exams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
      `}</style>
    </div>
  );
};

export default Exams;
