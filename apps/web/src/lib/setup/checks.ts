import type { SiteSettings } from '@/lib/site-settings';

// ============= What is left to do on a site nobody has set up yet =============
//
// Not a wizard. The five steps in docs/NEW_SITE_SETUP.md were specified as a form over the
// configuration, and by the time this came to be built the form already existed: the editor
// opens on every page, covers the name, the brand, the founder, the contact details, the module
// switches and every word, and writes to the same three stores. A wizard would have been a
// second way to set the same things, which is what the editor spent a month replacing.
//
// So this works the other way round. It reads what is actually there, works out what has not
// been decided yet, and sends you to the place that already edits it. That has three properties
// a wizard does not: it cannot fall out of step with the editor, it is re-runnable by its nature
// because it is only ever reporting, and it is as true on a site three years old as on a new one.
//
// The honesty rule throughout: "done" means configured, not merely non-empty. A site still
// called AltogetherAgile has not chosen a name, it has inherited one.

/** What the database hands a brand new site. Inherited, not chosen, and the reason a check for
 *  "is it filled in" would pass on a site nobody has touched. */
export const SHIPPED_DEFAULTS = {
  company_name: 'AltogetherAgile',
  company_description: 'Empowering teams and organizations through agile transformation and coaching.',
  copyright_text: 'All rights reserved.',
} as const;

export type Status = 'done' | 'todo' | 'optional';

export type Check = {
  id: string;
  title: string;
  status: Status;
  /** What is true now. Written to be read by whoever owns the site, not by whoever wrote this. */
  detail: string;
  /** Where to go and do it. A page on this site, with the editor open at the right tab. */
  where?: { label: string; href: string };
};

export type Section = { title: string; blurb: string; checks: Check[] };

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Set to something other than what the database shipped. */
const chosen = (v: unknown, shipped: string): boolean => filled(v) && v.trim() !== shipped;

// ============= Step one: who this site belongs to =============

export function identityChecks(s: SiteSettings): Check[] {
  const name = s.company_name ?? '';
  const nameChosen = chosen(name, SHIPPED_DEFAULTS.company_name);

  return [
    {
      id: 'company-name',
      title: 'Business name',
      status: nameChosen ? 'done' : 'todo',
      detail: nameChosen
        ? `This site calls itself ${name.trim()}.`
        : filled(name)
          ? `Still ${name.trim()}, which is the name this software ships with rather than one anybody chose. It appears in the menu, the footer, the browser tab and everything a search engine quotes.`
          : 'Not set. The menu, the footer and every browser tab have nothing to show.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
    {
      id: 'company-description',
      title: 'One-line description',
      status: chosen(s.company_description, SHIPPED_DEFAULTS.company_description) ? 'done' : 'todo',
      detail: chosen(s.company_description, SHIPPED_DEFAULTS.company_description)
        ? 'Written.'
        : 'Still the shipped sentence about agile transformation and coaching. It sits under the name in the footer and is what a search result quotes underneath the link.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
    {
      id: 'contact-email',
      title: 'Contact email',
      status: filled(s.contact_email) ? 'done' : 'todo',
      detail: filled(s.contact_email)
        ? `Enquiries reach ${s.contact_email}.`
        : 'Nothing set, so the footer shows no way to reach you and the contact page has nowhere to send an enquiry.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
    {
      id: 'copyright',
      title: 'Copyright line',
      status: chosen(s.copyright_text, SHIPPED_DEFAULTS.copyright_text) ? 'done' : 'optional',
      detail: chosen(s.copyright_text, SHIPPED_DEFAULTS.copyright_text)
        ? 'Written.'
        : 'Still "All rights reserved.", which is a perfectly ordinary thing for it to say. Change it if you want something else.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
  ];
}

// ============= Step two: what it looks like =============

export function brandChecks(s: SiteSettings): Check[] {
  const images = (s.brand?.images ?? {}) as Record<string, unknown>;
  const colours = (s.brand?.colors ?? {}) as Record<string, unknown>;
  const colourCount = Object.values(colours).filter(filled).length;

  return [
    {
      id: 'logo',
      title: 'Logo',
      status: filled(images.logo) ? 'done' : 'optional',
      detail: filled(images.logo)
        ? 'Uploaded, and shown top left of every page.'
        : 'None, so the top left of every page shows your business name as words. That often looks better than a stretched image, so this is a real choice rather than a gap.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
    {
      id: 'colours',
      title: 'Brand colours',
      // Optional rather than outstanding, and the wording asks rather than asserts. Nothing here
      // can tell a site that has not chosen its colours from one whose colours these already are:
      // this repository is itself a site running the shipped palette, quite correctly. Calling
      // that unfinished would be the checklist crying wolf on the site most likely to read it.
      status: colourCount > 0 ? 'done' : 'optional',
      detail: colourCount > 0
        ? `${colourCount} of the five set. The rest fall back to the shipped palette.`
        : 'None set, so the teal and orange this software ships with are in use. If those are not your colours, this is the first thing anyone notices.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
    {
      id: 'share-image',
      title: 'Share image',
      status: filled(images.ogImage) ? 'done' : 'optional',
      detail: filled(images.ogImage)
        ? 'Set, so links to this site preview with your own picture.'
        : 'None, so a link posted to LinkedIn or Slack previews with the shipped image. Worth setting before you start sharing links.',
      where: { label: 'This Site', href: '/?edit=site' },
    },
  ];
}

// ============= Step three: whose site it is =============

export function founderChecks(s: SiteSettings): Check[] {
  // Off is a complete answer. Plenty of sites are a company rather than a person, and the
  // sections disappear entirely rather than sitting there empty.
  if (s.show_founder === false) {
    return [{
      id: 'founder',
      title: 'The person behind the site',
      status: 'done',
      detail: 'Switched off, so there is no founder section, no portrait and no Person in the structured data. That is a complete answer.',
      where: { label: 'This Site', href: '/?edit=site' },
    }];
  }
  const named = filled(s.founder_name);
  return [{
    id: 'founder',
    title: 'The person behind the site',
    status: named ? 'done' : 'todo',
    detail: named
      ? `${s.founder_name} is named in the structured data and beside the photograph.`
      : 'Switched on but nobody is named, so the founder sections render around a blank. Either name somebody or switch it off, which removes those sections entirely.',
    where: { label: 'This Site', href: '/?edit=site' },
  }];
}

// ============= Step four: the words =============

/** One entry per page that is switched on, saying how much of it is still the wording this
 *  software shipped with.
 *
 *  Counted against what is saved rather than against what renders, because a page showing its
 *  shipped wording looks finished and is not. */
export function wordChecks(
  pagesOn: { page: string; label: string; href: string }[],
  savedKeysByPage: Record<string, number>,
  totalKeysByPage: Record<string, number>,
): Check[] {
  return pagesOn.map(({ page, label, href }) => {
    const saved = savedKeysByPage[page] ?? 0;
    const total = totalKeysByPage[page] ?? 0;
    const none = saved === 0;
    return {
      id: `words-${page}`,
      title: label,
      status: none ? 'todo' : saved >= total ? 'done' : 'optional',
      detail: total === 0
        ? 'Nothing on this page is editable copy.'
        : none
          ? `Every one of the ${total} pieces of wording is still as shipped.`
          : `${saved} of ${total} pieces rewritten.`,
      where: { label: 'Edit this page', href },
    };
  });
}

// ============= Step five: the pages that are somebody else's =============

export function legalChecks(s: SiteSettings): Check[] {
  const published = s.show_legal === true;
  return [{
    id: 'legal',
    title: 'Terms, privacy and cookies',
    status: published ? 'optional' : 'done',
    detail: published
      ? 'Published. Check they are yours: the pages this software ships with carry another company’s wording, registration number and registered office, and publishing those as your own is worse than having none.'
      : 'Not published, so those pages say they are unwritten rather than presenting somebody else’s liability wording as yours. Write your own before switching them on.',
    where: { label: 'This Site', href: '/?edit=site' },
  }];
}

// ============= The part no form can do =============

/** Steps outside the application entirely.
 *
 *  Always listed, never ticked. Nothing here can be read from the database, and a checklist that
 *  guessed would be worse than one that asks: an unticked box you have already done costs you a
 *  glance, and a ticked box you have not costs you a site that does not work. */
export function outsideTheApp(): Check[] {
  return [
    {
      id: 'csp-host',
      title: 'Add this database to the security policy',
      detail: 'The routing config names which databases a browser may contact. Set SUPABASE_CSP_HOSTS on this deployment to this project’s host, in the Vercel project settings, then redeploy. Miss it and the site loads, renders, and then shows no content at all, with only a console warning to say why.',
      status: 'todo',
    },
    {
      id: 'site-url',
      title: 'Set NEXT_PUBLIC_SITE_URL',
      detail: 'Without it every canonical link and share preview points at altogetheragile.com, which tells search engines this site is a copy of that one.',
      status: 'todo',
    },
    {
      id: 'auth-redirects',
      title: 'Allow this domain to sign people in',
      detail: 'Supabase, under Authentication, needs the Site URL and the redirect allowlist set to this domain. Until then a sign-in link sends people somewhere else.',
      status: 'todo',
    },
    {
      id: 'mail-secrets',
      title: 'Give the mail function its keys',
      detail: 'Deploying send-contact-email is not enough: it needs RESEND_API_KEY, ADMIN_EMAIL and MAIL_FROM set on the Supabase project. MAIL_FROM has to be an address on a domain your Resend account has verified, or every send is refused and nothing on the site says so.',
      status: 'todo',
    },
    {
      id: 'redeploy',
      title: 'Redeploy once the content is in',
      detail: 'The sitemap is built at deploy time, not per request, so courses and posts added here do not appear in it until something deploys. Nothing warns you: the pages are live and correct while the sitemap still lists the old ones.',
      status: 'todo',
    },
  ];
}

/** How far along, counting only what somebody still has to decide. */
export function progress(sections: Section[]): { done: number; todo: number; optional: number } {
  const all = sections.flatMap((s) => s.checks);
  return {
    done: all.filter((c) => c.status === 'done').length,
    todo: all.filter((c) => c.status === 'todo').length,
    optional: all.filter((c) => c.status === 'optional').length,
  };
}

// ============= Whether the site can tell anybody it has been written to =============
//
// An enquiry is saved to the contacts table and then a function is asked to send the email. The
// asking is deliberately fire-and-forget, because the message is safe either way and a visitor
// should not be shown a failure that is not theirs. The cost of that is silence: on a site where
// the function was never deployed, somebody fills the form in, reads "Message Sent", and nobody
// is ever told. It was working that way on a live site for a day.
//
// Edge functions are deployed per project, so a new site starts without them. That is worth
// checking rather than listing, and it can be checked without sending anything: the preflight a
// browser makes before calling a function answers only if the function is there.

/** Is the function that sends enquiries actually deployed to this site's project? */
export async function enquiryEmailCheck(): Promise<Check> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const where = { label: 'How this is done', href: 'https://supabase.com/dashboard/project/_/functions' };

  if (!base) {
    return {
      id: 'enquiry-email', status: 'todo', title: 'Let the site send you its enquiries',
      detail: 'This deployment has no database address set, so nothing can be checked from here.',
      where,
    };
  }

  // OPTIONS, not POST: the preflight says whether the function exists and sends no mail. A
  // network error is reported as unknown rather than as missing, because "your email is broken"
  // is a bad thing to say on the strength of one timed-out request.
  try {
    const url = `${base.replace(/\/$/, '')}/functions/v1/send-contact-email`;
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return {
        id: 'enquiry-email', status: 'done', title: 'The site can send you its enquiries',
        detail: 'send-contact-email is deployed to this project. It still needs RESEND_API_KEY, ADMIN_EMAIL and MAIL_FROM set on it, which cannot be checked from here: MAIL_FROM has to be an address on a domain your Resend account owns, or every send is refused.',
        where,
      };
    }
    return {
      id: 'enquiry-email', status: 'todo', title: 'Let the site send you its enquiries',
      detail: 'send-contact-email is not deployed to this project, so every enquiry is saved and nobody is told. The contact form still says "Message Sent", because the message is safely in the database. Deploy it, then set RESEND_API_KEY, ADMIN_EMAIL and MAIL_FROM on the project.',
      where,
    };
  } catch {
    return {
      id: 'enquiry-email', status: 'optional', title: 'Whether the site can send you its enquiries',
      detail: 'Could not reach the functions for this project just now, so this is unknown rather than missing. Worth checking by hand if enquiries are not arriving.',
      where,
    };
  }
}
