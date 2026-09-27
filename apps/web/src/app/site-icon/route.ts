// ============= The icon a browser asks for without being told =============
//
// Every browser requests /favicon.ico whether or not the page names an icon, and on this domain
// that path fell through to the SPA catch-all and answered 200 with six kilobytes of HTML. A 404
// would have been better: a browser can tell nothing from a success that is not an icon.
//
// So the path is answered here, with whatever this site has chosen, and 404 when it has chosen
// nothing. Not a file in public/, because a file in public/ is this repository's icon and would
// ship to every site built from here - which is the mistake this whole sequence started with.
//
// Reachable at /favicon.ico, which config/vercel/routing.json rewrites to /site-icon. The name
// differs because `favicon.ico` inside the app directory is a Next file convention, and a route
// of that name fights it.
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/site-settings';
import { brandImagesFor } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Long enough that a browser is not asking on every page, short enough that changing the icon
 *  in the editor is visible the same day rather than at the next deploy. */
const CACHE = 'public, max-age=3600, stale-while-revalidate=86400';

export async function GET() {
  let icon = '';
  try {
    icon = brandImagesFor((await getSiteSettings()).brand).favicon;
  } catch {
    // A settings lookup that fails is not a reason to serve somebody else's icon.
  }

  if (!icon.trim()) {
    // Nothing chosen. 404 rather than a default, so a site that has not picked an icon looks
    // unfinished instead of looking like Altogether Agile.
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': CACHE } });
  }

  // A redirect rather than a proxy: the file is already public and on a CDN, and copying its
  // bytes through this route would put a server hop in front of every tab a visitor opens.
  //
  // An icon may be stored either way: an uploaded one is a full address, and this site's own is
  // the path /favicon.svg. A path is resolved against whichever domain asked, so the same code
  // answers for both sites.
  const target = /^https?:\/\//i.test(icon) ? icon : new URL(icon, await thisOrigin()).toString();
  return NextResponse.redirect(target, { status: 307, headers: { 'Cache-Control': CACHE } });
}

/** The domain this request came in on, for an icon stored as a path. */
async function thisOrigin(): Promise<string> {
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost'}`;
}
