import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddAPicture, EditableArea, OnlyWhenEditing } from './Editable';

// A pen is drawn on something that was rendered, so a picture field with nothing in it had no pen
// and no outline: the hero simply was not there. The second site lost its hero exactly this way,
// and the only route back was knowing the drawer has a row called "Hero background picture".

const slot = (on: boolean, extra: Record<string, unknown> = {}) =>
  render(
    <EditableArea on={on}>
      <AddAPicture k="home.hero.background" label="the background picture" {...extra} />
    </EditableArea>,
  );

describe('a picture nobody has chosen', () => {
  it('shows a visitor nothing at all', () => {
    // Not a faint outline a visitor could see, and not an empty box taking up space: absent.
    const { container } = slot(false);
    expect(container.innerHTML).toBe('');
  });

  it('says what is missing rather than what to press', () => {
    slot(true);
    expect(screen.getByRole('button', { name: 'Add the background picture' })).toBeTruthy();
  });

  it('is drawn from the start, because there is nothing to hover', () => {
    // The opposite of the pen, deliberately. A pen is found by pointing at the thing it edits,
    // and an empty slot has no such thing.
    slot(true);
    expect(screen.getByRole('button').style.opacity).not.toBe('0');
  });

  it('opens the drawer at the field, on the right tab', () => {
    const heard = vi.fn();
    window.addEventListener('aa:edit', heard);
    slot(true);
    screen.getByRole('button').click();
    window.removeEventListener('aa:edit', heard);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({
      page: 'home', key: 'home.hero.background',
    });
  });

  it('sends a brand picture to This Site, wherever on the page it sits', () => {
    const heard = vi.fn();
    window.addEventListener('aa:edit', heard);
    render(
      <EditableArea on>
        <AddAPicture k="site.brand.images.founderPhoto" label="the founder photograph" />
      </EditableArea>,
    );
    screen.getByRole('button').click();
    window.removeEventListener('aa:edit', heard);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({
      page: 'site', key: 'site.brand.images.founderPhoto',
    });
  });

  it('fills the space behind the words when it is a background', () => {
    slot(true, { fill: true });
    const box = screen.getByRole('button');
    expect(box.style.position).toBe('absolute');
    // Behind the headline, which sits at 2, so the hero still reads as a hero while it is empty.
    expect(box.style.zIndex).toBe('1');
  });

  it('takes the shape of the picture it stands in for', () => {
    slot(true, { width: 320, height: 380 });
    const box = screen.getByRole('button');
    expect(box.style.width).toBe('320px');
    expect(box.style.height).toBe('380px');
  });

  it('opens nothing when it has no field to open', () => {
    // A shared component may be rendered with and without a key. A slot that opens the drawer at
    // nothing is worse than no slot.
    const { container } = render(<EditableArea on><AddAPicture k="  " label="a picture" /></EditableArea>);
    expect(container.innerHTML).toBe('');
  });
});

describe('a column that only exists to be edited', () => {
  it('is there for an administrator and gone for a visitor', () => {
    // The about page's portrait column holds one thing. Empty, it is half a teal banner of
    // nothing to a visitor and the only place to put a portrait for everybody else.
    const both = (on: boolean) =>
      render(<EditableArea on={on}><OnlyWhenEditing><div data-testid="column" /></OnlyWhenEditing></EditableArea>);
    expect(both(true).container.querySelector('[data-testid="column"]')).toBeTruthy();
    expect(both(false).container.innerHTML).toBe('');
  });
});
