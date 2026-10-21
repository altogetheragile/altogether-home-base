import { logoOf, wordmarkOf } from '@altogether/ui/brand';
import { HoldingPage as Shared, type HoldingLogo } from '@altogether/ui/HoldingPage';
import type { SiteSettings } from '@/lib/site-settings';
import { logoName } from '@/lib/ourSite';

/** The holding page, with this site's own logo and address worked out for it.
 *
 *  The page itself is shared with the App, because both apps serve pages a visitor can reach and
 *  a holding page covering one of them is not a holding page. Only the working-out is here. */
export function HoldingPage({
  settings, heading, body,
}: {
  settings: SiteSettings;
  heading: string;
  body: string;
}) {
  const name = logoName(settings.company_name);
  const logo = logoOf(settings.brand, name);
  const mark = wordmarkOf(settings.brand as Parameters<typeof wordmarkOf>[0], name);
  const shown: HoldingLogo = logo.mode === 'image'
    ? { mode: 'image', src: logo.src }
    // A wordmark set in two colours belongs to the header, which has room for it. Here it is one
    // line above a heading, so it is the name and nothing else.
    : { mode: 'wordmark', text: mark.gap ? `${mark.first} ${mark.second}` : `${mark.first}${mark.second}` };

  return <Shared logo={shown} heading={heading} body={body} email={settings.contact_email} />;
}
