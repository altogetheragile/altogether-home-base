/**
 * Post-build SEO prerender script.
 *
 * Generates per-route HTML files with correct <head> meta tags
 * (title, description, canonical, OG, JSON-LD) injected into the
 * SPA shell. No browser needed - fetches page data from Supabase
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
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE_URL = 'https://altogetheragile.com';

// Brand TTFs embedded into generated OG images (resvg cannot read the woff2 the site ships).
const OG_FONTS = [
  resolve(__dirname, 'assets/DMSerifDisplay.ttf'),
  resolve(__dirname, 'assets/DMSans.ttf'),
];

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

/** Format a date to YYYY-MM-DD for <lastmod>; returns '' if invalid/missing. */
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
}

// Pages that are prerendered/indexable but kept OUT of the sitemap: interactive
// tool/app pages and boilerplate legal pages have no search value and would only
// dilute crawl focus. They remain reachable via internal links.
const SITEMAP_EXCLUDE = new Set([
  '/impact-map', '/personas', '/coach', '/journey-map', '/benefits', '/probes',
  '/ways-of-working', '/bmc-generator', '/canvases', '/canvases/business-case',
  '/canvases/product-vision', '/privacy', '/terms', '/cookies',
]);

/** Build a sitemap XML document from [{ loc, lastmod }] entries. */
function buildSitemap(entries) {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Build meta tag block to inject into <head>. */
function buildMetaTags({ title, description, canonical, ogType = 'website', ogImage, jsonLd }) {
  const img = ogImage || `${SITE_URL}/og-image.png`;
  let tags = '';

  // Title - replace the existing <title> tag via a marker
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
    const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    for (const block of blocks) {
      tags += `    <script type="application/ld+json">${JSON.stringify(block)}</script>\n`;
    }
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

/** Replace the static homepage shell inside #root with page-specific content so
 *  crawlers see real, unique content (React still replaces #root on hydration).
 *  No-op if the shell markup is not found, leaving the page unchanged. */
function injectBody(html, innerHtml) {
  // The built shell puts the bundle <script> in <head>, so #root closes just
  // before </body>. Anchor on that to swap the whole #root shell for our content.
  return html.replace(
    /(<div id="root">)[\s\S]*?(<\/div>\s*<\/body>)/,
    `$1${innerHtml}</div>\n  </body>`,
  );
}

/** Minimal branded header for the prerendered body (matches the shell nav). */
function prerenderHeader() {
  return (
    '<header style="background:#fff;border-bottom:1px solid #E5E7EB;height:64px;display:flex;align-items:center;padding:0 24px">' +
    '<a href="/" style="display:block"><img src="/brand/lockup-horizontal-tight.svg" alt="Altogether Agile" width="326" height="38" style="height:38px;width:auto;display:block"></a>' +
    '</header>'
  );
}

/** Visible FAQ block whose questions/answers mirror the FAQPage JSON-LD. */
function faqBodyHtml(faqs) {
  const items = faqs
    .map(
      (f) =>
        `<div style="margin:0 0 16px"><h3 style="font-size:17px;color:#004D4D;margin:0 0 4px">${escapeHtml(f.q)}</h3>` +
        `<p style="font-size:15px;line-height:1.6;color:#374151;margin:0">${escapeHtml(f.a)}</p></div>`,
    )
    .join('');
  return `<section style="margin:40px 0 0"><h2 style="font-size:24px;color:#004D4D;margin:0 0 20px">Frequently Asked Questions</h2>${items}</section>`;
}

/** Per-exam body content: title, description, facts, and a clear call to action. */
function examBodyHtml(exam) {
  const subject = examSubject(exam.title);
  const desc = exam.description || `A free practice exam for ${subject}, with answers and explanations.`;
  const facts = [
    exam.total_questions ? `${exam.total_questions} questions` : null,
    exam.duration_minutes ? `${exam.duration_minutes} minutes` : null,
    exam.pass_mark && exam.total_questions ? `pass mark ${exam.pass_mark} out of ${exam.total_questions}` : null,
  ].filter(Boolean);
  const factsHtml = facts.length
    ? `<ul style="display:flex;flex-wrap:wrap;gap:8px 24px;list-style:none;padding:0;margin:0 0 24px;color:#374151;font-size:15px">${facts
        .map((f) => `<li style="font-weight:600">${escapeHtml(f)}</li>`)
        .join('')}</ul>`
    : '';
  return (
    prerenderHeader() +
    '<main style="max-width:760px;margin:0 auto;padding:48px 24px;font-family:\'DM Sans\',system-ui,sans-serif">' +
    `<nav style="font-size:13px;color:#6B7280;margin:0 0 16px"><a href="/" style="color:#6B7280">Home</a> / <a href="/exams" style="color:#6B7280">Practice Exams</a> / ${escapeHtml(exam.title)}</nav>` +
    `<h1 style="color:#004D4D;font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-size:40px;line-height:1.2;margin:0 0 16px">${escapeHtml(exam.title)}</h1>` +
    `<p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 20px">${escapeHtml(desc)}</p>` +
    factsHtml +
    `<p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 24px">This free practice exam helps you prepare for ${escapeHtml(subject)}. Sit it as a timed mock exam, or switch to revision mode to work through the questions at your own pace, with answers and explanations for each one.</p>` +
    `<a href="/exams/${escapeHtml(exam.slug)}" style="display:inline-block;background:#004D4D;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Start the practice exam</a>` +
    '</main>'
  );
}

/** /exams hub body: intro, a linked list of every exam, and the FAQ. */
function examsListingBodyHtml(exams) {
  const items = exams
    .map((exam) => {
      const facts = [
        exam.total_questions ? `${exam.total_questions} questions` : null,
        exam.duration_minutes ? `${exam.duration_minutes} min` : null,
      ].filter(Boolean).join(' · ');
      return (
        `<li style="margin:0 0 12px"><a href="/exams/${escapeHtml(exam.slug)}" style="font-size:18px;color:#004D4D;font-weight:600;text-decoration:none">${escapeHtml(exam.title)}</a>` +
        (facts ? `<span style="color:#6B7280;font-size:14px"> — ${escapeHtml(facts)}</span>` : '') +
        '</li>'
      );
    })
    .join('');
  return (
    prerenderHeader() +
    '<main style="max-width:760px;margin:0 auto;padding:48px 24px;font-family:\'DM Sans\',system-ui,sans-serif">' +
    `<h1 style="color:#004D4D;font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-size:40px;line-height:1.2;margin:0 0 16px">Free Agile Practice Exams</h1>` +
    `<p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 28px">Free practice papers for AgilePM Foundation, AgilePM Practitioner and Professional Scrum Master. Sit a timed mock exam or revise at your own pace, with answers and explanations for every question.</p>` +
    `<ul style="list-style:none;padding:0;margin:0 0 8px">${items}</ul>` +
    faqBodyHtml(EXAM_FAQS) +
    '</main>'
  );
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
    description: 'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
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
    description: item.description || `Learn about ${item.name} - a practical agile technique.`,
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

/** Derive the qualification subject from an exam title (drops "- Paper N" / "- Sample"). */
function examSubject(title) {
  return title.replace(/\s*[-–]\s*(Paper|Sample).*$/i, '').trim() || title;
}

function examJsonLd(exam) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: exam.title,
    description: truncate(exam.description || `Practice exam: ${exam.title}.`, 300),
    url: `${SITE_URL}/exams/${exam.slug}`,
    educationalUse: 'practice',
    learningResourceType: 'Practice exam',
    isAccessibleForFree: true,
    about: { '@type': 'Thing', name: examSubject(exam.title) },
    provider: { '@type': 'Organization', name: 'Altogether Agile', url: SITE_URL },
  };
}

// ── Per-exam OG image generation ─────────────────────────────────────

/** Greedy word-wrap into at most `maxLines` lines of <= `maxChars`. */
function wrapText(text, maxChars, maxLines = 2) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const head = lines.slice(0, maxLines - 1);
    head.push(lines.slice(maxLines - 1).join(' '));
    return head;
  }
  return lines;
}

/** Branded 1200x630 social card SVG for an exam. */
function examOgSvg(exam) {
  // Break on " - " so the paper number wraps cleanly, without a dangling hyphen.
  const titleLines = wrapText(exam.title.replace(/\s-\s/g, ' '), 22, 2);
  const stats = [
    exam.total_questions ? `${exam.total_questions} questions` : null,
    exam.pass_mark && exam.total_questions ? `${Math.round((exam.pass_mark / exam.total_questions) * 100)}% to pass` : null,
    exam.duration_minutes ? `${exam.duration_minutes} min` : null,
  ].filter(Boolean).join('   ·   ');

  const titleY = titleLines.length === 1 ? 350 : 312;
  const titleSvg = titleLines
    .map((line, i) => `<text x="80" y="${titleY + i * 84}" font-family="DM Serif Display" font-size="72" fill="#FFFFFF">${escapeHtml(line)}</text>`)
    .join('');
  const statsY = titleY + (titleLines.length - 1) * 84 + 66;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#004D4D"/>
      <stop offset="1" stop-color="#007A7A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="16" height="630" fill="#FF9715"/>
  <text x="80" y="110" font-family="DM Sans" font-size="30" fill="#FFFFFF" letter-spacing="3">ALTOGETHER AGILE</text>
  <text x="80" y="225" font-family="DM Sans" font-size="26" fill="#FF9715" letter-spacing="4">FREE PRACTICE EXAM</text>
  ${titleSvg}
  <text x="80" y="${statsY}" font-family="DM Sans" font-size="30" fill="#B2DFDF">${escapeHtml(stats)}</text>
  <text x="80" y="582" font-family="DM Sans" font-size="26" fill="#D9F2F2">altogetheragile.com/exams</text>
</svg>`;
}

/** Render an exam's OG card to dist/og/exams/<slug>.png; returns the public URL or null. */
function writeExamOgImage(exam) {
  try {
    const png = new Resvg(examOgSvg(exam), {
      fitTo: { mode: 'width', value: 1200 },
      font: { fontFiles: OG_FONTS, loadSystemFonts: false, defaultFontFamily: 'DM Sans' },
    }).render().asPng();
    const dir = resolve(DIST, 'og', 'exams');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${exam.slug}.png`), png);
    return `${SITE_URL}/og/exams/${exam.slug}.png`;
  } catch (err) {
    console.warn(`  warn  OG image failed for ${exam.slug}: ${err.message}`);
    return null;
  }
}

function profilePageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: 'Alun Davies-Baker',
      jobTitle: 'Agile Coach and Trainer',
      description: 'Founder of Altogether Agile, with 25 years of hands-on agile experience as an ICF-accredited coach and accredited Scrum trainer.',
      url: `${SITE_URL}/about`,
      image: `${SITE_URL}/images/alun.webp`,
      worksFor: { '@type': 'Organization', name: 'Altogether Agile', url: SITE_URL },
    },
  };
}

function coachingServiceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Agile Coaching',
    name: 'Agile Coaching and One-to-One Coaching',
    description: 'Professional one-to-one coaching and agile team coaching using an ICF-aligned approach, drawing on 25 years of hands-on experience.',
    url: `${SITE_URL}/coaching`,
    provider: { '@type': 'Organization', name: 'Altogether Agile', url: SITE_URL },
    areaServed: ['London', 'United Kingdom'],
  };
}

function courseItemListJsonLd(templates) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Agile Training Courses and Workshops',
    itemListElement: templates.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: truncate(course.description, 300),
        url: `${SITE_URL}/courses/${course.id}`,
        provider: {
          '@type': 'Organization',
          name: 'Altogether Agile',
          url: SITE_URL,
          areaServed: ['London', 'United Kingdom'],
        },
      },
    })),
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

function faqPageJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// Mirror of EXAM_FAQS in src/pages/Exams.tsx (kept in sync so it is crawler-visible).
const EXAM_FAQS = [
  { q: 'What is the AgilePM Foundation exam?', a: 'The AgilePM Foundation exam is a closed-book, multiple-choice paper that tests your knowledge of the AgilePM framework, including its principles, roles, products, and the agile project lifecycle. It is the entry-level AgilePM qualification and the prerequisite for the AgilePM Practitioner exam.' },
  { q: 'How many questions are in the AgilePM Foundation exam?', a: 'Our AgilePM3 Foundation practice papers contain 50 questions to answer in 40 minutes, with a pass mark of 25 out of 50 (50%). They follow the multiple-choice format of the Foundation paper and are based on the latest version of the AgilePM Handbook.' },
  { q: 'Are these AgilePM practice exams free?', a: 'Yes. Every practice paper on this page is free. You can sit a timed mock exam or switch to revision mode and work through the questions at your own pace, with answers and explanations.' },
  { q: 'What is the difference between AgilePM Foundation and Practitioner?', a: 'Foundation tests whether you understand the AgilePM framework and terminology. Practitioner goes further and tests whether you can apply the framework to a realistic project scenario. You need to pass Foundation before taking Practitioner.' },
  { q: 'How should I prepare for the AgilePM Foundation exam?', a: 'Read the AgilePM Handbook, learn the roles, products, and the eight principles, then practise under timed conditions. Sitting full practice papers helps you manage the time limit and spot the topics you still need to revise.' },
  { q: 'Do you offer Scrum Master practice questions?', a: 'Yes. Our Professional Scrum Master practice exam has 40 questions to answer in 30 minutes, with a pass mark of 34 out of 40, so you can prepare for the Scrum Master assessment alongside AgilePM.' },
];

// ── Static page definitions ─────────────────────────────────────────

const STATIC_PAGES = {
  '/': {
    title: 'Altogether Agile - Agile Coaching & Training',
    description: 'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
    ogType: 'website',
    jsonLd: organizationJsonLd(),
  },
  '/events': {
    title: 'Agile Training Courses, London & UK - Altogether Agile',
    description: 'Framework-based agile training: AgilePM, Scrum Master, Product Owner and more. In person across London at your site, or live online across the UK.',
  },
  '/coaching': {
    title: 'Coaching - Altogether Agile',
    description: 'Professional one-to-one coaching and agile team coaching. ICF-aligned approach with 25 years of experience.',
  },
  '/blog': {
    title: 'Blog - Altogether Agile',
    description: 'Expert insights, practical tips, and thought leadership on agile methodologies, team dynamics, and organizational transformation.',
  },
  '/exams': {
    title: 'AgilePM & Scrum Practice Exams - Altogether Agile',
    description: 'Free AgilePM Foundation and Scrum Master practice exam questions with answers. Timed mock exams and revision mode to prepare for your agile certification.',
  },
  '/about': {
    title: 'About Alun - Altogether Agile',
    description: 'Meet Alun, founder of Altogether Agile. 25 years of agile experience, ICF-accredited coach, and accredited Scrum trainer.',
  },
  '/contact': {
    title: 'Contact - Altogether Agile',
    description: 'Get in touch with Altogether Agile for coaching, training enquiries, or to book a free chemistry session.',
  },
  '/testimonials': {
    title: 'Testimonials - Altogether Agile',
    description: 'Read what clients say about working with Altogether Agile. Real feedback from coaching and training engagements.',
  },
  '/ai-tools': {
    title: 'AI Tools - Altogether Agile',
    description: 'Free AI-powered agile tools to support your team. Business model canvas generator and more.',
  },
  '/impact-map': {
    title: 'Impact Map Builder - Altogether Agile',
    description: 'Build and export Impact Maps (Gojko Adzic): goal, actors, impacts and deliverables, with FreeMind, PNG, PDF, JSON and Markdown export.',
  },
  '/personas': {
    title: 'Persona Studio - Altogether Agile',
    description: 'Build and export a coached persona: a named character with goals, pains and behaviours, grounded in Jobs to Be Done.',
  },
  '/coach': {
    title: 'Coaching Studio - Altogether Agile',
    description: 'A standalone coaching conversation on whatever you bring. Think out loud, then harvest each goal, idea, probe or measure straight into the right tool.',
  },
  '/journey-map': {
    title: 'Journey Map Studio - Altogether Agile',
    description: 'Map a persona journey stage by stage: doing, thinking, feeling, pains and opportunities. Coached throughout, sending opportunities to your backlog.',
  },
  '/benefits': {
    title: 'Benefits Scorecard - Altogether Agile',
    description: 'Track whether the numbers actually moved: each outcome gets a leading indicator, a target, dated readings and a trend line, with a Benefits on a Page PDF.',
  },
  '/probes': {
    title: 'Probe Tracker - Altogether Agile',
    description: 'Run your options as safe-to-fail experiments. A simple kanban moves each probe from Planned to Running to Kept or Killed, with its falsifying signal.',
  },
  '/ways-of-working': {
    title: 'Ways of Working - Altogether Agile',
    description: 'Capture your team working agreements and run short coached retrospectives that produce one improvement action at a time. Export to PNG, PDF, JSON and Markdown.',
  },
  '/bmc-generator': {
    title: 'Business Model Canvas - Altogether Agile',
    description: 'Build a Business Model Canvas through a coaching conversation, in your own words, or generate a draft with AI to refine. Export to PNG and PDF.',
  },
  '/canvases': {
    title: 'Canvas Catalogue - Altogether Agile',
    description: 'Coached strategy canvases: Business Model Canvas, Business Case, and Product Vision. Fill each through a coaching conversation, then export.',
  },
  '/canvases/business-case': {
    title: 'Business Case Canvas - Altogether Agile',
    description: 'Build a coached Business Case: vision, options, costs and benefits, investment appraisal and risk.',
  },
  '/canvases/product-vision': {
    title: 'Product Vision Canvas - Altogether Agile',
    description: 'Shape product direction with a coached Product Vision canvas (after Roman Pichler): vision, target group, needs, product and business goals.',
  },
  '/privacy': {
    title: 'Privacy Policy - Altogether Agile',
    description: 'Altogether Agile privacy policy. How we collect, use, and protect your personal data.',
  },
  '/terms': {
    title: 'Terms & Conditions - Altogether Agile',
    description: 'Terms and conditions for using Altogether Agile services, courses, and website.',
  },
  '/cookies': {
    title: 'Cookie Policy - Altogether Agile',
    description: 'How Altogether Agile uses cookies and similar technologies.',
  },
  '/courses': {
    title: 'Self-paced Courses - Altogether Agile',
    description: 'Browse self-paced agile courses from Altogether Agile: learn AgilePM, Scrum and more at your own pace, with practical, framework-based material.',
  },
};

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('\nSupabase env vars not set - skipping prerender\n');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the base HTML shell
  const baseHtml = readFileSync(resolve(DIST, 'index.html'), 'utf-8');

  // Fetch all dynamic content in parallel
  const [postsRes, examsRes, templatesRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug, title, seo_title, seo_description, featured_image_url, published_at, updated_at')
      .eq('is_published', true),
    supabase
      .from('exams')
      .select('slug, title, description, seo_title, seo_description, updated_at, total_questions, pass_mark, duration_minutes')
      .eq('status', 'published'),
    supabase
      .from('event_templates')
      .select('id, title, description, seo_title, seo_description, created_at')
      .eq('is_published', true),
  ]);

  const posts = postsRes.data || [];
  const exams = examsRes.data || [];
  const templates = templatesRes.data || [];

  let succeeded = 0;

  // Per-route structured data that depends on runtime data or multiple blocks
  const dynamicJsonLd = {
    '/about': [
      profilePageJsonLd(),
      breadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'About', url: `${SITE_URL}/about` },
      ]),
    ],
    '/events': [
      courseItemListJsonLd(templates),
      breadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Courses and Workshops', url: `${SITE_URL}/events` },
      ]),
    ],
    '/coaching': [
      coachingServiceJsonLd(),
      breadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Coaching', url: `${SITE_URL}/coaching` },
      ]),
    ],
    '/exams': [
      faqPageJsonLd(EXAM_FAQS),
      breadcrumbJsonLd([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Practice Exams', url: `${SITE_URL}/exams` },
      ]),
    ],
  };

  // 1. Static pages
  for (const [route, meta] of Object.entries(STATIC_PAGES)) {
    const tags = buildMetaTags({
      title: meta.title,
      description: meta.description,
      canonical: `${SITE_URL}${route === '/' ? '' : route}`,
      ogType: meta.ogType,
      jsonLd: dynamicJsonLd[route] || meta.jsonLd,
    });
    let html = injectMeta(baseHtml, tags);
    if (route === '/exams') html = injectBody(html, examsListingBodyHtml(exams));
    writeHtml(route, html);
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 2. Blog posts
  for (const post of posts) {
    const route = `/blog/${post.slug}`;
    const title = `${post.seo_title || post.title || 'Blog'} - Altogether Agile`;
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

  // 3. Exams
  for (const exam of exams) {
    const route = `/exams/${exam.slug}`;
    const title = `${exam.seo_title || exam.title} - Altogether Agile`;
    const description = truncate(exam.seo_description || exam.description || `Practice exam: ${exam.title}. Free mock exam questions with answers.`);
    const ogImage = writeExamOgImage(exam);
    const tags = buildMetaTags({
      title,
      description,
      canonical: `${SITE_URL}${route}`,
      ogImage,
      jsonLd: [
        examJsonLd(exam),
        breadcrumbJsonLd([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'Practice Exams', url: `${SITE_URL}/exams` },
          { name: exam.title, url: `${SITE_URL}${route}` },
        ]),
      ],
    });
    writeHtml(route, injectBody(injectMeta(baseHtml, tags), examBodyHtml(exam)));
    console.log(`  ok   ${route}`);
    succeeded++;
  }

  // 5. Course templates
  for (const course of templates) {
    const route = `/courses/${course.id}`;
    const title = `${course.seo_title || course.title} - Altogether Agile`;
    const description = truncate(course.seo_description || course.description || `Agile course: ${course.title}`);
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

  // 6. Sitemap — generated from the same data so new exams/courses/posts auto-appear
  const sitemapEntries = [
    ...Object.keys(STATIC_PAGES)
      .filter((route) => !SITEMAP_EXCLUDE.has(route))
      .map((route) => ({
        loc: `${SITE_URL}${route === '/' ? '/' : route}`,
        lastmod: '',
      })),
    ...posts.map((post) => ({
      loc: `${SITE_URL}/blog/${post.slug}`,
      lastmod: fmtDate(post.updated_at || post.published_at),
    })),
    ...exams.map((exam) => ({
      loc: `${SITE_URL}/exams/${exam.slug}`,
      lastmod: fmtDate(exam.updated_at),
    })),
    ...templates.map((course) => ({
      loc: `${SITE_URL}/courses/${course.id}`,
      lastmod: fmtDate(course.created_at),
    })),
  ];
  writeFileSync(resolve(DIST, 'sitemap.xml'), buildSitemap(sitemapEntries), 'utf-8');
  console.log(`  ok   /sitemap.xml (${sitemapEntries.length} urls)`);

  console.log(`\nPrerendered meta tags for ${succeeded} pages\n`);
}

main().catch(err => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
