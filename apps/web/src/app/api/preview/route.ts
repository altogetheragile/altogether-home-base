// Turning the preview on and off.
//
// Draft mode is a signed cookie Next sets for the browser that asks. Once it is set, getCopy lays
// the drafts over the published words, so the admin looks at the real page, rendered the real way,
// with the unpublished changes in it. Not a separate preview screen, which would be a second
// rendering of the site to keep in step with the first.
//
// ADMIN ONLY, checked here. The cookie's own signature stops anyone forging it, but nothing stops
// a signed-out visitor requesting this address, and handing them the cookie would put every
// unpublished change on their screen. The drafts table refuses them separately, so this is the
// outer of two locks rather than the only one.
//
// Where it sends them back to is checked as well: a redirect that takes any address it is given
// is an open redirect, and this one is reachable by anyone.
import { NextResponse, type NextRequest } from 'next/server';
import { draftMode } from 'next/headers';
import { isAdmin } from '@/lib/auth';
import { safeBack } from './safeBack';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const back = safeBack(searchParams.get('back'));
  const wanted = searchParams.get('on') === '1';

  if (!(await isAdmin())) {
    // Sent to the page they asked for, without the cookie. Nothing is said about why: a visitor
    // who pokes at this address learns only that it goes somewhere ordinary.
    return NextResponse.redirect(new URL(back, request.url));
  }

  const draft = await draftMode();
  if (wanted) draft.enable();
  else draft.disable();

  return NextResponse.redirect(new URL(back, request.url));
}
