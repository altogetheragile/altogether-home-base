import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getCopy, items } from '@/lib/copy';
import { getSiteSettings } from '@/lib/site-settings';
import { colors as p } from '@/lib/brand';
import { statusOf, isThisSite, type ManagedSite, type SiteStatus } from '@/lib/sites/managed';
import { SITE_URL } from '@/lib/seo';

// ============= Every site you look after, in one place =============
//
// Admin only, 404 to everybody else, and holding no credentials for any site listed. What it
// knows is what each site already tells the public: whether it is up, whether it can reach its
// database, and what it calls itself. Everything that writes is a link into that site's own
// editor, where that site's own sign-in decides what you may do.
//
// That is the whole design. A page that could edit another site would need that site's keys kept
// here, and an admin account on this site would become the key to every site on the list.

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

const Dot = ({ of }: { of: SiteStatus }) => (
  <span
    aria-hidden
    style={{
      width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 7,
      background: of.healthy ? '#1A9090' : of.reachable ? p.orange : '#C0392B',
    }}
  />
);

const word = (of: SiteStatus) => (of.healthy ? 'Up' : of.reachable ? 'Up, with a problem' : 'Not answering');

export default async function SitesPage() {
  if (!(await isAdmin())) notFound();

  const [t, settings] = await Promise.all([getCopy('site'), getSiteSettings()]);
  const listed = items<ManagedSite>(t('site.managed'), ['name', 'domain']);

  // This site belongs on the list whether or not somebody added it, so the page is useful on the
  // day it is opened rather than after somebody has filled a box in.
  const self: ManagedSite = {
    name: settings.company_name?.trim() || 'This site',
    domain: SITE_URL,
    note: 'The one you are on',
  };
  const all = listed.some((s) => isThisSite(s.domain, SITE_URL)) ? listed : [self, ...listed];

  const statuses = await Promise.all(all.map((s) => statusOf(s)));

  return (
    <div style={{ background: p.skyTeal, minHeight: '70vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 72px' }}>
        <div style={{ color: p.orange, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Only you can see this
        </div>
        <h1 style={{ color: p.deepTeal, fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>
          Sites you look after
        </h1>
        <p style={{ color: p.body, fontSize: 15, lineHeight: 1.75, margin: '0 0 6px' }}>
          Each one is its own site with its own database and its own sign-in. This page knows only
          what they tell anybody who asks: whether they are up, and what they call themselves.
        </p>
        <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.7, margin: '0 0 32px' }}>
          Nothing here holds their keys. Editing happens on the site being edited, which is what
          makes it something its owner can take back.
        </p>

        {statuses.map((s) => (
          <section key={s.site.domain} style={{ background: p.white, borderRadius: 16, padding: '22px 26px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Dot of={s} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: p.deepTeal, fontWeight: 800, fontSize: 17 }}>{s.site.name}</span>
                  <span style={{ color: p.muted, fontSize: 13 }}>{s.site.domain.replace(/^https?:\/\//, '')}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: s.healthy ? '#1A9090' : p.orange }}>
                    {word(s)}
                  </span>
                </div>

                {s.trouble && (
                  <p style={{ color: '#8A4B2A', fontSize: 13.5, lineHeight: 1.6, margin: '6px 0 0', background: '#FDF3EC', border: '1px solid #F0D5C0', borderRadius: 8, padding: '8px 10px' }}>
                    {s.trouble}
                  </p>
                )}

                {/* The quickest way to spot a site nobody has set up: it is still calling itself
                    what this software ships with. */}
                {s.callsItself && (
                  <p style={{ color: p.muted, fontSize: 13, margin: '6px 0 0' }}>
                    Calls itself <span style={{ color: p.body }}>{s.callsItself}</span>
                  </p>
                )}
                {s.site.note && <p style={{ color: p.muted, fontSize: 13, margin: '4px 0 0', fontStyle: 'italic' }}>{s.site.note}</p>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {s.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      style={{
                        border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, padding: '6px 14px',
                        fontSize: 13, fontWeight: 600, color: p.deepTeal, textDecoration: 'none', background: p.white,
                      }}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <p style={{ color: p.muted, fontSize: 13.5, lineHeight: 1.7, marginTop: 24 }}>
          Add a site from the editor on any page, under <strong>This Site</strong>, in
          {' '}<em>Sites you look after</em>. A new one is stood up with{' '}
          <code style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 4 }}>node scripts/new-site.mjs</code>.
        </p>
      </div>
    </div>
  );
}
