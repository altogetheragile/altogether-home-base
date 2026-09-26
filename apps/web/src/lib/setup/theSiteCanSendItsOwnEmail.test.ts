import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { enquiryEmailCheck } from './checks';
import { mailFrom } from '../../../../../supabase/functions/_shared/mailFrom';

// An enquiry is saved and then a function is asked to send the email, fire and forget, because
// the message is safe either way and a visitor should not be shown a failure that is not theirs.
// The cost is silence: where the function was never deployed, somebody reads "Message Sent" and
// nobody is ever told. A live site ran that way for a day.

const fetchReturning = (res: Partial<Response> | Error) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    if (res instanceof Error) throw res;
    return res as Response;
  });

describe('the site can send its own email', () => {
  // The check asks this deployment's own project, so there has to be one to ask.
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
  afterEach(() => vi.restoreAllMocks());

  it('says it is set up when the function answers', async () => {
    fetchReturning({ ok: true });
    const check = await enquiryEmailCheck();
    expect(check.status).toBe('done');
    // And still says what cannot be checked from here, rather than implying all is well.
    expect(check.detail).toMatch(/RESEND_API_KEY/);
    expect(check.detail).toMatch(/MAIL_FROM/);
  });

  it('says plainly what is happening when the function is not there', async () => {
    fetchReturning({ ok: false, status: 404 });
    const check = await enquiryEmailCheck();
    expect(check.status).toBe('todo');
    expect(check.detail).toMatch(/nobody is told/i);
    // The confusing part, said out loud: the visitor is told it worked, because it did.
    expect(check.detail).toMatch(/Message Sent/);
  });

  it('tells a function that is missing from one that cannot start', async () => {
    // A function with no RESEND_API_KEY used to crash before its handler ran, so it answered its
    // own preflight with a 500 and looked exactly like a function nobody had deployed. Saying
    // "deploy it" then sends somebody to redeploy what is already there.
    fetchReturning({ ok: false, status: 500 });
    const check = await enquiryEmailCheck();
    expect(check.detail).toMatch(/RESEND_API_KEY/);
    expect(check.detail).not.toMatch(/is not deployed/);
  });

  it('calls OPTIONS, because asking properly would send somebody an email', async () => {
    const spy = fetchReturning({ ok: true });
    await enquiryEmailCheck();
    const [, init] = spy.mock.calls[0];
    expect((init as RequestInit).method).toBe('OPTIONS');
  });

  it('reports unknown rather than broken when it cannot reach the project', async () => {
    // "Your email is broken" is a bad thing to say on the strength of one timed-out request.
    fetchReturning(new Error('network'));
    const check = await enquiryEmailCheck();
    expect(check.status).toBe('optional');
    expect(check.detail).toMatch(/unknown/i);
  });
});

describe('the functions that send email', () => {
  const contact = readFileSync('../../supabase/functions/send-contact-email/index.ts', 'utf8');
  const booking = readFileSync('../../supabase/functions/booking-create/index.ts', 'utf8');

  it('never writes this repository’s address into a send', () => {
    // Resend refuses a domain the account does not own, so a hardcoded sender fails every send
    // on every other site, at the API, with nobody to see it.
    for (const [name, src] of [['send-contact-email', contact], ['booking-create', booking]] as const) {
      // Both shapes: `from: <value>` and the `from` shorthand, whose value is the const above it.
      const sends = [
        ...[...src.matchAll(/\bfrom:\s*([^\n,]+)/g)].map((m) => m[1]),
        ...[...src.matchAll(/\bconst FROM\s*=\s*([^\n;]+)/g)].map((m) => m[1]),
        ...[...src.matchAll(/\bconst from\s*=\s*([^\n;]+)/g)].map((m) => m[1]),
      ];
      expect(sends.length, `${name} sends nothing`).toBeGreaterThan(0);
      for (const value of sends) {
        expect(value, `${name} sends from a written-in address`).not.toContain('altogetheragile.com');
      }
    }
  });

  it('never builds the mail client when the file is read', () => {
    // The Resend constructor throws without a key, so a project that had not been given one
    // crashed the function before a line of the handler ran: deployed, listed in the dashboard,
    // and answering 500 to everything including its own preflight.
    for (const [name, src] of [['send-contact-email', contact], ['booking-create', booking]] as const) {
      expect(src, `${name} builds Resend at module load`).not.toMatch(/^const resend = new Resend/m);
      expect(src, `${name} does not use the shared mailer`).toContain('mailer(Deno.env)');
    }
  });

  it('reads the same variable in both, so one setting covers the site', () => {
    for (const [name, src] of [['send-contact-email', contact], ['booking-create', booking]] as const) {
      expect(src, `${name} does not read MAIL_FROM`).toContain('MAIL_FROM');
    }
  });
});

describe('who a site\u2019s email comes from', () => {
  const env = (vars: Record<string, string>) => ({ get: (k: string) => vars[k] });

  it('uses what was set, whatever else is around', () => {
    expect(mailFrom(env({ MAIL_FROM: 'Her <hi@herbusiness.com>', SITE_URL: 'https://other.com' })))
      .toBe('Her <hi@herbusiness.com>');
  });

  it('derives it from this site\u2019s own address when nothing was set', () => {
    expect(mailFrom(env({ COMPANY_NAME: 'Bramble & Fern', SITE_URL: 'https://brambleandfern.com' })))
      .toBe('Bramble & Fern <noreply@brambleandfern.com>');
  });

  it('drops www, because Resend verifies a domain and not a subdomain of it', () => {
    expect(mailFrom(env({ COMPANY_NAME: 'X', SITE_URL: 'https://www.herbusiness.com/' })))
      .toBe('X <noreply@herbusiness.com>');
  });

  it('sends from nowhere rather than from somebody else\u2019s domain', () => {
    // The whole defect: a second site sent as noreply@altogetheragile.com, Resend refused it,
    // and the caller discarded the failure. Nothing is better than another site's address.
    expect(mailFrom(env({}))).toBeNull();
    expect(mailFrom(env({ COMPANY_NAME: 'X' }))).toBeNull();
    expect(mailFrom(env({ SITE_URL: 'not a url' }))).toBeNull();
  });
});
