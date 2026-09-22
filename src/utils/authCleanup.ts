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
    // Cookies, which is where the session lives now. @supabase/ssr writes `sb-<ref>-auth-token`
    // and chunks it across `.0`, `.1` and so on when it is too big for one cookie, so every
    // matching name goes rather than one known key.
    //
    // The localStorage sweep above stays deliberately: it is what clears the session somebody was
    // carrying from before the switch, on their first visit after it.
    try {
      for (const entry of document.cookie.split(';')) {
        const name = entry.split('=')[0]?.trim();
        if (!name) continue;
        if (name.startsWith('sb-') || name.startsWith('supabase.auth.')) {
          document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
        }
      }
    } catch (_) { /* Intentionally silent — cookie cleanup is best-effort */ }
  } catch (err) {
    // Swallow errors – cleanup is best-effort
    // Auth cleanup warning suppressed
  }
};
