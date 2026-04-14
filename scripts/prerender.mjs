/**
 * Post-build SEO prerender script.
 *
 * Generates per-route HTML files with correct <head> meta tags
 * (title, description, canonical, OG, JSON-LD) injected into the
 * SPA shell. No browser needed — fetches page data from Supabase
 * and does string templating.
 *
 * For routes where Playwright is available (local dev), falls back
 * to full browser rendering for richer output.
 *
 * Usage:  node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE_URL = 'https://altogetheragile.com';

// Load .env for local builds (Vercel sets env vars via dashboard)
const envPath = resolve(ROOT, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^(\w+)=["']?(.+?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(str, len = 160) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

/** Build meta tag block to inject into <head>. */
function buildMetaTags({ title, description, canonical, ogType = 'website', ogImage, jsonLd }) {
  const img = ogImage || `${SITE_URL}/og-image.png`;
  let tags = '';

  // Title — replace the existing <title> tag via a marker
  tags += `<title>${escapeHtml(title)}</title>\n`;
  tags += `    <meta name="description" content="${escapeHtml(description)}" />\n`;
  tags += `    <link rel="canonical" href="${canonical}" />\n`;
  tags += `    <meta property="og:title" content="${escapeHtml(title)}" />\n`;
  tags += `    <meta property="og:description" content="${escapeHtml(description)}" />\n`;
  tags += `    <meta property="og:type" content="${ogType}" />\n`;
  tags += `    <meta property="og:image" content="${img}" />\n`;
  tags += `    <meta property="og:url" content="${canonical}" />\n`;
  tags += `    <meta name="twitter:card" content="summary_large_image" />\n`;
  tags += `    <meta name="twitter:title" content="${escapeHtml(title)}" />\n`;
  tags += `    <meta name="twitter:description" content="${escapeHtml(description)}" />\n`;
  tags += `    <meta name="twitter:image" content="${img}" />\n`;

  if (jsonLd) {
    tags += `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`;
  }

  tags += `    <meta name="prerender-status" content="prerendered" />\n`;

  return tags;
}

/** Inject meta tags into the base HTML shell. */
function injectMeta(baseHtml, metaTags) {
  let html = baseHtml;

  // Remove existing title, description, og:*, twitter:*, canonical from the shell
  html = html.replace(/<title>[^<]*<\/title>\s*/g, '');
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/g, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/g, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/g, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/g, '');

  // Inject new meta tags after <meta charset>
  html = html.replace(
    /(<meta\s+charset="UTF-8"\s*\/>)/,
    `$1\n    ${metaTags}`
  );

  return html;
}

/** Write HTML to dist/<route>/index.html. */
function writeHtml(route, html) {
  if (route === '/') {
    writeFileSync(resolve(DIST, 'index.html'), html, 'utf-8');
    return;
  }
  const segments = route.replace(/^\//, '').split('/');
  const dir = resolve(DIST, ...segments);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf-8');
}

// ── JSON-LD builders ────────────────────────────────────────────────

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Altogether Agile',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description: 'Certified agile courses, practical coaching, and 80+ techniques for teams who want real results.',
    founder: {
      '@type': 'Person',
      name: 'Alun Davies-Baker',
      jobTitle: 'Agile Coach & Trainer',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@altogetheragile.com',
      contactType: 'customer service',
    },
  };
}

function blogPostJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo_title || post.title,
    description: post.seo_description || '',
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    image: post.featured_image_url || `${SITE_URL}/og-image.png`,
    author: { '@type': 'Person', name: 'Alun Davies-Baker' },
    publisher: {
      '@type': 'Organization',
      name: 'Altogether Agile',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
    },
  };
}

function techniqueJsonLd(item) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: item.name,
    description: item.description || `Learn about ${item.name} — a practical agile technique.`,
    url: `${SITE_URL}/knowledge/${item.slug}`,
    author: { '@type': 'Organization', name: 'Altogether Agile' },
  };
}

function courseJsonLd(course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: truncate(course.description, 300),
    url: `${SITE_URL}/courses/${course.id}`,
    provider: { '@type': 'Organization', name: 'Altogether Agile', url: SITE_URL },
  };
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── Static page definitions ─────────────────────────────────────────

const STATIC_PAGES = {
  '/': {
    title: 'Altogether Agile — Agile Coaching & Training',
    description: 'Certified agile courses, practical coaching, and 80+ techniques for teams who want real results. 25 years of hands-on experience.',
    ogType: 'website',
    jsonLd: organizationJsonLd(),
  },
  '/events': {
    title: 'Courses, Workshops & Masterclasses — Altogether Agile',
    description: 'Browse upcoming agile courses, workshops, and masterclasses. Certified training delivered by an experienced agile coach and trainer.',
  },
  '/knowledge': {
    title: 'Knowledge Base — Altogether Agile',
    description: 'Explore 80+ practical agile techniques, frameworks, and tools. A comprehensive knowledge base for agile practitioners.',
  },
  '/coaching': {
    title: 'Coaching — Altogether Agile',
    description: 'Professional one-to-one coaching and agile team coaching. ICF-aligned approach with 25 years of experience.',
  },
  '/blog': {
    title: 'Blog — Altogether Agile',
    description: 'Expert insights, practical tips, and thought leadership on agile methodologies, team dynamics, and organizational transformation.',
  },
  '/exams': {
    title: 'AgilePM & Scrum Practice Exam Questions — Altogether Agile',
    description: 'Free AgilePM Foundation and Scrum Master practice exam questions with answers. Timed mock exams and revision mode to prepare for your agile certification.',
  },
  '/about': {
    title: 'About Alun — Altogether Agile',
    description: 'Meet Alun, founder of Altogether Agile. 25 years of agile experience, ICF-accredited coach, and certified Scrum trainer.',
  },
  '/contact': {
    title: 'Contact — Altogether Agile',
    description: 'Get in touch with Altogether Agile for coaching, training enquiries, or to book a free chemistry session.',
  },
  '/testimonials': {
    title: 'Testimonials — Altogether Agile',
    description: 'Read what clients say about working with Altogether Agile. Real feedback from coaching and training engagements.',
  },
  '/ai-tools': {
    title: 'AI Tools — Altogether Agile',
    description: 'Free AI-powered agile tools to support your team. Business model canvas generator and more.',
  },
  '/privacy': {
    title: 'Privacy Policy — Altogether Agile',
    description: 'Altogether Agile privacy policy. How we collect, use, and protect your personal data.',
  },
  '/terms': {
    title: 'Terms & Conditions — Altogether Agile',
    description: 'Terms and conditions for using Altogether Agile services, courses, and website.',
  },
  '/cookies': {
    title: 'Cookie Policy — Altogether Agile',
    description: 'How Altogether Agile uses cookies and similar technologies.',
  },
  '/courses': {
    title: 'Self-paced Courses — Altogether Agile',
    description: 'Browse self-paced agile courses from Altogether Agile.',
  },
};

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('\nSupabase env vars not set — skipping prerender\n');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the base HTML shell
  const baseHtml = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

  // Fetch all dynamic content in parallel
  const [postsRes, techniquesRes, examsRes, templatesRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug, title, seo_title, seo_description, featured_image_url, published_at, updated_at')
      .eq('is_published', true),
    supabase
      .from('knowledge_items')
      .select('slug, name, description')
      .eq('is_published', true),
    supabase
      .from('exams')
      .select('slug, title, description')
      .eq('status', 'published'),
    supabase
      .from('event_templates')
      .select('id, title, description')
      .eq('is_published', true),
  ]);

  const posts = postsRes.data || [];
  const techniques = techniquesRes.data || [];
  const exams = examsRes.data || [];
  const templates = templatesRes.data || [];

  let succeeded = 0;

  // 1. Static pages
  for (const [route, meta] of Object.entries(STATIC_PAGES)) {
    const tags = buildMetaTags({
      title: meta.title,
      description: meta.description,
      canonical: `${SITE_URL}${route === '/' ? '' : route}`,
      ogType: meta.ogType,
      jsonLd: meta.jsonLd,
    });
    writeHtml(route, injectMeta(baseHtml, tags));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 2. Blog posts
  for (const post of posts) {
    const route = `/blog/${post.slug}`;
    const title = `${post.seo_title || post.title || 'Blog'} — Altogether Agile`;
    const description = post.seo_description || truncate(post.title || '', 160);
    const tags = buildMetaTags({
      title,
      description,
      canonical: `${SITE_URL}${route}`,
      ogType: 'article',
      ogImage: post.featured_image_url,
      jsonLd: blogPostJsonLd(post),
    });
    writeHtml(route, injectMeta(baseHtml, tags));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 3. Knowledge items
  for (const item of techniques) {
    const route = `/knowledge/${item.slug}`;
    const title = `${item.name} — Altogether Agile Knowledge Base`;
    const description = item.description || `Learn about ${item.name} — a practical agile technique from the Altogether Agile knowledge base.`;
    const tags = buildMetaTags({
      title,
      description: truncate(description),
      canonical: `${SITE_URL}${route}`,
      ogType: 'article',
      jsonLd: techniqueJsonLd(item),
    });
    writeHtml(route, injectMeta(baseHtml, tags));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 4. Exams
  for (const exam of exams) {
    const route = `/exams/${exam.slug}`;
    const title = `${exam.title} — Altogether Agile`;
    const description = truncate(exam.description || `Practice exam: ${exam.title}. Free mock exam questions with answers.`);
    const tags = buildMetaTags({
      title,
      description,
      canonical: `${SITE_URL}${route}`,
    });
    writeHtml(route, injectMeta(baseHtml, tags));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 5. Course templates
  for (const course of templates) {
    const route = `/courses/${course.id}`;
    const title = `${course.title} — Altogether Agile`;
    const description = truncate(course.description || `Agile course: ${course.title}`);
    const tags = buildMetaTags({
      title,
      description,
      canonical: `${SITE_URL}${route}`,
      ogType: 'event',
      jsonLd: courseJsonLd(course),
    });
    writeHtml(route, injectMeta(baseHtml, tags));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  console.log(`\nPrerendered meta tags for ${succeeded} pages\n`);
}

main().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
