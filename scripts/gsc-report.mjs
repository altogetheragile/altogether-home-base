/**
 * Google Search Console report.
 * Run: node scripts/gsc-report.mjs
 *
 * Pulls indexing data, top queries, top pages, and performance trends
 * for the last 28 days. Requires gsc-token.json (run gsc-auth.mjs first).
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = resolve(__dirname, 'gsc-credentials.json');
const TOKEN_PATH = resolve(__dirname, 'gsc-token.json');
const SITE_URL = 'sc-domain:altogetheragile.com'; // domain property

// ── Auth ────────────────────────────────────────────────────────────

function getAuthClient() {
  if (!existsSync(TOKEN_PATH)) {
    console.error('No token found. Run: node scripts/gsc-auth.mjs');
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  const { client_id, client_secret } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3199');
  const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function formatPct(n) {
  return (n * 100).toFixed(1) + '%';
}

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ── Report sections ─────────────────────────────────────────────────

async function topQueries(searchconsole) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: dateNDaysAgo(28),
      endDate: dateNDaysAgo(1),
      dimensions: ['query'],
      rowLimit: 25,
      type: 'web',
    },
  });
  return res.data.rows || [];
}

async function topPages(searchconsole) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: dateNDaysAgo(28),
      endDate: dateNDaysAgo(1),
      dimensions: ['page'],
      rowLimit: 25,
      type: 'web',
    },
  });
  return res.data.rows || [];
}

async function performanceByDate(searchconsole) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: dateNDaysAgo(28),
      endDate: dateNDaysAgo(1),
      dimensions: ['date'],
      type: 'web',
    },
  });
  return res.data.rows || [];
}

async function indexStatus(searchconsole) {
  // URL inspection for a sample of key pages
  const urls = [
    'https://altogetheragile.com/',
    'https://altogetheragile.com/blog',
    'https://altogetheragile.com/events',
    'https://altogetheragile.com/knowledge',
    'https://altogetheragile.com/coaching',
    'https://altogetheragile.com/exams',
    'https://altogetheragile.com/about',
    'https://altogetheragile.com/blog/ai-adoption-strategy-200-years-old',
    'https://altogetheragile.com/blog/humans-in-the-loop-cynefin-ai-agents',
    'https://altogetheragile.com/blog/mvp-thinking-age-of-ai',
  ];

  const results = [];
  for (const url of urls) {
    try {
      const res = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: SITE_URL,
        },
      });
      const result = res.data.inspectionResult;
      results.push({
        url: url.replace('https://altogetheragile.com', ''),
        verdict: result?.indexStatusResult?.verdict || 'UNKNOWN',
        coverage: result?.indexStatusResult?.coverageState || 'N/A',
        lastCrawl: result?.indexStatusResult?.lastCrawlTime?.split('T')[0] || 'N/A',
        crawledAs: result?.indexStatusResult?.crawledAs || 'N/A',
        robotsTxt: result?.indexStatusResult?.robotsTxtState || 'N/A',
        indexing: result?.indexStatusResult?.indexingState || 'N/A',
      });
    } catch (err) {
      results.push({
        url: url.replace('https://altogetheragile.com', ''),
        verdict: `ERROR: ${err.message}`,
        coverage: 'N/A',
        lastCrawl: 'N/A',
        crawledAs: 'N/A',
        robotsTxt: 'N/A',
        indexing: 'N/A',
      });
    }
  }
  return results;
}

async function sitemapStatus(searchconsole) {
  try {
    const res = await searchconsole.sitemaps.list({ siteUrl: SITE_URL });
    return res.data.sitemap || [];
  } catch (err) {
    console.warn('  Could not fetch sitemaps:', err.message);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const auth = getAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log('\n=== Google Search Console Report: altogetheragile.com ===\n');
  console.log(`Period: ${dateNDaysAgo(28)} to ${dateNDaysAgo(1)}\n`);

  // 1. Sitemaps
  console.log('--- Sitemaps ---\n');
  const sitemaps = await sitemapStatus(webmasters);
  if (sitemaps.length === 0) {
    console.log('  No sitemaps found (or could not access)\n');
  } else {
    for (const sm of sitemaps) {
      console.log(`  ${sm.path}`);
      console.log(`    Last submitted: ${sm.lastSubmitted || 'N/A'}`);
      console.log(`    Last downloaded: ${sm.lastDownloaded || 'N/A'}`);
      console.log(`    Errors: ${sm.errors || 0}, Warnings: ${sm.warnings || 0}`);
      if (sm.contents) {
        for (const c of sm.contents) {
          console.log(`    ${c.type}: ${c.submitted} submitted, ${c.indexed} indexed`);
        }
      }
      console.log('');
    }
  }

  // 2. Index status for key pages
  console.log('--- Index Status (key pages) ---\n');
  const indexResults = await indexStatus(searchconsole);
  const colUrl = 40;
  console.log(`  ${'URL'.padEnd(colUrl)} ${'Verdict'.padEnd(12)} ${'Coverage'.padEnd(30)} ${'Last Crawl'.padEnd(12)} Crawled As`);
  console.log(`  ${'-'.repeat(colUrl)} ${'-'.repeat(12)} ${'-'.repeat(30)} ${'-'.repeat(12)} ----------`);
  for (const r of indexResults) {
    console.log(`  ${r.url.padEnd(colUrl)} ${r.verdict.padEnd(12)} ${r.coverage.padEnd(30)} ${r.lastCrawl.padEnd(12)} ${r.crawledAs}`);
  }
  console.log('');

  // 3. Top queries
  console.log('--- Top 25 Queries ---\n');
  const queries = await topQueries(webmasters);
  if (queries.length === 0) {
    console.log('  No query data available\n');
  } else {
    console.log(`  ${'Query'.padEnd(50)} ${'Clicks'.padStart(7)} ${'Impr'.padStart(7)} ${'CTR'.padStart(7)} ${'Pos'.padStart(6)}`);
    console.log(`  ${'-'.repeat(50)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(6)}`);
    for (const row of queries) {
      console.log(`  ${(row.keys[0] || '').padEnd(50)} ${formatNum(row.clicks).padStart(7)} ${formatNum(row.impressions).padStart(7)} ${formatPct(row.ctr).padStart(7)} ${row.position.toFixed(1).padStart(6)}`);
    }
    console.log('');
  }

  // 4. Top pages
  console.log('--- Top 25 Pages ---\n');
  const pages = await topPages(webmasters);
  if (pages.length === 0) {
    console.log('  No page data available\n');
  } else {
    console.log(`  ${'Page'.padEnd(60)} ${'Clicks'.padStart(7)} ${'Impr'.padStart(7)} ${'CTR'.padStart(7)} ${'Pos'.padStart(6)}`);
    console.log(`  ${'-'.repeat(60)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(6)}`);
    for (const row of pages) {
      const page = (row.keys[0] || '').replace('https://altogetheragile.com', '');
      console.log(`  ${page.padEnd(60)} ${formatNum(row.clicks).padStart(7)} ${formatNum(row.impressions).padStart(7)} ${formatPct(row.ctr).padStart(7)} ${row.position.toFixed(1).padStart(6)}`);
    }
    console.log('');
  }

  // 5. Daily trend
  console.log('--- Daily Performance (last 28 days) ---\n');
  const daily = await performanceByDate(webmasters);
  if (daily.length === 0) {
    console.log('  No daily data available\n');
  } else {
    let totalClicks = 0, totalImpressions = 0;
    console.log(`  ${'Date'.padEnd(12)} ${'Clicks'.padStart(7)} ${'Impr'.padStart(7)} ${'CTR'.padStart(7)} ${'Pos'.padStart(6)}`);
    console.log(`  ${'-'.repeat(12)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(6)}`);
    for (const row of daily) {
      totalClicks += row.clicks;
      totalImpressions += row.impressions;
      console.log(`  ${row.keys[0].padEnd(12)} ${formatNum(row.clicks).padStart(7)} ${formatNum(row.impressions).padStart(7)} ${formatPct(row.ctr).padStart(7)} ${row.position.toFixed(1).padStart(6)}`);
    }
    console.log(`  ${'─'.repeat(12)} ${'-'.repeat(7)} ${'-'.repeat(7)}`);
    console.log(`  ${'TOTAL'.padEnd(12)} ${formatNum(totalClicks).padStart(7)} ${formatNum(totalImpressions).padStart(7)}`);
    console.log('');
  }
}

main().catch(err => {
  console.error('Report failed:', err.message);
  if (err.message.includes('invalid_grant') || err.message.includes('Token has been expired')) {
    console.error('\nToken expired. Re-run: node scripts/gsc-auth.mjs');
  }
  process.exit(1);
});
