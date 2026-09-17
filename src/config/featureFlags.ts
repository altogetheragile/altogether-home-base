/**
 * Centralized feature flags configuration
 *
 * Feature flags control the visibility of major application features.
 * These can be toggled via environment variables without code changes.
 */

/**
 * Canonical site URL used for SEO canonical link tags.
 */
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://altogetheragile.com';

/**
 * Shared booking and contact constants.
 *
 * The booking page is our own now, not Calendly, so every link to it is
 * internal: same tab, no target="_blank".
 *
 * These mirror apps/web/src/lib/booking.ts deliberately. The two apps cannot
 * import from each other, so the rule is written twice rather than drifting
 * apart - if you change one, change the other.
 */

/** The booking page, when bookings are switched on. */
export const BOOKING_PATH = '/book/chemistry-session';

/** Where to send people when they are not. */
export const BOOKING_FALLBACK = '/contact';

export const CONTACT_EMAIL = 'info@altogetheragile.com';

/**
 * The href for a booking button, given the `show_bookings` site setting.
 *
 * With bookings off, SiteSettingsRouteGuard renders "Page Not Found" for
 * /book/:slug, so a button pointing at it would be a dead end. The contact page
 * keeps the call to action working whatever the flag says - which matters
 * because the flag is how the feature gets turned off in a hurry.
 *
 * Components should call useBookingHref() rather than this directly.
 */
export function bookingHref(showBookings: boolean | null | undefined): string {
  return showBookings ? BOOKING_PATH : BOOKING_FALLBACK;
}

export const featureFlags = {
  /**
   * Enable admin routes and functionality
   * Requires admin role and AAL2 authentication
   */
  adminRoutes: import.meta.env.VITE_ENABLE_ADMIN !== 'false',

  /**
   * Enable protected project routes (Canvas, BMC)
   * Requires user authentication
   */
  protectedProjects: import.meta.env.VITE_ENABLE_PROJECTS !== 'false',

  /**
   * Enable dynamic CMS pages
   * Allows rendering pages from the database
   */
  dynamicPages: import.meta.env.VITE_ENABLE_CMS !== 'false',
  
  /**
   * Enable beta features for testing
   */
  betaFeatures: import.meta.env.VITE_BETA_FEATURES === 'true',
} as const;

export type FeatureFlag = keyof typeof featureFlags;
