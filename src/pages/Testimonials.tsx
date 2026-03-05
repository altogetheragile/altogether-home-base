import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TestimonialCard from '@/components/feedback/TestimonialCard';
import { useCourseFeedback, useFeedbackStats } from '@/hooks/useCourseFeedback';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const p = {
  deepTeal: '#004D4D',
  midTeal: '#007A7A',
  lightTeal: '#D9F2F2',
  paleTeal: '#F0FAFA',
  orange: '#FF9715',
  text: '#374151',
  textLight: '#B2DFDF',
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-hamburger { display: none; }
    .aa-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    @media (max-width: 1023px) { .aa-testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 767px) {
      .aa-hamburger { display: block !important; }
      .aa-nav-links { display: none; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
      .aa-section-pad { padding: 40px 20px; }
      .aa-testimonials-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

const LogoFull = ({ height = 48, light = false }: { height?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
    <span style={{ color: light ? '#fff' : p.deepTeal, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Altogether</span>
    <span style={{ color: p.orange, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Agile</span>
  </div>
);

const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Knowledge Base', to: '/knowledge' },
  { label: 'Coaching', to: '/coaching' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const Testimonials: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const { user } = useAuth();

  const { data: feedback, isLoading } = useCourseFeedback({ isApproved: true });
  const { data: stats } = useFeedbackStats();
  const { settings } = useSiteSettings();
  const showName = settings?.show_testimonial_name ?? true;
  const firstNameOnly = settings?.show_testimonial_first_name_only ?? false;
  const showCompany = settings?.show_testimonial_company ?? true;

  const uniqueCourses = useMemo(() => {
    if (!feedback) return [];
    return [...new Set(feedback.map((f) => f.course_name))].sort();
  }, [feedback]);

  const filteredFeedback = feedback?.filter((f) => {
    const matchesSearch =
      f.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || f.course_name === courseFilter;
    const matchesRating = ratingFilter === 'all' || f.rating >= parseInt(ratingFilter);
    return matchesSearch && matchesCourse && matchesRating;
  }) || [];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF' }}>
      <Helmet>
        <title>Testimonials — Altogether Agile</title>
        <meta name="description" content="Read what professionals say about Altogether Agile's courses, coaching, and training programmes." />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <nav style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, padding: isMobile ? '0 20px' : '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/"><LogoFull height={38} /></Link>
        <div className="aa-nav-links" style={{ gap: 32 }}>
          {NAV_LINKS.map((item) => (
            <Link key={item.label} to={item.to} style={{ color: p.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>{item.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <Link to="/dashboard" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <Link to="/auth" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Sign In</Link>
          )}
          <button className="aa-hamburger" onClick={() => setMenuOpen((v) => !v)} style={{ background: 'none', border: 'none', color: p.deepTeal, fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, position: 'sticky', top: 64, zIndex: 99 }}>
          {NAV_LINKS.map((item, i) => (
            <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 20px', color: p.text, fontSize: 15, fontWeight: 500, textDecoration: 'none', borderBottom: i < NAV_LINKS.length - 1 ? `1px solid ${p.lightTeal}` : 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ─── HERO ─── */}
      <div className="aa-section-pad" style={{ background: p.paleTeal, textAlign: 'center' }}>
        <h1 style={{ color: p.deepTeal, fontWeight: 800, fontSize: isMobile ? 34 : 44, lineHeight: 1.15, margin: '0 0 16px' }}>What Our Attendees Say</h1>
        <p style={{ color: p.text, fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          Real feedback from professionals who have attended our courses and coaching programmes.
        </p>
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <svg width="20" height="20" viewBox="0 0 256 256" fill={p.orange}>
              <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z"/>
            </svg>
            <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 20 }}>{stats.averageRating}/10</span>
            <span style={{ color: p.text, fontSize: 14 }}>from {stats.totalRatings} reviews</span>
          </div>
        )}
      </div>

      {/* ─── FILTERS ─── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${p.lightTeal}`, padding: isMobile ? '16px 20px' : '16px 48px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 800 }}>
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 260, flex: '1 1 200px' }}
          />
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger style={{ width: 200 }}>
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map((course) => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger style={{ width: 160 }}>
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="9">9+ Stars</SelectItem>
              <SelectItem value="8">8+ Stars</SelectItem>
              <SelectItem value="7">7+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── TESTIMONIALS GRID ─── */}
      <div className="aa-section-pad" style={{ background: '#fff' }}>
        {isLoading ? (
          <div className="aa-testimonials-grid">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} style={{ height: 320, borderRadius: 12 }} />
            ))}
          </div>
        ) : filteredFeedback.length > 0 ? (
          <div className="aa-testimonials-grid">
            {filteredFeedback.map((item) => (
              <TestimonialCard key={item.id} feedback={item} showName={showName} firstNameOnly={firstNameOnly} showCompany={showCompany} showRating />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: p.text }}>
            No testimonials found matching your filters.
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: p.deepTeal, padding: '48px 20px 32px' }}>
        <div className="aa-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><LogoFull height={40} light /></div>
            <div style={{ color: p.textLight, fontSize: 14, lineHeight: 1.75, maxWidth: 300 }}>
              Agile training, coaching and facilitation — grounded in 25 years of real experience. Based in London, working everywhere.
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</div>
            {[
              { label: 'Events', to: '/events' },
              { label: 'Knowledge Base', to: '/knowledge' },
              { label: 'Coaching', to: '/coaching' },
              { label: 'About', to: '/about' },
              { label: 'Contact', to: '/contact' },
            ].map((link) => (
              <Link key={link.label} to={link.to} style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>{link.label}</Link>
            ))}
            <Link to="/testimonials" style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>Testimonials</Link>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get in Touch</div>
            <div style={{ color: p.textLight, fontSize: 13, marginBottom: 8 }}>info@altogetheragile.com</div>
            <div style={{ color: p.textLight, fontSize: 13 }}>London, England</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, color: p.textLight, fontSize: 12, textAlign: 'center' }}>
          &copy; 2026 Altogether Agile. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
