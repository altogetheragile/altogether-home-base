import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isSiteOwned } from '@/config/siteOwnedRoutes';

// The App does not declare routes for the Site's URLs, so `navigate('/')` matches nothing and
// React Router falls through to Not Found.
//
// That is what signing in did: the redirect went to `/`, the router had no such route, and someone
// who had just signed in got a 404 with a working session behind it. Reported from the preview,
// and it had nothing to do with the session change it was found in - it came from removing the
// duplicate routes, which converted the links and missed the redirects. A link is visible in the
// markup; a redirect is not.

/** Every literal path handed to a navigate() call in the App. */
function navigateTargets(): { file: string; to: string }[] {
  const out = execSync(
    `grep -rn "navigate([\\"']/" src --include=*.tsx --include=*.ts || true`,
    { encoding: 'utf8' },
  );
  return out
    .split('\n')
    .filter((line) => line && !line.includes('.test.'))
    .map((line) => {
      const [file] = line.split(':');
      const to = line.match(/navigate\(['"](\/[^'"]*)['"]/)?.[1];
      return to ? { file, to } : null;
    })
    .filter((x): x is { file: string; to: string } => x !== null);
}

describe('navigating in code', () => {
  it('uses useAppNavigate wherever it can reach a Site URL', () => {
    const offenders = navigateTargets()
      .filter(({ to }) => isSiteOwned(to))
      .filter(({ file }) => !readFileSync(file, 'utf8').includes('useAppNavigate'))
      .map(({ file, to }) => `${file} -> ${to}`);
    expect(offenders, `plain navigate() to a Site URL: ${offenders.join(', ')}`).toEqual([]);
  });

  it('finds navigate calls at all, so a pass means something', () => {
    expect(navigateTargets().length).toBeGreaterThan(3);
  });
});
