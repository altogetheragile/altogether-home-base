import { useSiteSettings } from '@/hooks/useSiteSettings';
import { bookingHref } from '@/config/featureFlags';

/**
 * Where this page's "Book a Chemistry Session" button should point.
 *
 * The booking route is behind the show_bookings site setting and renders
 * "Page Not Found" when that is off, so the href has to follow the flag rather
 * than being a constant.
 *
 * While the settings query is in flight this returns the contact page. That is
 * the safe direction: the contact page always works, whereas an optimistic link
 * to /book/:slug would be a dead end whenever the flag is off. In practice the
 * window is not reachable, because Navigation renders on every one of these
 * pages and shares the same react-query cache key, so the answer is already
 * there by the time anything is clickable.
 */
export function useBookingHref(): string {
  const { settings } = useSiteSettings();
  return bookingHref(settings?.show_bookings);
}
