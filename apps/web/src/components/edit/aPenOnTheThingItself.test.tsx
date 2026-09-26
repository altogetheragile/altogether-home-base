import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editable, EditableArea, tabFor } from './Editable';

// The drawer knows every field a page has. It does not know which words on the screen each one is,
// and neither does anybody reading thirty-eight labels: finding the founder heading meant guessing
// between "Founder heading", "Founder section, small heading" and "Founder section, introduction".
// The page is the only thing that knows which key it rendered.

const show = (on: boolean) =>
  render(
    <EditableArea on={on}>
      <Editable k="home.hero.heading" label="the headline"><h1>Work better together</h1></Editable>
    </EditableArea>,
  );

describe('a pen on the thing itself', () => {
  it('shows a visitor nothing at all', () => {
    // Not hidden: absent. A visitor's page should not carry a map of the editor in its markup.
    const { container } = show(false);
    expect(container.innerHTML).toBe('<h1>Work better together</h1>');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('leaves the words themselves alone either way', () => {
    show(true);
    expect(screen.getByRole('heading', { name: 'Work better together' })).toBeTruthy();
  });

  it('names what it edits, for a tooltip and a screen reader', () => {
    show(true);
    expect(screen.getByRole('button', { name: 'Edit the headline' })).toBeTruthy();
  });

  it('is invisible until the words are hovered, and keeps its place in the markup', () => {
    // Rendered from the start rather than mounted on hover, so the first hover waits for nothing
    // and the layout never moves under the cursor.
    show(true);
    const pen = screen.getByRole('button');
    expect(pen.style.opacity).toBe('0');
    expect(pen.style.pointerEvents).toBe('none');
  });

  it('appears on hover', async () => {
    show(true);
    await userEvent.hover(screen.getByRole('heading'));
    expect(screen.getByRole('button').style.opacity).toBe('1');
  });

  it('tells the drawer which field, and on which tab', async () => {
    const heard = vi.fn();
    window.addEventListener('aa:edit', heard);
    show(true);
    await userEvent.hover(screen.getByRole('heading'));
    await userEvent.click(screen.getByRole('button'));
    window.removeEventListener('aa:edit', heard);

    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ page: 'home', key: 'home.hero.heading' });
  });

  it('works out the tab from the key, including the two that are not pages', () => {
    expect(tabFor('home.hero.heading')).toBe('home');
    expect(tabFor('about.story.p1')).toBe('about');
    expect(tabFor('site.company_name')).toBe('site');
    // The menu and the footer share one registry called navigation.
    expect(tabFor('nav.events')).toBe('navigation');
    expect(tabFor('footer.contact')).toBe('navigation');
  });
});
