import { logoOf, wordmarkOf } from '@altogether/ui/brand';
import { HoldingPage as Shared, type HoldingLogo } from '@altogether/ui/HoldingPage';
import type { SiteSettings } from '@/lib/site-settings';
import { logoName } from '@/lib/ourSite';
import { signOut } from '@/app/actions/signOut';

/** The holding page, with this site's own logo and address worked out for it.
 *
 *  The page itself is shared with the App, because both apps serve pages a visitor can reach and
 *  a holding page covering one of them is not a holding page. Only the working-out is here. */
export function HoldingPage({
  settings, heading, body, signedIn = false, name: who = null,
}: {
  settings: SiteSettings;
  heading: string;
  body: string;
  signedIn?: boolean;
  name?: string | null;
}) {
  const name = logoName(settings.company_name);
  const logo = logoOf(settings.brand, name);
  const mark = wordmarkOf(settings.brand as Parameters<typeof wordmarkOf>[0], name);
  const shown: HoldingLogo = logo.mode === 'image'
    ? { mode: 'image', src: logo.src }
    // A wordmark set in two colours belongs to the header, which has room for it. Here it is one
    // line above a heading, so it is the name and nothing else.
    : { mode: 'wordmark', text: mark.gap ? `${mark.first} ${mark.second}` : `${mark.first}${mark.second}` };

  // A form, so it works before any JavaScript has loaded. This page has none of its own.
  const account = signedIn ? (
    <form action={signOut} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span>{who ? `Signed in as ${who}.` : 'Signed in.'}</span>
      <button type="submit" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
        Sign Out
      </button>
    </form>
  ) : undefined;

  return <Shared logo={shown} heading={heading} body={body} email={settings.contact_email} account={account} />;
}
