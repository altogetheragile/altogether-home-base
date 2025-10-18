/**
 * Centralized feature flags configuration
 * 
 * Feature flags control the visibility of major application features.
 * These can be toggled via environment variables without code changes.
 */

export const featureFlags = {
  /**
   * Enable admin routes and functionality
   * Requires admin role and AAL2 authentication
   */
  adminRoutes: import.meta.env.VITE_ENABLE_ADMIN ?? true,
  
  /**
   * Enable protected project routes (Canvas, BMC)
   * Requires user authentication
   */
  protectedProjects: import.meta.env.VITE_ENABLE_PROJECTS ?? true,
  
  /**
   * Enable dynamic CMS pages
   * Allows rendering pages from the database
   */
  dynamicPages: import.meta.env.VITE_ENABLE_CMS ?? true,
  
  /**
   * Enable beta features for testing
   */
  betaFeatures: import.meta.env.VITE_BETA_FEATURES ?? false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
