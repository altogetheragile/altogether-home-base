import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The two apps cannot import from each other, so "what makes someone an admin" is written twice.
// That is exactly the shape of the bug #720 shipped: two copies of a rule, one of them quietly
// wrong, and a test that read the wrong one. This compares the files themselves.
//
// It is a weak test and worth knowing why it is here anyway: it cannot prove the two agree, only
// that one has not lost a step the other still has. If this fails, read both and decide - do not
// silence it.

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const site = read('./auth.ts');
const app = read('../../../../src/hooks/useUserRole.ts');

describe('what makes someone an admin', () => {
  it('is decided from user_roles in both apps', () => {
    for (const [name, src] of [['Site', site], ['App', app]] as const) {
      expect(src, `${name} does not read user_roles`).toContain("from('user_roles')");
    }
  });

  it('prefers admin over moderator in both apps', () => {
    for (const [name, src] of [['Site', site], ['App', app]] as const) {
      const admin = src.indexOf("'admin'");
      const moderator = src.indexOf("'moderator'");
      expect(admin, `${name} never mentions admin`).toBeGreaterThan(-1);
      expect(moderator, `${name} never mentions moderator`).toBeGreaterThan(-1);
      expect(admin, `${name} checks moderator before admin`).toBeLessThan(moderator);
    }
  });

  it('still falls back to profiles.role in both apps, for the accounts that predate user_roles', () => {
    for (const [name, src] of [['Site', site], ['App', app]] as const) {
      expect(src, `${name} dropped the profiles fallback`).toContain("from('profiles')");
    }
  });
});
