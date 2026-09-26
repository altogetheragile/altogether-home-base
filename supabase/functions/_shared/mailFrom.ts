/** Who a site's email comes from.
 *
 *  This was written into both functions as `noreply@altogetheragile.com`. Resend refuses to send
 *  from a domain the account does not own, so on any other site every send failed at the API,
 *  and the caller throws the whole invocation away on purpose so a visitor is not shown a
 *  failure that is not theirs. The result was a site that saved every enquiry, told the visitor
 *  it had worked, and never told anybody else. It ran that way for a day.
 *
 *  So: MAIL_FROM if it is set, otherwise derived from this site's own address, and if there is
 *  no address either, nothing. Sending from somebody else's domain is never the right answer,
 *  and returning nothing lets the caller say so instead of failing in a way nobody sees.
 */
export function mailFrom(env: { get(key: string): string | undefined }): string | null {
  const given = env.get('MAIL_FROM')?.trim();
  if (given) return given;

  const company = env.get('COMPANY_NAME')?.trim() || 'This site';
  const site = env.get('SITE_URL')?.trim();
  if (!site) return null;

  try {
    // The bare domain, so www.herbusiness.com sends as noreply@herbusiness.com. Resend verifies
    // a domain, not a subdomain of it.
    const host = new URL(site).hostname.replace(/^www\./i, '');
    return host ? `${company} <noreply@${host}>` : null;
  } catch {
    return null;
  }
}
