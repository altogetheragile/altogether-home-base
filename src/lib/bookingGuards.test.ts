import { describe, it, expect } from 'vitest';
import {
  looksLikeSpam,
  escapeHtml,
  hashIp,
  callerIp,
} from '../../supabase/functions/_shared/bookingGuards';

describe('looksLikeSpam', () => {
  it('passes an ordinary booking note', () => {
    expect(looksLikeSpam('I would like to talk about coaching my team through a restructure.'))
      .toBe(false);
  });

  it('passes an empty note', () => {
    expect(looksLikeSpam('')).toBe(false);
  });

  it('rejects anything carrying a link', () => {
    // A booking note has no business containing a URL, so one is enough.
    expect(looksLikeSpam('Check out https://example.com for details')).toBe(true);
    expect(looksLikeSpam('see www.example.com')).toBe(true);
  });

  it('rejects two or more spam phrases', () => {
    expect(looksLikeSpam('We do cold email at scale, give it a try')).toBe(true);
  });

  it('tolerates a single phrase that could be innocent', () => {
    // "at scale" is ordinary language in this business. One signal is not enough,
    // which is the same threshold send-contact-email uses.
    expect(looksLikeSpam('We are trying to adopt agile at scale')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('neutralises a script tag', () => {
    expect(escapeHtml('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes quotes so attributes cannot be broken out of', () => {
    expect(escapeHtml(`" onmouseover="x`)).toBe('&quot; onmouseover=&quot;x');
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes ampersands first, so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeHtml('Alun Davies-Baker')).toBe('Alun Davies-Baker');
  });
});

describe('hashIp', () => {
  it('is stable for the same address', async () => {
    expect(await hashIp('203.0.113.7')).toBe(await hashIp('203.0.113.7'));
  });

  it('differs between addresses', async () => {
    expect(await hashIp('203.0.113.7')).not.toBe(await hashIp('203.0.113.8'));
  });

  it('does not contain the address it hashed', async () => {
    // The point of hashing is that the stored value is not a record of who
    // visited, so the original must not be recoverable by eye.
    const hash = await hashIp('203.0.113.7');
    expect(hash).not.toContain('203');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('callerIp', () => {
  it('takes the first address from x-forwarded-for', () => {
    // Proxies append, so the client is first and the rest are hops.
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' },
    });
    expect(callerIp(req)).toBe('203.0.113.7');
  });

  it('falls back to cf-connecting-ip', () => {
    const req = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '203.0.113.9' },
    });
    expect(callerIp(req)).toBe('203.0.113.9');
  });

  it('returns a placeholder rather than throwing when nothing is available', () => {
    // Everything from one bucket is better than crashing the endpoint.
    expect(callerIp(new Request('https://example.com'))).toBe('unknown');
  });
});
