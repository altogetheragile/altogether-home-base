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

/** Turn off "Needs only", which the strip opens with. Cosmetic controls - a fence colour, what a
 *  tree looks like - are hidden while something on the object still fails a criterion the park can
 *  check, so a test about styling says so first. */
export function showEverything(): void {
  const toggle = document.querySelector<HTMLInputElement>('[data-part="needs-only"] input');
  if (toggle?.checked) fireEvent.click(toggle);
}
