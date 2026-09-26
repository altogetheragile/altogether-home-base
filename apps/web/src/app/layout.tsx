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
import { HoldingPage } from '@/components/HoldingPage';
import { EditableArea } from '@/components/edit/Editable';
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
    // A crawler is never an administrator, so while the holding page is up there is nothing here
    // worth indexing, and a half-written page indexed once is hard to take back.
    ...(settings.under_construction ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The real session, read on the server from the cookies both apps now share. This replaces
  // the `aa-auth` presence cookie, which could only ever say that somebody was signed in.
  // The menu labels resolve here because getCopy needs a server client and Navigation is a
  // client component. Passing the resolved strings down costs one query the layout already waits on.
  const [settings, user, t, admin, siteWords] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    getCopy('navigation'),
    isAdmin(),
    getCopy('site'),
  ]);

  // Not ready yet. An administrator always gets the real site, because a site being finished has
  // to be lookable at, and that is also what makes this safe to leave on: whoever can turn it off
  // can already see past it.
  const holding = !!settings.under_construction && !admin;
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
          {holding ? (
            <HoldingPage settings={settings} heading={siteWords('site.construction.heading')} body={siteWords('site.construction.body')} />
          ) : (
          <>
          {/* Only an admin can be on a hidden page at all, so this only ever renders for one. */}
          {admin && <HiddenFromVisitors hidden={hidden} />}
          {/* The site looks entirely normal to the only person who can see it, so it has to say
              that nobody else can. Without this it is switched on once and forgotten. */}
          {admin && settings.under_construction && (
            <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
              Visitors are seeing the holding page. You are seeing the real site because you are
              signed in as an administrator. Turn this off under <strong>Not ready yet</strong> on
              the This Site tab when it is ready.
            </p>
          )}
          <Navigation settings={settings} name={displayName(user)} signedIn={!!user} labels={labels} signedInAsAdmin={admin} />
          <div className="flex-1"><EditableArea on={admin}>{children}</EditableArea></div>
          <Footer settings={settings} year={new Date().getFullYear()} t={t} signedInAsAdmin={admin} />
          </>
          )}
          {/* Not mounted at all for anyone else, so a visitor never downloads the editor, and
              the actions it calls check again because not mounting a component is not a
              permission. Mounted even behind the holding page: it is how the site gets finished,
              and how the holding page itself is switched off. */}
          {admin && <EditThisPage previewing={previewing} />}
        </div>
      </body>
    </html>
  );
}
