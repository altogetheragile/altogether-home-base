import { describe, it, expect } from 'vitest';
import {
  identityChecks, brandChecks, founderChecks, wordChecks, legalChecks, outsideTheApp,
  progress, SHIPPED_DEFAULTS,
} from './checks';
import type { SiteSettings } from '@/lib/site-settings';

// A checklist is only worth having if a tick means something. The failure that matters is not a
// missing item, it is an item that says done when it is not: somebody reads "Business name: done"
// on a site still called AltogetherAgile, believes it, and launches.
//
// So these are mostly about what must NOT be ticked.

const brandNew: SiteSettings = {
  company_name: SHIPPED_DEFAULTS.company_name,
  company_description: SHIPPED_DEFAULTS.company_description,
  copyright_text: SHIPPED_DEFAULTS.copyright_text,
};

const status = (checks: { id: string; status: string }[], id: string) =>
  checks.find((c) => c.id === id)?.status;

describe('a site nobody has touched', () => {
  it('does not call the inherited name a decision', () => {
    // The database ships company_name as AltogetherAgile. Filled in, and not chosen.
    expect(status(identityChecks(brandNew), 'company-name')).toBe('todo');
  });

  it('does not call the inherited description a decision either', () => {
    expect(status(identityChecks(brandNew), 'company-description')).toBe('todo');
  });

  it('counts a name somebody actually chose', () => {
    expect(status(identityChecks({ ...brandNew, company_name: 'Bramble & Fern' }), 'company-name')).toBe('done');
  });

  it('treats a missing contact email as outstanding, not optional', () => {
    // A site with no way to reach anybody is not a matter of taste.
    expect(status(identityChecks(brandNew), 'contact-email')).toBe('todo');
    expect(status(identityChecks({ ...brandNew, contact_email: 'hi@example.com' }), 'contact-email')).toBe('done');
  });

  it('notes the shipped palette without calling it a fault', () => {
    // This repository is itself a site running the shipped palette, correctly. A checklist that
    // told its own author he had not chosen his colours would be one he learned to skim.
    expect(status(brandChecks(brandNew), 'colours')).toBe('optional');
    expect(brandChecks(brandNew).find((c) => c.id === 'colours')?.detail).toMatch(/if those are not your colours/i);
    expect(status(brandChecks({ ...brandNew, brand: { colors: { orange: '#B5651D' } } }), 'colours')).toBe('done');
  });
});

describe('the things that are choices rather than gaps', () => {
  it('does not nag about a missing logo', () => {
    // Empty means the name renders as a wordmark, which is a normal thing to want.
    expect(status(brandChecks(brandNew), 'logo')).toBe('optional');
  });

  it('does not nag about the copyright line', () => {
    expect(status(identityChecks(brandNew), 'copyright')).toBe('optional');
  });

  it('accepts a site that is a company rather than a person', () => {
    // Off is a complete answer, not an unfinished one.
    expect(status(founderChecks({ show_founder: false }), 'founder')).toBe('done');
  });

  it('flags a founder switched on with nobody named', () => {
    expect(status(founderChecks({ show_founder: true }), 'founder')).toBe('todo');
    expect(status(founderChecks({ show_founder: true, founder_name: 'Someone' }), 'founder')).toBe('done');
  });
});

describe('the legal pages', () => {
  it('treats unpublished as the safe state', () => {
    expect(status(legalChecks({ show_legal: false }), 'legal')).toBe('done');
  });

  it('asks you to check them once they are published', () => {
    // The shipped text is another company's, with their registration number in it. Published is
    // the state worth a second look, which is the opposite way round from most checks here.
    const check = legalChecks({ show_legal: true })[0];
    expect(check.status).toBe('optional');
    expect(check.detail).toMatch(/another company/i);
  });
});

describe('the words on each page', () => {
  const pages = [{ page: 'about', label: 'About', href: '/about?edit=about' }];

  it('calls a page nobody has edited outstanding', () => {
    expect(status(wordChecks(pages, {}, { about: 12 }), 'words-about')).toBe('todo');
  });

  it('calls a page part way through neither done nor outstanding', () => {
    expect(status(wordChecks(pages, { about: 5 }, { about: 12 }), 'words-about')).toBe('optional');
  });

  it('calls a page fully rewritten done', () => {
    expect(status(wordChecks(pages, { about: 12 }, { about: 12 }), 'words-about')).toBe('done');
  });

  it('says how far along in words rather than as a fraction nobody reads', () => {
    expect(wordChecks(pages, { about: 5 }, { about: 12 })[0].detail).toBe('5 of 12 pieces rewritten.');
  });
});

describe('the steps outside the application', () => {
  it('never claims any of them are done', () => {
    // Nothing here can be read from the database. A ticked box somebody has not done costs them
    // a site that does not work, which is worse than an unticked one they have.
    expect(outsideTheApp().every((c) => c.status === 'todo')).toBe(true);
  });

  it('names the security policy step, which is the one with no error message', () => {
    const csp = outsideTheApp().find((c) => c.id === 'csp-host');
    expect(csp?.detail).toMatch(/SUPABASE_CSP_HOSTS/);
  });

  it('offers nowhere to click, because none of it is in this app', () => {
    expect(outsideTheApp().every((c) => !c.where)).toBe(true);
  });
});

describe('the count at the top', () => {
  it('adds up to the number of checks', () => {
    const sections = [
      { title: 'a', blurb: '', checks: identityChecks(brandNew) },
      { title: 'b', blurb: '', checks: brandChecks(brandNew) },
    ];
    const { done, todo, optional } = progress(sections);
    expect(done + todo + optional).toBe(sections.flatMap((s) => s.checks).length);
  });

  it('reports a brand new site as mostly outstanding', () => {
    const sections = [{ title: 'a', blurb: '', checks: identityChecks(brandNew) }];
    expect(progress(sections).todo).toBeGreaterThan(0);
    expect(progress(sections).done).toBe(0);
  });
});

describe('every check', () => {
  const all = [
    ...identityChecks(brandNew), ...brandChecks(brandNew),
    ...founderChecks(brandNew), ...legalChecks(brandNew), ...outsideTheApp(),
  ];

  it('says something specific rather than repeating its own title', () => {
    for (const c of all) {
      expect(c.detail.trim().length, `${c.id} has no detail worth reading`).toBeGreaterThan(30);
      expect(c.detail.trim()).not.toBe(c.title);
    }
  });

  it('has an id nothing else uses', () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
  });

  it('points somewhere real when it points anywhere', () => {
    for (const c of all) {
      if (!c.where) continue;
      expect(c.where.href, `${c.id} links off this site`).toMatch(/^\//);
      expect(c.where.label.trim().length).toBeGreaterThan(0);
    }
  });
});
