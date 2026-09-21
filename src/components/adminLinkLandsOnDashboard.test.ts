import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Every way in to the admin panel lands on the Dashboard.
//
// Reported as "the Events sidebar is still expanded by default", from the Dashboard dropdown's
// Admin item. The sidebar was innocent: #709 made a group open because you are inside it, and the
// link went to /admin/events, so the Events group opened because that genuinely was the page. The
// entry point was wrong, not the disclosure.
//
// Three links carried the same wrong target - the desktop dropdown, the mobile menu and the footer
// - which is why this checks the files rather than one rendered component. /admin is the only
// address that is nobody's section, so it is the only one that opens no group.

const sources = {
  'src/components/Navigation.tsx': /to="(\/admin[^"]*)"/g,
  'src/components/Footer.tsx': /label: 'Admin Panel', url: '(\/admin[^']*)'/g,
};

describe('the links in to the admin panel', () => {
  it('land on the dashboard, not inside a sidebar group', () => {
    for (const [file, pattern] of Object.entries(sources)) {
      const targets = [...readFileSync(file, 'utf8').matchAll(pattern)].map((m) => m[1]);
      expect(targets.length, `no admin link found in ${file}`).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target, `${file} sends an admin visitor to ${target}`).toBe('/admin');
      }
    }
  });
});
