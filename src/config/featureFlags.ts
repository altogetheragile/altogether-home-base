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
 * BOOKING_URL is our own page now, not Calendly, so every link to it is
 * internal: same tab, no target="_blank". The route is behind the show_bookings
 * site setting and 404s when that is off.
 */
export const BOOKING_URL = '/book/chemistry-session';
export const CONTACT_EMAIL = 'info@altogetheragile.com';

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
