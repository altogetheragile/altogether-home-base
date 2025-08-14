import { describe, it, expect } from 'vitest';
import { getStripeDashboardSearchUrl } from '@/utils/stripe';

describe('getStripeDashboardSearchUrl', () => {
  it('returns default search URL when no identifier provided', () => {
    const result = getStripeDashboardSearchUrl('');
    expect(result).toBe('https://dashboard.stripe.com/search');
  });

  it('returns test dashboard URL for test session ID', () => {
    const testSessionId = 'cs_test_123456789';
    const result = getStripeDashboardSearchUrl(testSessionId);
    expect(result).toBe('https://dashboard.stripe.com/test/search?query=cs_test_123456789');
  });

  it('returns live dashboard URL for live session ID', () => {
    const liveSessionId = 'cs_live_123456789';
    const result = getStripeDashboardSearchUrl(liveSessionId);
    expect(result).toBe('https://dashboard.stripe.com/search?query=cs_live_123456789');
  });

  it('properly encodes special characters in URL params', () => {
    const sessionIdWithSpecialChars = 'cs_test_123+456&789';
    const result = getStripeDashboardSearchUrl(sessionIdWithSpecialChars);
    expect(result).toBe('https://dashboard.stripe.com/test/search?query=cs_test_123%2B456%26789');
  });

  it('handles session IDs that do not start with cs_test_ as live', () => {
    const sessionId = 'cs_123456789';
    const result = getStripeDashboardSearchUrl(sessionId);
    expect(result).toBe('https://dashboard.stripe.com/search?query=cs_123456789');
  });
});