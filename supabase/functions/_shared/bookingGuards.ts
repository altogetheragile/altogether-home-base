// Guards for the public booking endpoint.
//
// booking-create is unauthenticated and each successful call writes to a
// calendar, creates a Zoom meeting and sends mail from our domain. These are the
// cheap defences that stop it being a free relay: a honeypot, a spam sniff, and
// per-IP and per-email limits backed by booking_attempts.
//
// The spec's preferred control was holding the meeting until the guest clicks a
// verification link. That is Layer 2 work; capping per email per day is the
// fallback it names, and that is what this does.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/** Attempts allowed from one IP in an hour, successful or not. */
const MAX_PER_IP_PER_HOUR = 10;
/** Bookings allowed for one email address in a day. */
const MAX_PER_EMAIL_PER_DAY = 3;

export interface GuardResult {
  ok: boolean;
  /** Why it was refused. For the log, not for the caller. */
  reason?: string;
  /** What to tell the caller. Deliberately vague. */
  message?: string;
}

/**
 * SHA-256 of the caller's IP.
 *
 * Counting repeat callers does not require keeping a record of who visited the
 * booking page, so the address is hashed before it is stored.
 */
export async function hashIp(ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** The caller's IP, as far as the platform will tell us. */
export function callerIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Spam signals in free text. Two or more is a strong signal, matching the
 * threshold send-contact-email already uses.
 */
export function looksLikeSpam(text: string): boolean {
  if (!text) return false;

  // A booking note has no business carrying a link.
  if (/https?:\/\/[^\s]+|www\.[^\s]+/i.test(text)) return true;

  const phrases = [
    'sign up for free',
    'submit contact forms',
    'contact form submissions',
    'cold email',
    'at scale',
    'captcha solving',
    'rotating ip',
    'stealth browser',
    'per submission',
    'give it a try',
    'beats cold email',
    'seo services',
    'crypto',
  ];

  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p)).length >= 2;
}

/** Escapes user text before it goes anywhere near an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Records the attempt. Never throws: a broken log must not take booking down.
 *
 * The three outcomes are counted differently on purpose:
 *   'ok'      a booking was made. The only one the per-email daily cap counts.
 *   'blocked' a guard turned it away. Probing must not be free.
 *   'failed'  Zoom or Google let us down. Our fault, so it must not count
 *             towards the guest's daily cap - they would be locked out for a
 *             day over a booking they never got.
 *
 * All three count towards the per-IP hourly limit, which is what actually
 * stops someone hammering the endpoint.
 */
export async function recordAttempt(
  supabase: SupabaseClient,
  ipHash: string,
  email: string,
  outcome: 'ok' | 'blocked' | 'failed',
): Promise<void> {
  try {
    await supabase.from('booking_attempts').insert({ ip_hash: ipHash, email, outcome });
  } catch (e) {
    console.error('[booking-guards] could not record attempt:', e);
  }
}

/**
 * Runs every guard. Returns ok:false with a vague message when one trips.
 *
 * Unlike the AI rate limiter, this fails CLOSED. That one protects a paid API
 * and failing open only costs money; this one protects a calendar and an email
 * domain, where failing open means a bot can fill the diary and relay mail. If
 * the counting query is broken, refusing is the safer answer.
 */
export async function checkBookingGuards(
  supabase: SupabaseClient,
  args: { ipHash: string; email: string; name: string; notes?: string | null; honeypot?: string | null },
): Promise<GuardResult> {
  // 1. Honeypot. A real person never sees the field, so anything in it is a bot.
  if (args.honeypot) {
    return { ok: false, reason: 'honeypot', message: 'Sorry, that booking could not be completed.' };
  }

  // 2. Shape.
  if (!args.email || !EMAIL_RE.test(args.email)) {
    return { ok: false, reason: 'bad-email', message: 'Please enter a valid email address.' };
  }
  if (!args.name || args.name.trim().length < 2) {
    return { ok: false, reason: 'bad-name', message: 'Please enter your name.' };
  }
  if (args.name.length > 120 || (args.notes?.length ?? 0) > 2000) {
    return { ok: false, reason: 'too-long', message: 'That is longer than we can accept.' };
  }

  // 3. Spam signals.
  if (looksLikeSpam(args.notes ?? '') || looksLikeSpam(args.name)) {
    return { ok: false, reason: 'spam', message: 'Sorry, that booking could not be completed.' };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const { count: ipCount, error: ipError } = await supabase
      .from('booking_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', args.ipHash)
      .gte('created_at', hourAgo);

    if (ipError) throw ipError;
    if ((ipCount ?? 0) >= MAX_PER_IP_PER_HOUR) {
      return { ok: false, reason: 'ip-limit', message: 'Too many attempts. Please try again later.' };
    }

    // Only 'ok' counts here: a booking we failed to complete is not one the
    // guest made, and must not be held against them.
    const { count: emailCount, error: emailError } = await supabase
      .from('booking_attempts')
      .select('id', { count: 'exact', head: true })
      .ilike('email', args.email)
      .eq('outcome', 'ok')
      .gte('created_at', dayAgo);

    if (emailError) throw emailError;
    if ((emailCount ?? 0) >= MAX_PER_EMAIL_PER_DAY) {
      return {
        ok: false,
        reason: 'email-limit',
        message: 'You have already booked today. Please email us if you need another session.',
      };
    }
  } catch (e) {
    console.error('[booking-guards] rate-limit check failed, refusing:', e);
    return { ok: false, reason: 'check-failed', message: 'Booking is temporarily unavailable. Please try again shortly.' };
  }

  return { ok: true };
}
