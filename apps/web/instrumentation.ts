// Next.js instrumentation hook: wires Sentry into the server + edge runtimes.
// The server/edge configs are dynamically imported so they only load in their runtime.
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown in nested React Server Components (App Router).
export const onRequestError = Sentry.captureRequestError;
