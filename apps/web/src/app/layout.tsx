import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { getSiteSettings } from '@/lib/site-settings';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { brandCssVarsFor, brandImagesFor } from '@/lib/brand';
import { getCurrentUser, displayName } from '@/lib/auth';
import { getCopy, REGISTRIES } from '@/lib/copy';
import { isAdmin } from '@/lib/auth';
import { EditThisPage } from '@/components/edit/EditThisPage';
import { HiddenFromVisitors } from '@/components/edit/HiddenFromVisitors';
import { MODULE_FOR_PATH } from '@/lib/copy/routes';
import { moduleIsShown, type GatedModule } from '@/lib/module-gate';
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
      default: settings.company_description?.trim() ? `${name} - ${settings.company_description.trim().split('.')[0]}` : name,
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
  // The menu labels resolve here because getCopy needs a server client and Navigation is a
  // client component. Passing the resolved strings down costs one query the layout already waits on.
  const [settings, user, t, admin] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    getCopy('navigation'),
    isAdmin(),
  ]);
  // Which pages are switched off, worked out once here rather than by each page for itself.
  const hidden = Object.fromEntries(
    [...new Set(Object.values(MODULE_FOR_PATH))].map((m) => [m, !moduleIsShown(m as GatedModule, settings)]),
  );
  // Read here rather than in the drawer, because the drawer runs in the browser and this is a
  // cookie the browser is not meant to be able to read for itself.
  const previewing = (await draftMode()).isEnabled && admin;
  const navKeys = REGISTRIES.find((r) => r.page === 'navigation')?.entries ?? {};
  const labels = Object.fromEntries(Object.keys(navKeys).map((k) => [k, t(k)]));
  return (
    <html lang="en">
      <body>
        {/* Brand tokens from the shared design system (@altogether/ui), exposed as
            CSS variables for the whole Site. */}
        <div className="flex min-h-screen flex-col" style={brandCssVarsFor(settings.brand)}>
          {/* Only an admin can be on a hidden page at all, so this only ever renders for one. */}
          {admin && <HiddenFromVisitors hidden={hidden} />}
          <Navigation settings={settings} name={displayName(user)} signedIn={!!user} labels={labels} signedInAsAdmin={admin} />
          <div className="flex-1">{children}</div>
          <Footer settings={settings} year={new Date().getFullYear()} t={t} signedInAsAdmin={admin} />
          {/* Not mounted at all for anyone else, so a visitor never downloads the editor. The
              actions it calls check again, because not mounting a component is not a permission. */}
          {admin && <EditThisPage previewing={previewing} />}
        </div>
      </body>
    </html>
  );
}
