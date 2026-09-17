import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { openGroup } from './openGroup';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import type { ItemDesign } from './design';

// Every colour, not only the ones somebody chose for you.
//
// The swatches on each menu are a handful worth reaching for first, and behind the "+" is a wider
// grid - but a grid is a fence as well as a shortcut, and there was no way over it. Asked for after
// a play-through: "for all the colour pickers can there be a wider more customisable colour
// picker?"

const seeded = (): ZooGameState => initialZooState(1) as ZooGameState;
const pen = (s: ZooGameState) => s.backlog.find((it) => it.category === 'enclosure')!;

const strip = (onDesign: (id: string, d: ItemDesign) => void = () => {}) => {
  const s = seeded();
  return render(
    <ParkOptions state={s} item={pen(s)} inside={null}
      api={{ onDesign, onSetEnclosure: () => {} }} />,
  );
};

describe('one menu at a time', () => {
  it('closes the one that was open when another is opened', () => {
    // Each menu used to hold its own open state, so opening a second left the first standing: three
    // panels could be stacked over the park at once, which is three answers to "what am I doing".
    strip();
    openGroup('structure');
    expect(document.querySelectorAll('[data-part^="panel-"]').length).toBe(1);
    openGroup('barrier');
    const open = [...document.querySelectorAll('[data-part^="panel-"]')].map((p) => p.getAttribute('data-part'));
    expect(open, 'the first menu stayed open behind the second').toEqual(['panel-barrier']);
  });
});

describe('the wider colour picker', () => {
  it('is behind the + on a colour menu', () => {
    strip();
    const panel = openGroup('ground');
    fireEvent.click(panel.querySelector('[aria-label^="More"]')!);
    expect(panel.querySelector('[data-part="any-colour"]'),
      'the palette is all there is, and it is a fence').toBeTruthy();
  });

  it('takes a colour nothing in the palette offers', () => {
    const onDesign = vi.fn();
    strip(onDesign);
    const panel = openGroup('ground');
    fireEvent.click(panel.querySelector('[aria-label^="More"]')!);
    const any = panel.querySelector('[data-part="any-colour"]') as HTMLInputElement;
    fireEvent.change(any, { target: { value: '#123456' } });
    expect(onDesign, 'a colour off the palette went nowhere').toHaveBeenCalled();
    const [, design] = onDesign.mock.calls[onDesign.mock.calls.length - 1] as [string, ItemDesign];
    expect(design.colors.ground).toBe('#123456');
  });

  it('says what the colour currently is, so the picker opens on it', () => {
    strip();
    const panel = openGroup('ground');
    fireEvent.click(panel.querySelector('[aria-label^="More"]')!);
    const any = panel.querySelector('[data-part="any-colour"]') as HTMLInputElement;
    expect(any.value, 'it opens on black whatever the thing is').toMatch(/^#[0-9a-f]{6}$/i);
  });
});
