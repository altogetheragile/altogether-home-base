import { describe, it, expect } from 'vitest';
import { drawBoard } from './boardDrawing.generated.js';
import { BOARD_INPUTS, BOARD_OUTPUTS, BOARD_DESC } from './boardLabels';

// The board is markup built by joining strings, and its text is editable.
//
// That is a new combination. While the words lived in the design file they were ours and fixed;
// now anybody who can reach the copy editor can put a sentence on the board, and a sentence
// containing "</text><script>" would be a script tag - on the public page, read by everyone.
//
// The design file has an 'esc' helper for exactly this and never calls it.

const draw = (T: Parameters<typeof drawBoard>[0]) => drawBoard(T).svg;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

describe('a label that tries to break out of the drawing', () => {
  it('cannot close the text element it is inside', () => {
    const inputs = clone(BOARD_INPUTS);
    inputs[0][0].t = '</text><script>alert(1)</script><text>';
    const svg = draw({ INPUTS: inputs, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC });
    expect(svg, 'a script tag reached the board').not.toMatch(/<script/i);
    expect(svg, 'the text element was closed from inside a label').not.toMatch(/<\/text><script/i);
  });

  it('cannot do it through the Inspect and Adapt lines either', () => {
    const desc = clone(BOARD_DESC);
    desc[0][0] = '<img src=x onerror=alert(1)>';
    const svg = draw({ INPUTS: BOARD_INPUTS, OUTPUTS: BOARD_OUTPUTS, DESC: desc });
    expect(svg, 'an element was written by an editable line').not.toMatch(/<img/i);
  });

  it('or through the name a chip answers to', () => {
    const inputs = clone(BOARD_INPUTS);
    inputs[0][0].name = '<script>x</script>';
    const svg = draw({ INPUTS: inputs, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC });
    expect(svg, 'the hover label let a tag through').not.toMatch(/<script/i);
  });

  it('still reads as what somebody typed, rather than being thrown away', () => {
    // Escaped, not stripped: a trainer who types a < sees one and can take it out again.
    const inputs = clone(BOARD_INPUTS);
    inputs[0][0].t = 'Less < than';
    expect(draw({ INPUTS: inputs, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC }))
      .toMatch(/Less ‹ than/);
  });
});

describe('the words we ship', () => {
  it('are untouched by it', () => {
    // Nothing legitimate on this board carries < or >, so the guard is invisible in normal use -
    // including through "Past Performance & Capacity", which is why & is left alone: escaping it
    // would change the length the board wraps its text by.
    const svg = draw({ INPUTS: BOARD_INPUTS, OUTPUTS: BOARD_OUTPUTS, DESC: BOARD_DESC });
    // Raw, not escaped. That is the point: & is left exactly as it was.
    expect(svg).toContain('Past Performance & Capacity');
    expect(svg).not.toMatch(/‹|›/);
  });
});
