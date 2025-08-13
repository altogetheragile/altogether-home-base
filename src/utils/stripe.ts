export function getStripeDashboardSearchUrl(identifier: string): string {
  if (!identifier) return 'https://dashboard.stripe.com/search';
  const isTest = identifier.startsWith('cs_test_');
  const base = isTest
    ? 'https://dashboard.stripe.com/test/search'
    : 'https://dashboard.stripe.com/search';
  const url = new URL(base);
  url.searchParams.set('query', identifier);
  return url.toString();
}
