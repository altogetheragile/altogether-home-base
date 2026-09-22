import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanupAuthState } from '@/utils/authCleanup';

// A password reset is two steps with a gap in the middle.
//
// Asking for the email stores a PKCE code verifier; opening the link completes the exchange with
// it. cleanupAuthState swept everything named sb-*, which now includes that verifier, and it runs
// on sign-in, sign-up, sign-out and cancelling an MFA challenge. So doing any of those between
// asking for a reset and opening the email threw the reset away, and the failure landed minutes
// later as "Auth session missing!" on somebody who could do nothing about it.
//
// Under the old implicit flow there was no verifier and the blanket sweep was harmless. Moving the
// session into cookies is what made it destructive.

const REF = 'wqaplkypnetifpqrungv';

describe('clearing auth state', () => {
  it('leaves a pending code exchange alone', () => {
    document.cookie = `sb-${REF}-auth-token=session-value; Path=/`;
    document.cookie = `sb-${REF}-auth-token-code-verifier=the-verifier; Path=/`;
    window.localStorage.setItem(`sb-${REF}-auth-token-code-verifier`, 'the-verifier');
    window.localStorage.setItem(`sb-${REF}-auth-token`, 'session-value');

    cleanupAuthState();

    expect(document.cookie, 'the session cookie survived').not.toContain('sb-' + REF + '-auth-token=');
    expect(document.cookie, 'the verifier was destroyed, and with it the reset link')
      .toContain('code-verifier');
    expect(window.localStorage.getItem(`sb-${REF}-auth-token-code-verifier`),
      'the verifier was destroyed in localStorage').toBe('the-verifier');
    expect(window.localStorage.getItem(`sb-${REF}-auth-token`), 'the session survived').toBeNull();
  });
});

describe('the reset form', () => {
  it('exchanges the code itself and can explain a failure', () => {
    const src = readFileSync('src/pages/ResetPassword.tsx', 'utf8');
    expect(src, 'nothing exchanges the code').toContain('exchangeCodeForSession');
    expect(src, 'a link that cannot be opened has no message').toContain('linkProblem');
  });

  it('asks the client to read the URL rather than inheriting it', () => {
    const src = readFileSync('src/integrations/supabase/client.ts', 'utf8');
    expect(src).toMatch(/detectSessionInUrl:\s*true/);
  });
});
