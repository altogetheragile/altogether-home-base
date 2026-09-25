// ============= The sites you look after =============
//
// A place to start from when there is more than one. Deliberately, and this is the whole design:
// **it holds no credentials for any of them.**
//
// A page that could edit another site would need that site's keys kept here, which makes an
// admin account on this site the key to every site listed. For two sites belonging to one family
// that is a poor trade; for a site belonging to a client it is a professional liability, and the
// decision would be made once and inherited by every site after.
//
// So this reads what every site already tells the public - whether it is up, what it calls
// itself, whether it has been set up - and links into each one's own editor for anything that
// writes. Signing in to a site is what grants power over it, which is also what makes it
// revocable by whoever owns it.

export type ManagedSite = { name: string; domain: string; note?: string };

export type SiteStatus = {
  site: ManagedSite;
  /** Whether the site answered at all, and what it said about itself. */
  reachable: boolean;
  healthy: boolean;
  /** What the site calls itself, which is the quickest way to spot one nobody has set up. */
  callsItself: string | null;
  /** Straight into that site's own editor and wizard. */
  links: { label: string; href: string }[];
  /** Said plainly when something is wrong, rather than a status code. */
  trouble: string | null;
};

/** The address without a scheme, however it was typed. Somebody will paste a URL. */
export function hostOf(domain: string): string {
  return domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
}

export function isThisSite(domain: string, self: string | undefined): boolean {
  return Boolean(self) && hostOf(domain) === hostOf(self!);
}

/** Where to go on a site to do something to it. Its own pages, on its own domain, where its own
 *  sign-in decides what you may do. */
export function linksFor(domain: string): { label: string; href: string }[] {
  const base = `https://${hostOf(domain)}`;
  return [
    { label: 'Open', href: base },
    { label: 'Set up', href: `${base}/setup` },
    { label: 'Admin', href: `${base}/dashboard` },
  ];
}

/** What to say about a site that did not answer properly.
 *
 *  In words, because "503" tells somebody nothing they can act on, and the three things that
 *  actually go wrong have three different answers. */
export function troubleWith(status: number | null, health: { status?: string; checks?: Record<string, string> } | null): string | null {
  if (status === null) return 'No answer at all. The domain may not be pointed at Vercel yet.';
  if (status === 404) return 'The address answers but has no site on it. Check the domain is on the right Vercel project.';
  if (status >= 500) {
    if (health?.checks?.supabase && health.checks.supabase !== 'ok') {
      return 'The site is up but cannot reach its database. Check SUPABASE_CSP_HOSTS and the project is not paused.';
    }
    return 'The site answered with an error.';
  }
  if (status >= 400) return `The site answered ${status}.`;
  if (health && health.status !== 'ok') return 'Up, but reporting a problem with itself.';
  return null;
}

/** Everything about one site that can be known without a credential. */
export async function statusOf(
  site: ManagedSite,
  fetcher: typeof fetch = fetch,
): Promise<SiteStatus> {
  const host = hostOf(site.domain);
  const base = { site, links: linksFor(host) };

  let status: number | null = null;
  let health: { status?: string; checks?: Record<string, string> } | null = null;
  try {
    const response = await fetcher(`https://${host}/api/health`, { cache: 'no-store' });
    status = response.status;
    health = await response.json().catch(() => null);
  } catch {
    status = null;
  }

  let callsItself: string | null = null;
  if (status !== null && status < 400) {
    try {
      const page = await fetcher(`https://${host}/`, { cache: 'no-store' });
      const html = await page.text();
      callsItself = html.match(/<title>([^<|-]{2,60})/)?.[1]?.trim() ?? null;
    } catch {
      /* the name is a nicety, not a reason to fail */
    }
  }

  return {
    ...base,
    reachable: status !== null && status < 400,
    healthy: status !== null && status < 400 && health?.status === 'ok',
    callsItself,
    trouble: troubleWith(status, health),
  };
}
