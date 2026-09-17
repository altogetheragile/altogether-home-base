/**
 * Google Calendar OAuth flow for the booking tool.
 *
 * Run once, locally, to mint the refresh token the booking edge functions use:
 *
 *     node scripts/booking-google-auth.mjs
 *
 * It opens a browser for consent, then prints the refresh token. Paste that into
 * Supabase as BOOKING_GOOGLE_REFRESH_TOKEN. It is NOT written to a file - the
 * token is a long-lived credential for Al's calendar and should not sit in the
 * working tree where it can be committed by accident.
 *
 * Reuses the same OAuth client as Search Console (scripts/gsc-credentials.json),
 * so there is nothing new to create in Google Cloud. Different scopes, though,
 * which is why this is a separate consent and a separate token.
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = resolve(__dirname, 'gsc-credentials.json');
const PORT = 3199;

// events: create and delete the booking's calendar entry.
// readonly: read free/busy across the calendars that count as busy.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

async function main() {
  if (!existsSync(CREDS_PATH)) {
    console.error(
      `\nNo OAuth client found at ${CREDS_PATH}.\n\n` +
        'This script reuses the Search Console OAuth client. Download the\n' +
        'desktop client JSON from Google Cloud Console and save it there.\n',
    );
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  const { client_id, client_secret } = creds.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, `http://localhost:${PORT}`);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    // Google only returns a refresh token on the first consent for a given
    // client and scope set. Forcing the prompt means re-running this script
    // always gives a usable token rather than silently returning none.
    prompt: 'consent',
  });

  console.log('\nOpening browser for Google authorisation...\n');
  console.log('Sign in as the account whose calendar holds the bookings.\n');
  console.log('If the browser does not open, visit this URL:\n');
  console.log(authUrl);
  console.log('');

  const open = (await import('open')).default;
  await open(authUrl);

  const code = await new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const authCode = url.searchParams.get('code');
      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Authorised. You can close this tab.</h2>');
        server.close();
        resolveCode(authCode);
      } else {
        res.writeHead(400);
        res.end('No auth code received');
      }
    });
    server.listen(PORT, () => {
      console.log(`Waiting for the callback on http://localhost:${PORT} ...\n`);
    });
    server.on('error', reject);
  });

  const { tokens } = await oAuth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      '\nGoogle returned no refresh token.\n\n' +
        'That happens when this client has already been consented for these\n' +
        'scopes. Revoke it at https://myaccount.google.com/permissions and run\n' +
        'this again.\n',
    );
    process.exit(1);
  }

  console.log('\nRefresh token (set this as BOOKING_GOOGLE_REFRESH_TOKEN):\n');
  console.log(tokens.refresh_token);
  console.log('\nThen:\n');
  console.log(
    '  npx supabase secrets set BOOKING_GOOGLE_REFRESH_TOKEN=<the token above> \\\n' +
      '    --project-ref wqaplkypnetifpqrungv\n',
  );
  console.log('Nothing has been written to disk. Copy it now.\n');
}

main().catch((err) => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});
