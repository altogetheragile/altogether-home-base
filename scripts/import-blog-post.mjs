#!/usr/bin/env node

/**
 * Import a markdown blog post into Supabase.
 *
 * Usage:
 *   node scripts/import-blog-post.mjs path/to/post.md [--publish]
 *
 * The markdown file should have YAML frontmatter like:
 *
 *   ---
 *   title: "My Post Title"
 *   slug: /blog/my-post-slug          # or just: my-post-slug
 *   meta_title: "SEO title"
 *   meta_description: "SEO description"
 *   keywords: keyword1, keyword2
 *   author: Alun Davies-Baker
 *   date: 2026-03-23
 *   og_image: diagram.png             # relative to the markdown file
 *   estimated_reading_time: 10        # optional, auto-calculated if omitted
 *   ---
 *
 * Images referenced as ![alt](filename.png) will be uploaded to Supabase
 * storage and their URLs replaced in the HTML output.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (or .env.local).
 * Get it from: Supabase Dashboard → Settings → API → service_role key
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { marked } from 'marked';

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

function loadEnv() {
  const envVars = {};
  for (const file of ['.env', '.env.local']) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf-8').split('\n')) {
      const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?\s*$/);
      if (match) envVars[match[1]] = match[2];
    }
  }
  return envVars;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'assets';
const BLOG_IMAGE_PATH = 'blog';

// ─── Styled HTML wrapper ─────────────────────────────────────────────────────

const POST_STYLES = `<style>
.post-body { max-width: 680px; font-size: 18px; line-height: 1.7; }
.post-body p { margin: 0 0 1.4rem; }
.post-body h2 { font-size: 24px; font-weight: 600; margin: 2.5rem 0 1rem; line-height: 1.3; }
.post-body h3 { font-size: 19px; font-weight: 600; margin: 2rem 0 .75rem; line-height: 1.35; }
.post-body a { color: inherit; text-decoration: underline; text-decoration-color: rgba(0,0,0,0.3); }
.post-body a:hover { text-decoration-color: inherit; }
.post-body em { font-style: italic; }
.post-body strong { font-weight: 600; }
.post-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 2.5rem 0; }
.post-body .byline { font-size: 15px; opacity: 0.6; margin-bottom: 2rem; }
.post-body .bio { font-size: 15px; opacity: 0.65; margin-top: 2.5rem; }
.post-body figure { margin: 2rem 0; }
.post-body figure img { max-width: 100%; height: auto; border-radius: 8px; }
.post-body figcaption { font-size: 14px; color: rgba(0,0,0,0.5); margin-top: 0.5rem; line-height: 1.5; font-style: italic; }
.post-body .references { font-size: 15px; line-height: 1.6; }
.post-body .references p { margin: 0 0 0.75rem; }
.post-body .references a { word-break: break-word; }
.post-body .callout {
  background: #f5fdf9;
  border-left: 3px solid #1D9E75;
  border-radius: 0 8px 8px 0;
  padding: 1rem 1.25rem;
  margin: 1.75rem 0;
  font-size: 17px;
  line-height: 1.65;
}
.post-body .tip-box {
  background: #f8f9fa;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin: 1.75rem 0;
  font-size: 17px;
  line-height: 1.65;
}
.post-body .tip-box p { margin: 0 0 0.75rem; }
.post-body .tip-box p:last-child { margin: 0; }
@media (prefers-color-scheme: dark) {
  .post-body a { text-decoration-color: rgba(255,255,255,0.3); }
  .post-body figcaption { color: rgba(255,255,255,0.5); }
  .callout { background: #0d2e24; border-left-color: #1D9E75; }
  .tip-box { background: #1a1a1a; border-color: rgba(255,255,255,0.08); }
}
</style>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateReadingTime(text) {
  const words = text.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function normalizeSlug(slug) {
  if (!slug) return '';
  return slug.replace(/^\/blog\//, '').replace(/^\//, '').replace(/\/$/, '');
}

function isLocalImage(src) {
  return src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:');
}

// ─── Convert footnotes [^N] to superscript <sup>N</sup> ─────────────────────

function convertFootnotes(markdown) {
  // Replace inline footnote refs [^N] with <sup>N</sup>
  let result = markdown.replace(/\[\^(\d+)\]/g, '<sup>$1</sup>');

  // Convert footnote definitions [^N]: text → numbered reference paragraphs
  // Collect them into a references section
  const footnoteRegex = /^\[\^(\d+)\]:\s*(.+)$/gm;
  const footnotes = [];
  let match;
  while ((match = footnoteRegex.exec(markdown)) !== null) {
    footnotes.push({ num: match[1], text: match[2] });
  }

  // Remove footnote definition lines from the content
  result = result.replace(/^\[\^(\d+)\]:\s*(.+)$/gm, '');

  // If there are footnotes, they'll be handled by the references section in the markdown
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const publish = args.includes('--publish');
  const filePath = args.find(a => !a.startsWith('--'));

  if (!filePath) {
    console.error('Usage: node scripts/import-blog-post.mjs <path-to-markdown> [--publish]');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('');
    console.error('  Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('');
    console.error('  Get it from: Supabase Dashboard → Settings → API → service_role key');
    console.error('  Then add to your .env file:');
    console.error('');
    console.error('    SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    console.error('');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const fileDir = dirname(absPath);
  const raw = readFileSync(absPath, 'utf-8');
  const { data: fm, content: mdContent } = matter(raw);

  console.log(`\n  Importing: ${fm.title || basename(absPath)}`);
  console.log(`  Slug:      ${normalizeSlug(fm.slug)}`);
  console.log(`  Status:    ${publish ? 'published' : 'draft'}`);
  console.log('');

  // ── Connect to Supabase with service role key (bypasses RLS) ──
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── Find and upload local images ──
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const localImages = new Map(); // filename → public URL
  let imgMatch;

  while ((imgMatch = imageRegex.exec(mdContent)) !== null) {
    const imgSrc = imgMatch[2];
    if (isLocalImage(imgSrc) && !localImages.has(imgSrc)) {
      const imgPath = resolve(fileDir, imgSrc);
      if (!existsSync(imgPath)) {
        console.warn(`  ⚠ Image not found: ${imgSrc} (looked at ${imgPath})`);
        continue;
      }

      const imgBuffer = readFileSync(imgPath);
      const ext = extname(imgSrc).toLowerCase();
      const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      const storagePath = `${BLOG_IMAGE_PATH}/${Date.now()}-${basename(imgSrc)}`;

      console.log(`  Uploading: ${imgSrc} → ${storagePath}`);

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, imgBuffer, { contentType, upsert: true });

      if (uploadErr) {
        console.error(`  ✗ Upload failed for ${imgSrc}: ${uploadErr.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      localImages.set(imgSrc, publicUrl);
      console.log(`  ✓ Uploaded: ${publicUrl}`);
    }
  }

  // Also upload og_image if it's a local file
  let ogImageUrl = null;
  if (fm.og_image && isLocalImage(fm.og_image)) {
    const ogPath = resolve(fileDir, fm.og_image);
    if (existsSync(ogPath)) {
      const ogBuffer = readFileSync(ogPath);
      const ext = extname(fm.og_image).toLowerCase();
      const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
      const storagePath = `${BLOG_IMAGE_PATH}/${Date.now()}-${basename(fm.og_image)}`;

      console.log(`  Uploading OG image: ${fm.og_image}`);

      const { error: ogErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, ogBuffer, { contentType: mimeMap[ext] || 'image/png', upsert: true });

      if (!ogErr) {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);
        ogImageUrl = publicUrl;
        console.log(`  ✓ OG image: ${publicUrl}`);
      }
    }
  }

  // ── Convert markdown to HTML ──
  let processedMd = convertFootnotes(mdContent);

  // Replace local image paths with uploaded URLs
  for (const [localPath, publicUrl] of localImages) {
    // Replace in markdown image syntax
    const escaped = localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processedMd = processedMd.replace(new RegExp(escaped, 'g'), publicUrl);
  }

  // Configure marked for clean HTML
  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  // Custom renderer for images → <figure> with <figcaption>
  const renderer = new marked.Renderer();
  renderer.image = function ({ href, title, text }) {
    const alt = text ? ` alt="${text}"` : '';
    const titleAttr = title ? ` title="${title}"` : '';
    // If the next line after the image is italic text (*caption*), it becomes figcaption
    // For now, use alt text as figcaption if it exists
    if (text) {
      return `<figure>\n  <img src="${href}"${alt}${titleAttr} />\n  <figcaption>${text}</figcaption>\n</figure>`;
    }
    return `<img src="${href}"${alt}${titleAttr} />`;
  };

  let htmlBody = marked.parse(processedMd, { renderer });

  // Handle image + italic caption pattern: <img .../>\n<em>caption</em> → <figure>
  htmlBody = htmlBody.replace(
    /<figure>\s*<img ([^>]+)\/>\s*<figcaption>([^<]+)<\/figcaption>\s*<\/figure>\s*<p><em>([^<]+)<\/em><\/p>/g,
    '<figure>\n  <img $1/>\n  <figcaption>$3</figcaption>\n</figure>'
  );

  // Also handle: <p><img .../></p>\n<p><em>caption</em></p> → <figure>
  htmlBody = htmlBody.replace(
    /<p><img\s+([^>]+)\/?\s*><\/p>\s*<p><em>([^<]+)<\/em><\/p>/g,
    '<figure>\n  <img $1/>\n  <figcaption>$2</figcaption>\n</figure>'
  );

  // Convert ## References section footnotes to styled div
  htmlBody = htmlBody.replace(
    /(<h2[^>]*>References<\/h2>)([\s\S]*?)(?=<hr|$)/,
    (_, heading, body) => `${heading}\n<div class="references">${body}</div>`
  );

  // Add byline at the top
  const author = fm.author || 'Alun Davies-Baker';
  const byline = `<p class="byline">By ${author}, AltogetherAgile</p>`;

  // Wrap in post-body div with styles
  const fullHtml = `${POST_STYLES}\n\n<div class="post-body">\n\n${byline}\n\n${htmlBody}\n\n</div>`;

  // ── Calculate reading time ──
  const readingTime = fm.estimated_reading_time || estimateReadingTime(mdContent);

  // ── Parse keywords ──
  let keywords = null;
  if (fm.keywords) {
    keywords = typeof fm.keywords === 'string'
      ? fm.keywords.split(',').map(k => k.trim())
      : fm.keywords;
  }

  // ── Build the excerpt ──
  // Use frontmatter excerpt, or meta_description, or first paragraph
  const excerpt = fm.excerpt || fm.meta_description ||
    mdContent.split('\n\n').find(p => p && !p.startsWith('#') && !p.startsWith('---') && !p.startsWith('*'))?.slice(0, 300);

  // ── Insert blog post ──
  const slug = normalizeSlug(fm.slug);
  const now = new Date().toISOString();

  const postData = {
    title: fm.title,
    slug,
    content: fullHtml,
    excerpt: excerpt || '',
    seo_title: fm.meta_title || fm.seo_title || fm.title,
    seo_description: fm.meta_description || fm.seo_description || excerpt || '',
    seo_keywords: keywords,
    featured_image_url: ogImageUrl || '',
    estimated_reading_time: readingTime,
    is_published: publish,
    is_featured: false,
    published_at: publish ? now : null,
    created_at: now,
    updated_at: now,
  };

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id, title')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    console.log(`  Post with slug "${slug}" already exists (id: ${existing.id})`);
    console.log(`  Updating existing post...`);

    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update({
        ...postData,
        created_at: undefined, // Don't overwrite original created_at
      })
      .eq('id', existing.id);

    if (updateErr) {
      console.error(`  ✗ Update failed: ${updateErr.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Updated: ${existing.id}`);
  } else {
    const { data: newPost, error: insertErr } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select('id')
      .single();

    if (insertErr) {
      console.error(`  ✗ Insert failed: ${insertErr.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Created: ${newPost.id}`);
  }

  console.log('');
  console.log(`  ✓ Done! Post "${fm.title}" is ${publish ? 'published' : 'saved as draft'}.`);
  console.log(`  View: https://www.altogetheragile.com/blog/${slug}`);
  console.log(`  Admin: https://www.altogetheragile.com/admin/blog`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
