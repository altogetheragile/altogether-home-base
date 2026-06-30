'use client';

// App Router global error boundary: catches render errors in the root layout/template
// and reports them to Sentry. This file is its own lazily-loaded chunk (only fetched
// when a global error occurs), so it does not weigh on the main bundle.
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: '4rem 1.5rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something Went Wrong</h2>
          <p style={{ color: '#555' }}>
            Please refresh the page. If the problem persists, contact us.
          </p>
        </div>
      </body>
    </html>
  );
}
