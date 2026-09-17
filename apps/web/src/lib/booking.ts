/**
 * Where the "Book a chemistry session" buttons point.
 *
 * One place, because this used to be a Calendly URL copy-pasted into six files
 * and changing it meant finding all six.
 *
 * The booking page itself lives in the Vite app, not here - `/book/:slug` is not
 * in this app's cut-over list. So these are plain `<a href>` links, never
 * next/link: Next would try to route `/book/...` client-side, find nothing, and
 * 404. A full browser navigation lets Vercel's rewrite do its job.
 */

/** The booking page, when bookings are switched on. */
export const BOOKING_PATH = '/book/chemistry-session';

/** Where to send people when they are not. */
export const BOOKING_FALLBACK = '/contact';

/**
 * The href for a booking button, given the `show_bookings` site setting.
 *
 * With bookings off the route 404s, so a button pointing at it would be a dead
 * end. Falling back to the contact page keeps the call to action working
 * whatever the flag says - which matters because the flag is how the feature
 * gets turned off in a hurry.
 */
export function bookingHref(showBookings: boolean | null | undefined): string {
  return showBookings ? BOOKING_PATH : BOOKING_FALLBACK;
}
