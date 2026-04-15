import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CoursePlayer from '@/components/CoursePlayer';

const CoursePage = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <Navigation />
        <div style={{ textAlign: 'center', padding: '64px 20px', color: '#6B7280' }}>
          Course not found.
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Helmet>
        <title>Self-paced Course | Altogether Agile</title>
        <link rel="canonical" href={`${SITE_URL}/events/learn/${slug}`} />
      </Helmet>
      <Navigation />
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px' }}>
        <CoursePlayer courseSlug={slug} />
      </div>
      <Footer />
    </div>
  );
};

export default CoursePage;
