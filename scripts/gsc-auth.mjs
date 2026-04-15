/**
 * Google Search Console OAuth flow.
 * Run once to authorise: node scripts/gsc-auth.mjs
 * Opens a browser for consent, then saves token to scripts/gsc-token.json.
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = resolve(__dirname, 'gsc-credentials.json');
const TOKEN_PATH = resolve(__dirname, 'gsc-token.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

async function main() {
  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  const { client_id, client_secret } = creds.installed;

  // Use localhost with a dynamic port for the redirect
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3199');

  // Check for existing token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    console.log('Already authenticated (token exists). Delete scripts/gsc-token.json to re-auth.');
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\nOpening browser for Google authorisation...\n');
  console.log('If the browser does not open, visit this URL:\n');
  console.log(authUrl);
  console.log('');

  // Open browser
  const open = (await import('open')).default;
  await open(authUrl);

  // Start local server to receive the callback
  const code = await new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3199');
      const authCode = url.searchParams.get('code');
      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Authorised! You can close this tab.</h2>');
        server.close();
        resolveCode(authCode);
      } else {
        res.writeHead(400);
        res.end('No auth code received');
      }
    });
    server.listen(3199, () => {
      console.log('Waiting for authorisation callback on http://localhost:3199 ...\n');
    });
    server.on('error', reject);
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('Token saved to scripts/gsc-token.json\n');

  return oAuth2Client;
}

main().catch(err => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});
