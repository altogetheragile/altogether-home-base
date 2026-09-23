import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { getSiteSettings } from '@/lib/site-settings';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { brandCssVarsFor } from '@/lib/brand';
import { getCurrentUser, displayName } from '@/lib/auth';
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
  // The real session, read on the server from the cookies both apps now share. This replaces
  // the `aa-auth` presence cookie, which could only ever say that somebody was signed in.
  const [settings, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);
  return (
    <html lang="en">
      <body>
        {/* Brand tokens from the shared design system (@altogether/ui), exposed as
            CSS variables for the whole Site. */}
        <div className="flex min-h-screen flex-col" style={brandCssVarsFor(settings.brand)}>
          <Navigation settings={settings} name={displayName(user)} signedIn={!!user} />
          <div className="flex-1">{children}</div>
          <Footer settings={settings} year={new Date().getFullYear()} />
        </div>
      </body>
    </html>
  );
}
