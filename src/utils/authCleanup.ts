export const cleanupAuthState = () => {
  try {
    if (typeof window === 'undefined') return;

    // Clear specific Supabase auth keys
    try {
      localStorage.removeItem('supabase.auth.token');
    } catch {}

    // Remove all Supabase-related keys from localStorage
    try {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          window.localStorage.removeItem(key);
        }
      });
    } catch {}

    // Remove all Supabase-related keys from sessionStorage
    try {
      Object.keys(window.sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch {}
  } catch (err) {
    // Swallow errors – cleanup is best-effort
    console.warn('Auth cleanup warning:', err);
  }
};
