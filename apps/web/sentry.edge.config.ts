// Sentry init for the Edge runtime (middleware, edge route handlers). Loaded by
// instrumentation.ts. No-op until a DSN is set in the environment.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
  });
}
