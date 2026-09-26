import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Two facts about @altogether/ui being a file: dependency, and a fix for one that broke the other.
//
// It is a symlink. Its own import of lucide-react resolves from the package's real path, which
// means packages/ui/node_modules and then the repository root - neither of which exists when this
// project installs on its own, as it does in CI and on Vercel. The build failed with
// "Can't resolve 'lucide-react'".
//
// resolve.symlinks = false fixed that and broke something quieter and worse: webpack then
// snapshots the symlink rather than its target, so a change to packages/ui/dist is invisible to a
// build with a warm cache. The founder photograph stayed missing from the live site through a
// deploy that contained the fix, and nothing failed. Proved by building, breaking the package,
// rebuilding with the cache warm, and watching the old module still serve.
//
// So: look in this project's own node_modules for bare imports, and leave symlink resolution
// alone.

const config = readFileSync('next.config.mjs', 'utf8');
/** Code only. The comment above the fix names the thing it is warning about, and a test that
 *  cannot tell prose from code fails on its own explanation. That has happened twice now. */
const code = config
  .split('\n')
  .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/*'))
  .join('\n');

describe('the build must see the package change', () => {
  it('never turns symlink resolution off', () => {
    expect(code, 'a changed package becomes invisible to a warm cache').not.toMatch(/symlinks\s*[:=]\s*false/);
  });

  it('looks in this project for bare imports', () => {
    // Without this the shared package cannot find lucide-react where this project installs alone.
    expect(code).toMatch(/resolve\.modules\s*=/);
    expect(code).toMatch(/node_modules/);
  });

  it('keeps the reason written down, because both halves look removable on their own', () => {
    expect(config).toMatch(/lucide-react/);
    expect(config).toMatch(/warm cache|invisible/i);
  });
});

// The same package, the same problem, a different tool. A test that renders a component from
// @altogether/ui failed only in CI: the component's own `react/jsx-runtime` resolves from the
// package's real path, and packages/ui/node_modules does not exist when this project installs on
// its own. It passed locally, where the repository root has React, every single time.
describe('the test runner looks in this project for React', () => {
  const vitestConfig = readFileSync('vitest.config.ts', 'utf8');

  it('resolves the JSX runtime from here rather than from the package', () => {
    expect(vitestConfig).toContain('createRequire');
    expect(vitestConfig).toMatch(/react\/jsx-runtime/);
  });

  it('keeps one React, whichever path reaches it', () => {
    // Two copies is how a shared component gets a null useState instead of a hook, which is the
    // other half of this and cost an afternoon on the drawer.
    expect(vitestConfig).toMatch(/dedupe: \['react', 'react-dom'\]/);
  });
});
