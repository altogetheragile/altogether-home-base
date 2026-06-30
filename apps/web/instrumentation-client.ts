// Sentry init for the browser. Deliberately uses a static env guard + dynamic import so
// that when NEXT_PUBLIC_SENTRY_DSN is unset at build time the whole Sentry browser SDK is
// tree-shaken out of the client bundle — the marketing site keeps its PageSpeed budget
// until error monitoring is actually switched on. When the DSN is set, the SDK loads
// asynchronously (after first paint), so it never blocks rendering.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.1,
      // Lean: no Session Replay, no profiling — error capture + light tracing only.
    });
  });
}
