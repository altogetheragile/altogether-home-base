import { colors as tokenColors, fonts } from './tokens';

// ============= Not ready yet, in both apps =============
//
// One component, because both apps serve pages a visitor can reach and a holding page that covers
// only one of them is not a holding page. The Site had this first; the App went on serving its
// tools to anybody who knew a URL while the front door said the site was being built.
//
// Presentational on purpose: it is handed a logo, a name, two sentences and an address, and each
// app works those out from its own settings. Nothing here reads a database, so nothing here can
// differ between the two.

export type HoldingLogo = { mode: 'image'; src: string } | { mode: 'wordmark'; text: string };

export function HoldingPage({
  logo, heading, body, email,
}: {
  logo: HoldingLogo;
  heading: string;
  body: string;
  email?: string | null;
}) {
  const address = email?.trim();
  return (
    <main
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        gap: 24, padding: '48px 24px',
        background: `var(--aa-sky-teal, ${tokenColors.skyTeal})`, fontFamily: fonts.sans,
      }}
    >
      {logo.mode === 'image' ? (
        <img src={logo.src} alt={heading} style={{ height: 44, width: 'auto' }} />
      ) : (
        <span
          style={{
            fontFamily: fonts.sans, fontWeight: 800, fontSize: 24,
            color: `var(--aa-deep-teal, ${tokenColors.deepTeal})`, letterSpacing: '-0.02em',
          }}
        >
          {logo.text}
        </span>
      )}

      {/* A heading read from the wrong place came back empty once, and an empty h1 renders as
          nothing at all: the live page was a logo, a button and silence between them. A default
          that cannot be reached is not a default, so there is one here too. */}
      <h1
        style={{
          fontFamily: fonts.serif, color: `var(--aa-deep-teal, ${tokenColors.deepTeal})`,
          fontWeight: 400, fontSize: 'clamp(30px, 6vw, 46px)', lineHeight: 1.15,
          margin: 0, maxWidth: 680,
        }}
      >
        {heading.trim() || 'Something is on its way'}
      </h1>

      {body.trim() && (
        <p style={{ color: `var(--aa-body, ${tokenColors.body})`, fontSize: 17, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
          {body}
        </p>
      )}

      {/* Somebody who needs them today should not have to wait for the site to be finished. */}
      {address && (
        <a
          href={`mailto:${address}`}
          style={{
            color: `var(--aa-deep-teal, ${tokenColors.deepTeal})`,
            background: `var(--aa-orange, ${tokenColors.orange})`,
            textDecoration: 'none', fontWeight: 700, fontSize: 15,
            padding: '13px 26px', borderRadius: 10,
          }}
        >
          {address}
        </a>
      )}
    </main>
  );
}
