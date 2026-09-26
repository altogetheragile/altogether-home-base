import { moduleIsOn } from '@altogether/ui/modules';
import { BOOKING_PATH, BOOKING_FALLBACK } from '@/lib/booking';

// ============= A button points somewhere that exists =============
//
// The label on a call to action was editable and its destination was not. So a site with Events
// switched off kept a hero button reading "Browse Events" pointing at /events, which answers Not
// Found to everybody but an administrator. The main action on the home page was a dead link, and
// nothing in the editor could move it.
//
// The About page already did this properly, hiding its events link when the module is off. This
// is that idea made into something a page can use and an owner can steer.
//
// The rule: a target whose module is switched off is not used. The next live one is, and there
// is always a last one that cannot be off, so this can never hand back a dead address. That is
// the same shape as bookingHref, which has sent people to /contact when bookings are off since
// long before this existed.

export type CtaTarget = 'events' | 'coaching' | 'contact' | 'booking' | 'about' | 'home';

type Settings = Record<string, unknown>;

/** Where each target lives, and which module has to be on for it to answer. */
const TARGETS: Record<CtaTarget, { href: string; needs?: string }> = {
  events: { href: '/events', needs: 'events' },
  coaching: { href: '/coaching', needs: 'coaching' },
  contact: { href: '/contact', needs: 'contact' },
  about: { href: '/about', needs: 'about' },
  // Bookings has a fallback of its own, older than this, and it is still the right one.
  booking: { href: BOOKING_PATH, needs: 'bookings' },
  // The one that is always there. Nothing switches off the front door.
  home: { href: '/' },
};

/** Tried in turn when the chosen target is switched off. Ends somewhere that cannot be. */
const INSTEAD: CtaTarget[] = ['contact', 'coaching', 'about', 'home'];

const live = (target: CtaTarget, settings: Settings): string | null => {
  const at = TARGETS[target];
  if (!at) return null;
  if (at.needs && !moduleIsOn(at.needs, settings)) return null;
  return at.href;
};

/** The address a call to action should point at, given what this site has switched on.
 *
 *  Never null and never a page that answers Not Found. A chosen target that is switched off
 *  falls through rather than being rendered as a dead link, because a button that goes nowhere
 *  is worse than a button that goes somewhere slightly different. */
export function ctaHref(target: string | null | undefined, settings: Settings): string {
  const wanted = (target?.trim() || 'events') as CtaTarget;
  if (wanted === 'booking' && !moduleIsOn('bookings', settings)) return BOOKING_FALLBACK;
  return live(wanted, settings) ?? INSTEAD.map((t) => live(t, settings)).find(Boolean) ?? '/';
}

/** Whether the target somebody chose is the one they will actually get.
 *
 *  A page uses this to say so in the editor rather than silently sending people elsewhere: the
 *  words on the button are the owner's, and "Browse Events" pointing at the contact page is a
 *  working link that still says the wrong thing. */
export function ctaWasRedirected(target: string | null | undefined, settings: Settings): boolean {
  const wanted = (target?.trim() || 'events') as CtaTarget;
  if (wanted === 'booking') return !moduleIsOn('bookings', settings);
  return live(wanted, settings) === null;
}
