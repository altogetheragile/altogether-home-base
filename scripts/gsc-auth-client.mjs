/**
 * Shared Google Search Console OAuth client.
 *
 * Prefers env secrets (GSC_CREDENTIALS_JSON + GSC_TOKEN_JSON), used by the
 * scheduled remote agent where the gitignored credential files are absent;
 * falls back to the local gsc-credentials.json / gsc-token.json files.
 */
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = resolve(__dirname, 'gsc-credentials.json');
const TOKEN_PATH = resolve(__dirname, 'gsc-token.json');

// Domain property (verified via DNS).
export const SITE_URL = 'sc-domain:altogetheragile.com';

export function getAuthClient() {
  let creds, token;
  if (process.env.GSC_CREDENTIALS_JSON && process.env.GSC_TOKEN_JSON) {
    creds = JSON.parse(process.env.GSC_CREDENTIALS_JSON);
    token = JSON.parse(process.env.GSC_TOKEN_JSON);
  } else if (existsSync(CREDS_PATH) && existsSync(TOKEN_PATH)) {
    creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
    token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  } else {
    console.error('No credentials. Set GSC_CREDENTIALS_JSON + GSC_TOKEN_JSON env vars, or run: node scripts/gsc-auth.mjs');
    process.exit(1);
  }

  const { client_id, client_secret } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3199');
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}
