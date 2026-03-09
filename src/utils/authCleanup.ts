export const cleanupAuthState = () => {
  try {
    if (typeof window === 'undefined') return;

    // Clear specific Supabase auth keys
    try {
      localStorage.removeItem('supabase.auth.token');
    } catch (_) { /* Intentionally silent — localStorage may be unavailable (e.g., private browsing) */ }

    // Remove all Supabase-related keys from localStorage
    try {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (_) { /* Intentionally silent — localStorage cleanup is best-effort */ }

    // Remove all Supabase-related keys from sessionStorage
    try {
      Object.keys(window.sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (_) { /* Intentionally silent — sessionStorage cleanup is best-effort */ }
  } catch (err) {
    // Swallow errors – cleanup is best-effort
    // Auth cleanup warning suppressed
  }
};
