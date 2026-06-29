/** Server-free formatting helpers (safe to import from Client Components). */
export function formatDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
