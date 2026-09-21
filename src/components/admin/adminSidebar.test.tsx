import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Calendar, BookOpen } from 'lucide-react';
import { SidebarProvider, SidebarMenu } from '@/components/ui/sidebar';
import { SidebarNavItem, type NavItem } from './AdminLayout';

// A sidebar group opens because you are inside it, and closes again when you leave.
//
// Reported while using the admin: "the admin page lands with the Events options open - annoying."
//
// It did, and it never stopped: land on /admin/events, go to Dashboard, go on to Site Settings, and
// the Events group is still hanging open the whole way. `defaultOpen` is UNCONTROLLED - Radix reads
// it once when the Collapsible mounts and ignores it afterwards - and this layout never unmounts as
// you move about the admin, so every group froze in whatever state the first render left it in.
//
// It failed in both directions, which is the part that makes it a bug rather than a preference: a
// group you had left stayed open, and a group you navigated INTO never opened.

// The sidebar asks the browser whether this is a phone. jsdom has no matchMedia, and the answer
// does not matter here: the fault being held is about navigation, not about width.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

const EVENTS: NavItem = {
  label: 'Events', icon: Calendar, href: '/admin/events',
  children: [
    { label: 'Courses', href: '/admin/courses', icon: BookOpen },
    { label: 'Certification Bodies', href: '/admin/certification-bodies', icon: BookOpen },
  ],
};

/** The sidebar as it is at one route. Re-rendering with a new pathname is what a navigation does to
 *  it: the layout stays mounted and the pathname prop changes underneath. */
const at = (pathname: string) => {
  const view = render(
    <MemoryRouter>
      <SidebarProvider>
        <SidebarMenu><SidebarNavItem item={EVENTS} pathname={pathname} /></SidebarMenu>
      </SidebarProvider>
    </MemoryRouter>,
  );
  const open = () => !!view.container.querySelector('a[href="/admin/certification-bodies"]');
  return {
    open,
    /** ...and then you click something. The layout is NOT remounted. */
    goTo: (next: string) => {
      view.rerender(
        <MemoryRouter>
          <SidebarProvider>
            <SidebarMenu><SidebarNavItem item={EVENTS} pathname={next} /></SidebarMenu>
          </SidebarProvider>
        </MemoryRouter>,
      );
      return open();
    },
  };
};

describe('an admin sidebar group', () => {
  it('is open on a page inside it', () => {
    expect(at('/admin/events').open(), 'the group holding this page is shut').toBe(true);
  });

  it('is shut on a page outside it', () => {
    expect(at('/admin/settings').open(), 'a group with nothing to do with this page is open').toBe(false);
  });

  it('closes when you navigate away, without being remounted', () => {
    // The reported annoyance, exactly: arrive on Events, leave for the Dashboard, and it should not
    // still be sitting open. Before the fix this returned true.
    const sidebar = at('/admin/events');
    expect(sidebar.open()).toBe(true);
    expect(sidebar.goTo('/admin'), 'it stayed open after leaving the group').toBe(false);
  });

  it('opens when you navigate into it, without being remounted', () => {
    // The same fault the other way round, and the reason this is a bug rather than a preference.
    const sidebar = at('/admin/settings');
    expect(sidebar.open()).toBe(false);
    expect(sidebar.goTo('/admin/courses'), 'it stayed shut after moving into the group').toBe(true);
  });

  it('stays open while you move between its own children', () => {
    // A group should not flicker shut and open again because you moved one item down inside it.
    const sidebar = at('/admin/courses');
    expect(sidebar.open()).toBe(true);
    expect(sidebar.goTo('/admin/certification-bodies'), 'it shut while moving inside itself').toBe(true);
  });
});
