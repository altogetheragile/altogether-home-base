import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { EditableArea } from './Editable';
import { EmptySection } from './EmptySection';

// A section with nothing in it renders nothing, which is right for a visitor and useless for the
// person filling the site in: the section is not hidden, it is absent. Nothing says it exists,
// and nothing distinguishes "empty" from "switched off" - two states that look identical on the
// page and are fixed in completely different places.

const show = (on: boolean, extra: Partial<React.ComponentProps<typeof EmptySection>> = {}) =>
  render(
    <EditableArea on={on}>
      <EmptySection
        name="Testimonials"
        why="Nobody has left an approved testimonial yet."
        fills={{ kind: 'elsewhere', where: 'They come from approved feedback.' }}
        {...extra}
      />
    </EditableArea>,
  );

describe('an empty section says so', () => {
  it('shows a visitor nothing at all', () => {
    // Not a faint outline they could see, and not a band of empty space: absent, as before.
    expect(show(false).container.innerHTML).toBe('');
  });

  it('names the section and says it is the emptiness that is hiding it', () => {
    show(true);
    expect(screen.getByText('Testimonials')).toBeTruthy();
    expect(screen.getByText(/Empty, so visitors do not see it/)).toBeTruthy();
  });

  it('says where the rows come from when no drawer field would fill them', () => {
    show(true);
    expect(screen.getByText(/They come from approved feedback/)).toBeTruthy();
    // Nothing to press, because pressing it could only open a box that does not fill this.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('opens the drawer at the field when there is one', () => {
    const heard = vi.fn();
    window.addEventListener('aa:edit', heard);
    show(true, { name: 'Statistics bar', fills: { kind: 'field', k: 'home.stats.items', label: 'the statistics' } });
    screen.getByRole('button', { name: 'Add the statistics' }).click();
    window.removeEventListener('aa:edit', heard);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ page: 'home', key: 'home.stats.items' });
  });

  it('draws the shape the section will be, so it is recognisable while empty', () => {
    const { container } = show(true, { cards: 4 });
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(4);
  });
});

describe('every section that can empty out offers one', () => {
  const files = {
    'home page': 'src/app/page.tsx',
    'about page': 'src/app/about/page.tsx',
    'testimonials strip': 'src/app/HomeTestimonials.tsx',
  };

  it('leaves no section rendering nothing without saying why', () => {
    // The shape that hides a section silently. If a new one appears, it should come with a
    // placeholder rather than joining the seven that had to be found by reading the source.
    for (const [what, file] of Object.entries(files)) {
      const src = readFileSync(file, 'utf8');
      const silent = src.match(/(?:length\s*===\s*0|!\w+\.length)\)\s*return null/g);
      expect(silent, `${what} still hides a section with no explanation`).toBeNull();
    }
  });

  it('says nothing at all about a section that is switched off', () => {
    // Off is an answer, not a gap. A placeholder there would be arguing with the switch.
    const src = readFileSync(files['home page'], 'utf8');
    for (const flag of ['showKnowledge', 'founder.shown']) {
      const at = src.indexOf(`{${flag} && `);
      expect(at, `${flag} no longer guards its section`).toBeGreaterThan(-1);
      expect(src.slice(at, at + 400)).not.toContain('EmptySection');
    }
  });
});
