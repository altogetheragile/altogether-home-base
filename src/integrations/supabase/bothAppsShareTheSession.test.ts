import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The App writes the session; the Site reads it. Same origin, same cookies.
//
// That only holds while both use the same @supabase/ssr. The cookie format is the library's
// private business - names, chunking across sb-<ref>-auth-token.0/.1, and the encoding of what is
// inside them - and it has changed between versions. Two apps on different versions can sit on the
// same domain writing and reading cookies neither can make sense of, and the failure is silent:
// the Site simply decides nobody is signed in, which is exactly the state this change exists to
// end.
//
// The App was on 2.99 with no ssr at all and the Site on 0.5.2 with supabase-js 2.45, which is how
// they got this far apart.

const pkg = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

const APP = pkg('package.json');
const SITE = pkg('apps/web/package.json');

/** "^0.12.7" -> "0.12" - the pair have to agree on the format, not the patch. */
const minor = (range: string) => range.replace(/^[^\d]*/, '').split('.').slice(0, 2).join('.');

describe('the two apps', () => {
  for (const dep of ['@supabase/ssr', '@supabase/supabase-js']) {
    it(`agree on ${dep}`, () => {
      const app = APP.dependencies?.[dep];
      const site = SITE.dependencies?.[dep];
      expect(app, `the App does not depend on ${dep}`).toBeTruthy();
      expect(site, `the Site does not depend on ${dep}`).toBeTruthy();
      expect(minor(site), `App has ${app}, Site has ${site}`).toBe(minor(app));
    });
  }

  it('run on a Node that has a native WebSocket, which supabase-js now requires', () => {
    // Node 20 does not, and the build failed on it: prerender.mjs creates a client.
    const declared = APP.engines?.node ?? '';
    const major = Number(declared.replace(/[^\d]/g, '').slice(0, 2));
    expect(declared, 'no Node version is declared, so CI and Vercel can disagree').toBeTruthy();
    expect(major, `engines.node is ${declared}`).toBeGreaterThanOrEqual(22);
  });
});
