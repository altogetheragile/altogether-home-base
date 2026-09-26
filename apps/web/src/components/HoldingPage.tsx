import { colors as p, fonts } from '@/lib/brand';
import { SiteLogo } from '@/components/SiteLogo';
import type { SiteSettings } from '@/lib/site-settings';

// ============= Not ready yet =============
//
// A site is public the moment its domain resolves, which is long before anybody has written its
// words. The alternative to this was taking the domain down, which also takes down the editor
// the site is being finished in.
//
// Deliberately plain, and deliberately not a placeholder: it uses the site's own logo, name,
// colours and type, so the thing a visitor lands on looks like the business rather than like a
// building site. It says one thing and offers one way to get in touch, and nothing else, because
// everything else is the part that is not ready.

export function HoldingPage({
  settings, heading, body,
}: {
  settings: SiteSettings;
  heading: string;
  body: string;
}) {
  const email = settings.contact_email?.trim();
  return (
    <main
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        gap: 24, padding: '48px 24px', background: p.skyTeal, fontFamily: fonts.sans,
      }}
    >
      <SiteLogo brand={settings.brand} companyName={settings.company_name} height={44} />
      <h1
        style={{
          fontFamily: fonts.serif, color: p.deepTeal, fontWeight: 400,
          fontSize: 'clamp(30px, 6vw, 46px)', lineHeight: 1.15, margin: 0, maxWidth: 680,
        }}
      >
        {heading}
      </h1>
      {body.trim() && (
        <p style={{ color: p.body, fontSize: 17, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>{body}</p>
      )}
      {/* Somebody who needs them today should not have to wait for the site to be finished. */}
      {email && (
        <a
          href={`mailto:${email}`}
          style={{
            color: p.deepTeal, background: p.orange, textDecoration: 'none',
            fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 10,
          }}
        >
          {email}
        </a>
      )}
    </main>
  );
}
