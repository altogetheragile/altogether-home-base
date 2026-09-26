import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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

// One pen at a time means sweeping the page to find out what is editable, which is a smaller
// version of the problem this was built for rather than a solution to it. Reported as "I only see
// the pen on one thing".
describe('every pen shows while the drawer is open', () => {
  const editor = (open: boolean) =>
    act(() => { window.dispatchEvent(new CustomEvent('aa:editor', { detail: { open } })); });

  const two = () =>
    render(
      <EditableArea on>
        <Editable k="home.hero.heading" label="the headline"><h1>Headline</h1></Editable>
        <Editable k="home.hero.subtitle" label="the sentence"><p>Subtitle</p></Editable>
      </EditableArea>,
    );

  it('shows all of them when it opens, without anything being hovered', () => {
    two();
    expect(screen.getAllByRole('button').every((b) => b.style.opacity === '0')).toBe(true);
    editor(true);
    expect(screen.getAllByRole('button').every((b) => b.style.opacity === '1')).toBe(true);
  });

  it('makes them clickable, not merely visible', () => {
    two();
    editor(true);
    expect(screen.getAllByRole('button').every((b) => b.style.pointerEvents === 'auto')).toBe(true);
  });

  it('puts them away again when it closes', () => {
    two();
    editor(true);
    editor(false);
    expect(screen.getAllByRole('button').every((b) => b.style.opacity === '0')).toBe(true);
  });

  it('tells a visitor nothing, whatever the drawer says', () => {
    // The event is a window event and anything can fire it. It must not be a way to make the
    // editor visible on a page that is not being edited.
    const { container } = render(
      <EditableArea on={false}>
        <Editable k="home.hero.heading"><h1>Headline</h1></Editable>
      </EditableArea>,
    );
    editor(true);
    expect(container.innerHTML).toBe('<h1>Headline</h1>');
  });
});
