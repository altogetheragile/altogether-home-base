import type { Metadata } from 'next';
import { getAllApprovedFeedback, feedbackStats } from '@/lib/testimonials';
import { getSiteSettings } from '@/lib/site-settings';
import { buildMetadata, JsonLd, breadcrumbJsonLd , siteName } from '@/lib/seo';
import { TestimonialsGrid } from './TestimonialsGrid';
import { colors as p } from '@/lib/brand';
import { requireModule } from '@/lib/module-gate';
import { getCopy } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getCopy('testimonials');
  return {
  ...(await buildMetadata({
    title: `${t('testimonials.meta.titlePrefix')} - ${await siteName()}`,
    description: t('testimonials.meta.description'),
    path: '/testimonials',
  })),
  title: { absolute: `${t('testimonials.meta.titlePrefix')} - ${await siteName()}` },
  };
}

export default async function TestimonialsPage() {
  await requireModule('testimonials');
  const [feedback, settings, t] = await Promise.all([getAllApprovedFeedback(), getSiteSettings(), getCopy('testimonials')]);
  const stats = feedbackStats(feedback);
  const showName = settings.show_testimonial_name ?? true;
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;
  const showCompany = settings.show_testimonial_company ?? true;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('testimonials', '/testimonials', 'Testimonials'))} />

      {/* HERO */}
      <div id="main-content" style={{ background: p.paleTeal, padding: '56px 24px', textAlign: 'center' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>{t('testimonials.hero.heading')}</h1>
        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 600 }}>{t('testimonials.hero.intro')}</p>
        {stats && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, color: p.deepTeal }}>
            <svg width={20} height={20} viewBox="0 0 256 256" style={{ fill: p.orange }}><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z" /></svg>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{stats.averageRating}/10</span>
            <span style={{ color: p.muted, fontSize: 14 }}>from {stats.totalRatings} {t('testimonials.hero.reviewsSuffix')}</span>
          </div>
        )}
      </div>

      <TestimonialsGrid feedback={feedback} showName={showName} firstNameOnly={firstNameOnly} showCompany={showCompany} />
    </div>
  );
}
