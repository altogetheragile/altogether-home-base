import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';
import { useIsMobile } from '@/hooks/use-mobile';

interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  lesson_count: number;
}

const Courses = () => {
  const isMobile = useIsMobile();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, slug, title, description');

      if (!data) {
        setLoading(false);
        return;
      }

      // Get lesson counts per course
      const courseIds = data.map(c => c.id);
      const { data: modules } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      const moduleIds = (modules || []).map(m => m.id);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds);

      const moduleToCourseLookup: Record<string, string> = {};
      (modules || []).forEach(m => { moduleToCourseLookup[m.id] = m.course_id; });

      const countByCourse: Record<string, number> = {};
      (lessons || []).forEach(l => {
        const cid = moduleToCourseLookup[l.module_id];
        if (cid) countByCourse[cid] = (countByCourse[cid] || 0) + 1;
      });

      setCourses(data.map(c => ({
        ...c,
        lesson_count: countByCourse[c.id] || 0,
      })));
      setLoading(false);
    };

    fetch();
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fff' }}>
      <Helmet>
        <title>Self-paced Courses | Altogether Agile</title>
        <meta name="description" content="Browse self-paced agile courses from Altogether Agile." />
        <link rel="canonical" href={`${SITE_URL}/courses`} />
      </Helmet>
      <Navigation />

      <div style={{ background: p.paleTeal, textAlign: 'center', padding: isMobile ? '40px 20px' : '64px 48px' }}>
        <h1 style={{ color: p.deepTeal, fontWeight: 800, fontSize: isMobile ? 34 : 44, lineHeight: 1.15, margin: '0 0 16px' }}>
          Self-paced Courses
        </h1>
        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          Learn at your own pace with our structured, self-guided courses.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6B7280', padding: 48 }}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6B7280', padding: 48 }}>No courses available yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {courses.map(c => (
              <Link
                key={c.id}
                to={`/courses/${c.slug}`}
                style={{
                  display: 'block',
                  padding: 24,
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <h2 style={{ color: p.deepTeal, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{c.title}</h2>
                {c.description && (
                  <p style={{ color: p.body, fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>{c.description}</p>
                )}
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: p.muted }}>
                  <span>{c.lesson_count} lesson{c.lesson_count !== 1 ? 's' : ''}</span>
                  <span>Self-paced</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Courses;
