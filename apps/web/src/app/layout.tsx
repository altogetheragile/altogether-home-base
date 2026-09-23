import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { getSiteSettings } from '@/lib/site-settings';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { brandCssVarsFor, brandImagesFor } from '@/lib/brand';
import { getCurrentUser, displayName } from '@/lib/auth';
import './globals.css';

/** Generated rather than static, because the favicon is now this site's rather than this
 *  repository's. Without a declared icon the migrated pages carried none at all and Google showed
 *  the generic globe in search results, so it is worth getting right per site. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const { favicon } = brandImagesFor(settings.brand);
  const name = settings.company_name || SITE_NAME;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Altogether Agile - Agile Coaching & Training',
      template: `%s - ${name}`,
    },
    description:
      'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.',
    icons: {
      icon: [{ url: favicon, type: favicon.endsWith('.svg') ? 'image/svg+xml' : undefined }],
      shortcut: favicon,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The real session, read on the server from the cookies both apps now share. This replaces
  // the `aa-auth` presence cookie, which could only ever say that somebody was signed in.
  const [settings, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);
  const images = brandImagesFor(settings.brand);
  return (
    <html lang="en">
      <body>
        {/* Brand tokens from the shared design system (@altogether/ui), exposed as
            CSS variables for the whole Site. */}
        <div className="flex min-h-screen flex-col" style={brandCssVarsFor(settings.brand)}>
          <Navigation settings={settings} name={displayName(user)} signedIn={!!user} logo={images.logo} />
          <div className="flex-1">{children}</div>
          <Footer settings={settings} year={new Date().getFullYear()} logo={images.logo} />
        </div>
      </body>
    </html>
  );
}
