// Sentry init for the Node.js server runtime (App Router server components, route
// handlers, server actions). Loaded by instrumentation.ts. No-op until SENTRY_DSN /
// NEXT_PUBLIC_SENTRY_DSN is set in the environment, so builds are unaffected pre-activation.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
    // Lean: error monitoring + light tracing only. No Replay / profiling.
  });
}
