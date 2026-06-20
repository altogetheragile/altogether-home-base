/**
 * Submit (refresh) the sitemap in Google Search Console, then print its status.
 * Run: node scripts/gsc-submit-sitemap.mjs
 *
 * Google deprecated the old anonymous sitemap "ping" endpoint in 2023, so this
 * uses the authenticated Search Console API (sitemaps.submit). Idempotent -
 * safe to run after every deploy.
 */
import { google } from 'googleapis';
import { getAuthClient, SITE_URL } from './gsc-auth-client.mjs';

const SITEMAP_URL = 'https://altogetheragile.com/sitemap.xml';

async function main() {
  const auth = getAuthClient();
  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log(`\nSubmitting ${SITEMAP_URL}\n  to property ${SITE_URL} ...`);
  await webmasters.sitemaps.submit({ siteUrl: SITE_URL, feedpath: SITEMAP_URL });
  console.log('  submitted OK.\n');

  const { data: sm } = await webmasters.sitemaps.get({ siteUrl: SITE_URL, feedpath: SITEMAP_URL });
  console.log('--- Sitemap status ---');
  console.log(`  path:            ${sm.path}`);
  console.log(`  last submitted:  ${sm.lastSubmitted || 'N/A'}`);
  console.log(`  last downloaded: ${sm.lastDownloaded || 'N/A'}`);
  console.log(`  errors: ${sm.errors || 0}, warnings: ${sm.warnings || 0}`);
  if (sm.contents) {
    for (const c of sm.contents) console.log(`  ${c.type}: ${c.submitted} submitted, ${c.indexed} indexed`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('Submit failed:', err.message);
  if (err.message.includes('invalid_grant') || err.message.includes('expired')) {
    console.error('\nToken expired. Re-run: node scripts/gsc-auth.mjs');
  }
  process.exit(1);
});
