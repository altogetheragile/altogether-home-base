/* Enough of a browser for a preview script to import app modules that expect one.
 * The Supabase client is created at import time and reaches for localStorage; a preview that only
 * renders markup never uses it, but it does have to survive being loaded. */
const store = new Map();
const shim = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.localStorage ??= shim;
globalThis.sessionStorage ??= shim;
globalThis.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
