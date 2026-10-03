import { fireEvent } from '@testing-library/react';
import type { GroupId } from './buildGroups';

/** Open one part of the build strip, the way a player does.
 *
 *  The strip is a row of buttons that open their controls; nothing is on screen until you press the
 *  part you want. Tests that reached straight for a barrier chip were reaching for something a
 *  player cannot see either, so they open the menu first and then look.
 *
 *  The panel is portalled, so what comes back is `document` rather than the render container. */
export function openGroup(id: GroupId): Document {
  const button = document.querySelector<HTMLElement>(`[data-part="group-${id}"]`);
  if (!button) {
    const there = [...document.querySelectorAll('[data-part^="group-"]')]
      .map((b) => b.getAttribute('data-part')).join(', ');
    throw new Error(`No "${id}" on the build strip. It offers: ${there || 'nothing'}`);
  }
  fireEvent.click(button);
  return document;
}

/** Every part of the work the strip is offering, by name.
 *
 *  The buttons are pictures now, so a test that asked whether a control was on the strip by looking
 *  for its name in the strip's text was asking the wrong question of the wrong thing - the name is
 *  the button's accessible name, which is also the only name a screen reader is given. Reading it
 *  from there checks the control is there AND that it is announced. */
export function stripNames(root: ParentNode = document): string[] {
  return [...root.querySelectorAll('[data-part^="group-"]')]
    .map((b) => b.getAttribute('aria-label') ?? '');
}
