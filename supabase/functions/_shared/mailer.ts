import { Resend } from 'npm:resend@2.0.0';

/** The mail client, made when it is needed rather than when the file is read.
 *
 *  Both functions built it at module load: `const resend = new Resend(Deno.env.get(...))`. The
 *  Resend constructor throws without a key, so a project that had not been given one crashed the
 *  function before a line of the handler ran. Every request answered 500, including the preflight
 *  a browser makes before calling it, so the function was deployed, listed in the dashboard, and
 *  broken in a way that looked like not being deployed at all.
 *
 *  Null when there is no key, so the caller can say which of the two things is wrong. */
export function mailer(env: { get(key: string): string | undefined }): Resend | null {
  const key = env.get('RESEND_API_KEY')?.trim();
  return key ? new Resend(key) : null;
}
