import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// packages/ui/dist used to be committed, because both apps install on their own and cannot build
// it. That cost two things. Every branch touching the package met the next one as a conflict in
// generated files, three times in one day. And a committed build output is a promise that it
// matches its source, which twice it did not: four editor features shipped, passed their tests and
// did nothing, because the tests read the source and the apps read a dist nobody had rebuilt.
//
// It is built now, by whoever is about to use it. Which means four places have to agree, and this
// is what holds them together.

const pkg = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('the shared package is built, not committed', () => {
  it('is not in the repository', () => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^packages\/ui\/dist\/?$/m);
  });

  it('is built after any install at the root, and never fails one', () => {
    // A convenience, so a fresh clone has it without being told. Not fatal: Vercel installs with
    // NODE_ENV=production, which omits the very devDependencies this needs, and the first preview
    // deploy died on "tsup: command not found" during npm ci.
    const prepare = pkg('package.json').scripts.prepare ?? '';
    expect(prepare).toContain('--workspace @altogether/ui');
    expect(prepare, 'prepare can fail an install').toMatch(/\|\|/);
  });

  it('is built before this project builds, where it has to be there', () => {
    // How the App's deploy gets it: its root directory is this one and it runs npm run build.
    const prebuild = pkg('package.json').scripts.prebuild ?? '';
    expect(prebuild).toContain('npm run build --workspace @altogether/ui');
    expect(prebuild, 'must be fatal here').not.toMatch(/\|\|/);
  });

  it('is built by the Site before the Site builds', () => {
    // The Site's root directory is apps/web and it installs alone, so it has neither the package's
    // build tools nor anything that would run the root's prepare.
    const build = pkg('apps/web/vercel.json').buildCommand ?? '';
    expect(build).toContain('npm run build --workspace @altogether/ui');
    // Vercel builds with NODE_ENV=production, and npm then omits the build tools entirely.
    expect(build, 'the install would omit devDependencies').toContain('--include=dev');
    expect(build.indexOf('@altogether/ui')).toBeLessThan(build.indexOf('next build'));
  });

  it('keeps the Site pointed at Next, or Vercel guesses', () => {
    expect(pkg('apps/web/vercel.json').framework).toBe('nextjs');
  });

  it('is built in CI the same way, for the job that installs alone', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    const job = ci.slice(ci.indexOf('working-directory: apps/web') - 2000);
    expect(job).toContain('npm run build --workspace @altogether/ui');
  });

  it('no longer claims to check a committed copy', () => {
    // The check that the committed output matched its source was right while there was one.
    expect(readFileSync('.github/workflows/ci.yml', 'utf8')).not.toContain('The built package matches its source');
  });
});
