
export interface CurrencyInfo {
  symbol: string;
  code: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  usd: { symbol: '$', code: 'USD', name: 'US Dollar' },
  eur: { symbol: '€', code: 'EUR', name: 'Euro' },
  gbp: { symbol: '£', code: 'GBP', name: 'British Pound' },
  cad: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  aud: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
};

export const formatPrice = (priceCents: number, currency: string = 'usd'): string => {
  // Handle invalid inputs - undefined, null, NaN, or zero
  if (!priceCents || isNaN(priceCents) || priceCents === 0) return 'Free';
  
  const price = priceCents / 100;
  const currencyInfo = SUPPORTED_CURRENCIES[currency.toLowerCase()];
  
  if (!currencyInfo) {
    // Fallback to standard formatting if currency not supported
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }
  
  // Use Intl.NumberFormat for proper currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyInfo.code,
  }).format(price);
};

export const getCurrencySymbol = (currency: string = 'usd'): string => {
  const currencyInfo = SUPPORTED_CURRENCIES[currency.toLowerCase()];
  return currencyInfo?.symbol || '$';
};
