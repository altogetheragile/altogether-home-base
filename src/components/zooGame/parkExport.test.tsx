import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { parkSvg, parkFilename, exportCaption } from './parkExport';
import { ExportPark } from './ExportPark';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Taking a picture of the zoo away with you.
//
// "Do we have an export facility on the isometric zoo? Can we have pdf and png formats?"
//
// The rasterising itself needs a browser - an Image, a canvas and a real SVG renderer - so what is
// held here is everything that is decided rather than drawn: what goes into the file, what the file
// is called, and what the page says it is.

const svgWith = (inner: string): SVGSVGElement => {
  const host = document.createElement('div');
  host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">${inner}</svg>`;
  return host.firstElementChild as SVGSVGElement;
};

describe('what goes into the file', () => {
  it('holds the animals still', () => {
    // The animals pace and the visitors walk, in SMIL. A still of a moving thing has to decide
    // where the moving things are, and the honest answer is where they were put - not frozen
    // mid-stride with one foot through a fence.
    const svg = svgWith('<g><animateMotion dur="3s" path="M0,0 L5,0"/><rect width="10" height="10"/></g>');
    const out = parkSvg(svg, { w: 100, h: 50 });
    expect(out, 'the export would have caught them mid-stride').not.toMatch(/animateMotion/);
    expect(out, 'it threw away the animal with the animation').toMatch(/<rect/);
  });

  it('takes every kind of animation out, not just the one', () => {
    const svg = svgWith('<g><animate/><animateTransform/><set/><circle r="1"/></g>');
    const out = parkSvg(svg, { w: 10, h: 10 });
    expect(out).not.toMatch(/<animate|<animateTransform|<set/);
  });

  it('leaves the drawing on the screen alone', () => {
    // Everything here happens to a copy. The park being exported has to hold still; the one being
    // looked at does not.
    const svg = svgWith('<g><animateMotion dur="3s"/></g>');
    parkSvg(svg, { w: 10, h: 10 });
    expect(svg.querySelectorAll('animateMotion').length, 'it stopped the live park moving').toBe(1);
  });

  it('says what kind of document it is, and how big', () => {
    // A viewBox alone tells a rasteriser the shape and not the scale, and a file with no namespace
    // is not an SVG as far as anything outside a browser is concerned.
    const out = parkSvg(svgWith('<rect/>'), { w: 1318, h: 520 });
    expect(out).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(out).toMatch(/width="1318"/);
    expect(out).toMatch(/height="520"/);
  });
});

describe('what the file is called', () => {
  // A trainer takes one of these at every Review and ends up with a folder. A folder of
  // "zoo-export (3).png" is a folder nobody can read.
  it('says which Sprint and which day', () => {
    expect(parkFilename({ sprintNumber: 2, dayNumber: 3, phase: 'sprint' })).toBe('zoo-sprint-2-day-3');
  });

  it('names the event instead, when the zoo is at one', () => {
    expect(parkFilename({ sprintNumber: 2, dayNumber: 3, phase: 'review' })).toBe('zoo-sprint-2-review');
  });

  it('still names something before any of that exists', () => {
    expect(parkFilename({})).toBe('zoo');
  });
});

describe('the line along the top of the PDF', () => {
  const state = (over: Partial<ZooGameState>) => ({ ...initialZooState(1), ...over } as ZooGameState);

  it('says which zoo this is and when it was', () => {
    const line = exportCaption(state({ phase: 'sprint', sprintNumber: 2, dayNumber: 3, productGoal: 'Open a zoo families love.' }));
    expect(line).toContain('Sprint 2, day 3');
    expect(line, 'a handout with no goal on it is a picture').toContain('Open a zoo families love.');
  });

  it('manages without a Product Goal rather than trailing a dash', () => {
    const line = exportCaption(state({ phase: 'sprint', sprintNumber: 1, dayNumber: 1, productGoal: '  ' }));
    expect(line).toBe('Sprint 1, day 1');
  });
});

describe('the control', () => {
  it('offers both formats, and says what each is for', () => {
    const { container } = render(<ExportPark state={initialZooState(1) as ZooGameState} />);
    fireEvent.click(container.querySelector('[data-part="export-park"]')!);
    const png = document.querySelector('[data-part="export-png"]');
    const pdf = document.querySelector('[data-part="export-pdf"]');
    expect(png, 'there is no PNG').toBeTruthy();
    expect(pdf, 'there is no PDF').toBeTruthy();
    expect(png?.textContent).toMatch(/slide|post/i);
    expect(pdf?.textContent).toMatch(/print|send/i);
  });

  it('says so when there is no drawing, rather than doing nothing', () => {
    // An export that silently does nothing is worse than one that says it could not: the second
    // tells you to try again, and the first teaches you the button is broken.
    const { container } = render(<ExportPark state={initialZooState(1) as ZooGameState} />);
    fireEvent.click(container.querySelector('[data-part="export-park"]')!);
    fireEvent.click(document.querySelector('[data-part="export-png"]')!);
    expect(document.querySelector('[data-part="export-failed"]')?.textContent ?? '')
      .toMatch(/no drawing/i);
  });
});
