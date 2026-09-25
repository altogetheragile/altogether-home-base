import { vercelProjects, slugFrom } from './plan';

// ============= Being walked through it =============
//
// Ten steps, one at a time, each saying what to do, where to click, and what to paste. It holds
// nothing: no tokens, no keys, no session with anybody else's account. Everything it knows it
// worked out from two things somebody typed, a name and a domain.
//
// That is why this exists rather than a button that does it all. A button would need a Supabase
// token and a Vercel token kept somewhere, and the only place to keep them is a database whose
// settings row is readable by the public. This asks for nothing, so there is nothing to leak and
// nothing to revoke afterwards.
//
// Written for somebody who has not done it before. Every step names the exact page to open and
// the exact words on the button to press, because "create a project" is obvious only once.

export type Step = {
  n: number;
  title: string;
  /** What to do, in plain words. */
  body: string;
  /** Straight to the page this step happens on. */
  go?: { label: string; href: string };
  /** Things to copy. A label and the exact value, so nothing has to be typed out. */
  copy?: { label: string; value: string; secret?: boolean }[];
  /** Said when it is easy to do the right thing and still get it wrong. */
  watch?: string;
  /** Things only the person can find, asked for here so no later step has to show a placeholder
   *  and hope somebody notices it is one. */
  asks?: { field: 'ref' | 'anonKey'; label: string; placeholder: string; help: string }[];
};

export type Answers = {
  name: string; domain: string; email: string;
  /** Found in step 2, and needed by every command after it. Not secret: it is in the address of
   *  every request the site makes. */
  ref?: string;
  /** Also step 2, also not secret: it ships in the JavaScript of every page. */
  anonKey?: string;
};

/** What to show when the answer is not known yet. Never pasted into a command: the step that
 *  would use it asks for it first. */
export const UNKNOWN_REF = 'YOUR-PROJECT-REF';

/** Everything derived from the two answers, so no step has to work it out again. */
export function namesFor(answers: Answers) {
  const domain = answers.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const slug = slugFrom(domain);
  return { domain, slug, siteProject: `${slug}-web-next`, appProject: slug };
}

const REPO = 'altogetheragile/altogether-home-base';

export function walkthrough(answers: Answers): Step[] {
  const { domain, slug, siteProject, appProject } = namesFor(answers);
  // The environment variables cannot be known until the database exists, so the steps that need
  // them are written to be filled in by the person, with the shape given.
  const ref = answers.ref?.trim() || UNKNOWN_REF;
  const specs = vercelProjects({
    slug, domain, repo: REPO,
    supabaseUrl: `https://${ref}.supabase.co`,
    anonKey: answers.anonKey?.trim() || 'YOUR-ANON-KEY',
  });
  const site = specs.find((s) => s.role === 'site')!;
  const app = specs.find((s) => s.role === 'app')!;
  // Parsing a URL lowercases its host, so the placeholder came back as
  // your-project-ref.supabase.co beside a URL saying YOUR-PROJECT-REF. Two spellings of the same
  // thing, which reads as two different values to somebody who has not done this before.
  const envList = (spec: typeof site) =>
    Object.entries(spec.env).map(([k, v]) => ({ label: k, value: v.replace(/your-project-ref/gi, UNKNOWN_REF) }));

  return [
    {
      n: 1,
      title: 'Make the database',
      body: `Sign in to Supabase and press New project. Call it "${slug}". Choose a region near you, such as London. It will make up a database password for you: copy it somewhere safe now, because this is the only time it is shown and you will need it in step 3.`,
      go: { label: 'Open Supabase', href: 'https://supabase.com/dashboard/projects' },
      copy: [{ label: 'Project name', value: slug }],
      watch: 'It takes a couple of minutes to start. Wait until it stops saying "Setting up project".',
    },
    {
      n: 2,
      title: 'Find its two addresses, and paste them here',
      body: 'In that new project, open Project Settings, then API. Copy the Reference ID and the key labelled anon public, and paste both into the boxes below. Every step after this one then gives you commands and settings you can use as they are, with nothing left to fill in.',
      go: { label: 'Supabase project settings', href: 'https://supabase.com/dashboard/project/_/settings/api' },
      // The only step that asks for anything. Both are public: the reference is in the address of
      // every request the site makes, and the anon key ships in the JavaScript of every page.
      // Neither is stored: they are held while the walk-through is open and forgotten after.
      asks: [
        { field: 'ref', label: 'Reference ID', placeholder: 'abcdefghijklmnopqrst', help: 'Twenty lowercase letters. Also the code in this project\u2019s web address.' },
        { field: 'anonKey', label: 'anon public key', placeholder: 'eyJhbGciOi...', help: 'The long one. Safe to put in a website, which is why it is asked for here.' },
      ],
      watch: 'Do not use the service_role key. It is on the same page, it bypasses every security rule, and it must never go into a website.',
    },
    {
      n: 3,
      title: 'Build the tables',
      body: `This is the one step that needs a terminal, because Supabase offers no way to do it from a web page. It works on its own copy of the code, in a new folder called ${slug}, so that nothing happens to the one you already have. Open Terminal and run these four lines. The last asks for the database password from step 1.`,
      copy: [
        { label: 'Get a fresh copy of the code', value: `git clone https://github.com/${REPO}.git ~/${slug}` },
        { label: 'Go into it', value: `cd ~/${slug}` },
        { label: 'Point it at the new database', value: `npx supabase link --project-ref ${ref}` },
        { label: 'Create the tables', value: 'npx supabase db push --linked' },
      ],
      watch: `Use a new folder, not the one your own site lives in. Linking changes which database that folder points at, and doing it in ~/altogether-home-base would leave your own site's folder aimed at ${answers.name.trim() || 'the new site'}, so the next change you made would go to the wrong database with nothing to say so.`,
    },
    {
      n: 4,
      title: 'Make the part that shows the pages',
      body: `On the Vercel page that opens, ignore the big prompt box at the top: that is v0, which builds brand new apps and is not what you want. Look further down for the panel headed "Import Git Repository", find ${REPO}, and press Import. Then, before you press Deploy: set the project name to "${siteProject}", check Framework Preset says Next.js, which Vercel works out from the folder and then locks, so there is nothing to change if it is already right, set Root Directory to "apps/web", and add the three environment variables below.`,
      go: { label: 'Open Vercel, New Project', href: 'https://vercel.com/new' },
      copy: [
        { label: 'Project name', value: siteProject },
        { label: 'Framework Preset', value: 'Next.js' },
        { label: 'Root Directory', value: 'apps/web' },
        ...envList(site),
      ],
      watch: 'Two easy mistakes here. Typing into the prompt box at the top starts v0 building a new app from nothing, which is not this. And Root Directory, under Build and Output Settings, is easy to miss: the deployment fails without it.',
    },
    {
      n: 5,
      title: 'Make the part that answers the address',
      body: `Import the same repository a second time, the same way: the "Import Git Repository" panel, not the prompt box. Name this one "${appProject}". Root Directory must be the repository root this time. If the picker opens showing apps/web from last time, go back up and choose the top entry, the one named after the repository itself with a lightning bolt beside it. Framework Preset should then say Vite rather than Next.js. Vercel detects it from the folder: if it is right, it will be greyed out, which is correct rather than broken. Add the five environment variables below.`,
      go: { label: 'Vercel, New Project again', href: 'https://vercel.com/new' },
      copy: [
        { label: 'Project name', value: appProject },
        { label: 'Framework Preset', value: 'Vite' },
        ...envList(app),
      ],
      watch: `Three things, and all of them look like something else when they go wrong. Root Directory: leave it as the repository root. Pointing it at a folder that happens to contain a dist, such as packages/ui, deploys that folder as the website and the address then serves raw JavaScript. SITE_DEPLOYMENT_HOST must be exactly ${siteProject}.vercel.app, or the new site shows this site's pages instead of its own with no error at all. And as in step 4, the prompt box at the top of that page is v0, which makes new apps rather than importing yours.`,
    },
    {
      n: 6,
      title: 'Give it its address',
      body: `In the "${appProject}" project, open Settings, then Domains, and add ${domain}. Vercel will show you one or two records to add wherever you bought the domain. Add them there, then come back.`,
      go: { label: 'Vercel domains', href: `https://vercel.com/dashboard` },
      copy: [{ label: 'Domain', value: domain }],
      watch: 'Add the domain to the project named after the business, not the one ending in -web-next. Only one of them answers the address.',
    },
    {
      n: 7,
      title: 'Let people sign in',
      body: `Back in Supabase, open Authentication, then URL Configuration. Set the Site URL to https://${domain} and add https://${domain}/** to the redirect list.`,
      go: { label: 'Supabase authentication', href: 'https://supabase.com/dashboard/project/_/auth/url-configuration' },
      copy: [
        { label: 'Site URL', value: `https://${domain}` },
        { label: 'Redirect URL', value: `https://${domain}/**` },
      ],
      watch: 'Skip this and a password reset email sends people to the wrong website.',
    },
    {
      n: 8,
      title: 'Make yourself an administrator',
      body: `Go to https://${domain} and sign up with ${answers.email.trim() || 'your email address'}. That gives you an ordinary account. Then, in Supabase, open the SQL Editor and run the line below to turn it into an admin.`,
      go: { label: 'Supabase SQL editor', href: 'https://supabase.com/dashboard/project/_/sql/new' },
      copy: [{
        label: 'Run this',
        value: `insert into public.user_roles (user_id, role)\nselect id, 'admin' from auth.users where email = '${answers.email.trim() || 'you@example.com'}'\non conflict (user_id, role) do nothing;`,
      }],
      watch: 'Signing up alone is not enough. Nothing makes anybody an admin automatically, which is deliberate.',
    },
    {
      n: 9,
      title: 'Make it theirs',
      body: `Open the setup wizard on the new site and work through its five steps: the name, the colours, whose site it is, what it does, and the words.`,
      go: { label: `Open ${domain}/setup`, href: `https://${domain}/setup` },
    },
    {
      n: 10,
      title: 'Add it to this list',
      body: `Last thing. On this site, open the editor on any page, choose This Site, and add ${answers.name.trim() || 'the new site'} under "Sites you look after". It will then appear above with a green light when it is up.`,
      copy: [
        { label: 'What you call it', value: answers.name.trim() },
        { label: 'Address', value: domain },
      ],
    },
  ];
}
