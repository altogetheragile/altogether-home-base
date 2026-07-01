import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { getSiteSettings } from '@/lib/site-settings';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { brandCssVars } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Altogether Agile - Agile Coaching & Training',
    template: `%s - ${SITE_NAME}`,
  },
  description:
    'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
  // Declare the brand favicon on every Next page. Without this, the migrated pages
  // (home, /exams, etc.) carried no <link rel="icon">, so Google showed the generic
  // globe in search results. Matches the SPA's /favicon.svg.
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, cookieStore] = await Promise.all([getSiteSettings(), cookies()]);
  // Non-sensitive presence signal published by the App (see src/utils/authPresence.ts):
  // display only, never used for access control.
  const signedIn = cookieStore.get('aa-auth')?.value === '1';
  return (
    <html lang="en">
      <body>
        {/* Brand tokens from the shared design system (@altogether/ui), exposed as
            CSS variables for the whole Site. */}
        <div className="flex min-h-screen flex-col" style={brandCssVars}>
          <Navigation settings={settings} signedIn={signedIn} />
          <div className="flex-1">{children}</div>
          <Footer settings={settings} year={new Date().getFullYear()} />
        </div>
      </body>
    </html>
  );
}
