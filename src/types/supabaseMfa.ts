/**
 * MFA-related type helpers for Supabase auth.
 *
 * The official `Factor` type from `@supabase/auth-js` does NOT include the
 * `totp` enrollment payload (QR code / secret / URI) that is present on
 * factors returned by `listFactors()` when the factor was recently enrolled
 * but not yet verified.  This file provides a narrow extension so we can
 * access those properties without `as any`.
 */

import type { Factor } from '@supabase/auth-js';

/**
 * A Factor that may still carry the TOTP enrollment payload
 * (qr_code, secret, uri) returned during enroll / listFactors.
 */
export interface FactorWithTotp extends Factor {
  /** Present on unverified TOTP factors returned by listFactors. */
  totp?: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

/**
 * Shape of the sign-in `data` returned by `signInWithPassword`.
 * When MFA is required the session may be null and `user.factors`
 * may contain factor hints.
 */
export interface SignInData {
  user: {
    id: string;
    factors?: Factor[];
    [key: string]: unknown;
  } | null;
  session: {
    access_token: string;
    [key: string]: unknown;
  } | null;
}

/**
 * Narrow type for an auth error that may carry MFA-related metadata.
 * Supabase's `AuthError` only guarantees `message`, `status`, and `name`.
 * Older client versions sometimes attached extra fields; this type allows
 * safe access without `as any`.
 */
export interface MfaAuthError {
  message: string;
  name?: string;
  status?: number;
  statusCode?: number;
  code?: string;
}
