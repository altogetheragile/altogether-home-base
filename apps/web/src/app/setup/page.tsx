import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteSettings } from '@/lib/site-settings';
import { isAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { REGISTRIES } from '@/lib/copy';
import { COPY_ROUTES, MODULE_FOR_PATH } from '@/lib/copy/routes';
import { moduleIsShown, type GatedModule } from '@/lib/module-gate';
import { colors as p } from '@/lib/brand';
import {
  identityChecks, brandChecks, founderChecks, wordChecks, legalChecks, outsideTheApp,
  progress, type Section, type Check,
} from '@/lib/setup/checks';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { headlineKeys } from '@/lib/setup/steps';

// ============= Setting up this site =============
//
// Admin only, and 404 to everybody else: this says what a site has not finished deciding, which
// is nobody's business but the owner's.
//
// Deliberately not indexed and deliberately not linked from the menu. You reach it from the
// editor, which is already on every page and already only renders for an admin.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** How many of a page's copy keys have been written, against how many there are.
 *
 *  Saved rows rather than rendered words, because a page showing the wording this software
 *  shipped with looks finished and is not. */
async function writtenByPage(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_copy').select('page, value');
    const out: Record<string, number> = {};
    for (const row of (data ?? []) as { page: string; value: string }[]) {
      if (!row.value?.trim()) continue;
      out[row.page] = (out[row.page] ?? 0) + 1;
    }
    return out;
  } catch {
    return {};
  }
}

const Dot = ({ status }: { status: Check['status'] }) => {
  const colour = status === 'done' ? '#1A9090' : status === 'todo' ? p.orange : '#9AA5AB';
  const glyph = status === 'done' ? '✓' : status === 'todo' ? '!' : '–';
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: colour, color: '#fff',
        fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}
    >
      {glyph}
    </span>
  );
};

const wordFor = (status: Check['status']) =>
  status === 'done' ? 'Done' : status === 'todo' ? 'Still to do' : 'Optional';

function CheckRow({ check }: { check: Check }) {
  return (
    <li style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <Dot status={check.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10 }}>
          <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 15 }}>{check.title}</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: check.status === 'todo' ? p.orange : p.muted }}>
            {wordFor(check.status)}
          </span>
        </div>
        <p style={{ color: p.body, fontSize: 14, lineHeight: 1.65, margin: '4px 0 0' }}>{check.detail}</p>
        {check.where && (
          <a href={check.where.href} style={{ display: 'inline-block', marginTop: 8, color: '#1A9090', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            {check.where.label} →
          </a>
        )}
      </div>
    </li>
  );
}

export default async function SetupPage() {
  if (!(await isAdmin())) notFound();

  const [settings, written] = await Promise.all([getSiteSettings(), writtenByPage()]);

  // Only the pages this site actually shows. A checklist that asked somebody to write the words
  // on a page they had switched off would be asking for work with no purpose.
  const pagesOn = Object.entries(COPY_ROUTES)
    .filter(([href]) => {
      // Not named `module`: Next refuses that identifier, and only the build says so.
      const gate = MODULE_FOR_PATH[href];
      return !gate || moduleIsShown(gate as GatedModule, settings);
    })
    .map(([href, page]) => ({
      page,
      href: `${href}?edit=${page}`,
      label: REGISTRIES.find((r) => r.page === page)?.label ?? page,
    }));

  const totals = Object.fromEntries(
    REGISTRIES.map((r) => [
      r.page,
      // Only the copy rows. A switch or a brand key is counted in its own section.
      Object.values(r.entries).filter((e) => !e.store || e.store === 'copy').length,
    ]),
  );

  const sections: Section[] = [
    {
      title: 'Who this site belongs to',
      blurb: 'The name, the sentence under it, and how somebody reaches you. These reach the menu, the footer, the browser tab and every search result.',
      checks: identityChecks(settings),
    },
    {
      title: 'What it looks like',
      blurb: 'Colours, logo and the picture that shows when somebody posts a link to this site.',
      checks: brandChecks(settings),
    },
    {
      title: 'Whose site it is',
      blurb: 'Some sites are a person and some are a company. Either is a complete answer.',
      checks: founderChecks(settings),
    },
    {
      title: 'The words on each page',
      blurb: 'Every page still showing the wording this software shipped with is describing somebody else’s business. These are the pages you have switched on.',
      checks: wordChecks(pagesOn, written, totals),
    },
    {
      title: 'The pages that are somebody else’s',
      blurb: 'Legal text is the one thing here that cannot be adapted, only replaced.',
      checks: legalChecks(settings),
    },
  ];

  const { done, todo, optional } = progress(sections);
  const outside = outsideTheApp();

  // What the wizard needs, worked out here because this is where the settings and the registries
  // already are. A page with a visibility switch can be turned off; a page that is on has words.
  const modulePages = Object.entries(COPY_ROUTES)
    .filter(([href]) => MODULE_FOR_PATH[href])
    .map(([, page]) => ({
      page,
      label: REGISTRIES.find((r) => r.page === page)?.label ?? page,
      key: `${page}.visible`,
    }))
    .filter(({ page, key }) => REGISTRIES.find((r) => r.page === page)?.entries[key]);

  const wordPages = pagesOn.map(({ page, href, label }) => ({
    page,
    href,
    label,
    keys: headlineKeys(page, Object.keys(REGISTRIES.find((r) => r.page === page)?.entries ?? {})),
  }));

  return (
    <div style={{ background: p.skyTeal, minHeight: '70vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 72px' }}>
        <div style={{ color: p.orange, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Only you can see this
        </div>
        <h1 style={{ color: p.deepTeal, fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>
          Setting up this site
        </h1>
        <p style={{ color: p.body, fontSize: 15, lineHeight: 1.75, margin: '0 0 8px' }}>
          Five steps, in the order that makes sense to answer them. Each one saves as you go, so
          you can stop anywhere and pick it up later, and nothing here is compulsory. Everything
          can also be changed from the page it appears on, for the rest of this site&rsquo;s life.
        </p>

        <SetupWizard modulePages={modulePages} wordPages={wordPages} />

        <h2 style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800, margin: '44px 0 6px' }}>
          Where this site has got to
        </h2>
        <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
          Read from what is actually saved rather than from which steps you clicked through, so it
          is as true in a year as it is today.{' '}
          {todo === 0
            ? 'Nothing is outstanding: the optional items are choices rather than gaps.'
            : `${todo} ${todo === 1 ? 'thing still needs' : 'things still need'} deciding, ${done} ${done === 1 ? 'is' : 'are'} done, and ${optional} ${optional === 1 ? 'is' : 'are'} optional.`}
        </p>

        {sections.map((section) => (
          <section key={section.title} style={{ background: p.white, borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
            <h2 style={{ color: p.deepTeal, fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>{section.title}</h2>
            <p style={{ color: p.muted, fontSize: 13.5, lineHeight: 1.65, margin: '0 0 8px' }}>{section.blurb}</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {section.checks.map((check) => <CheckRow key={check.id} check={check} />)}
            </ul>
          </section>
        ))}

        <section style={{ background: p.deepTeal, borderRadius: 16, padding: '24px 28px' }}>
          <h2 style={{ color: '#fff', fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>
            Four things this page cannot do for you
          </h2>
          <p style={{ color: p.lightTeal, fontSize: 13.5, lineHeight: 1.65, margin: '0 0 12px' }}>
            These live outside the site, so nothing here can check them. They are listed rather
            than ticked on purpose: an unticked box you have already done costs you a glance, and
            a ticked box you have not costs you a site that does not work.
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {outside.map((check) => (
              <li key={check.id} style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{check.title}</div>
                <p style={{ color: p.lightTeal, fontSize: 13.5, lineHeight: 1.65, margin: '4px 0 0' }}>{check.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
