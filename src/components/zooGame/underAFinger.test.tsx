import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Doorway } from './ZooLobby';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TAP } from './ui/tokens';

vi.mock('./useZooSessions', () => ({
  useZooSessions: () => ({ createSession: async () => null, joinByCode: async () => null, busy: false, error: null }),
}));

// Things you press with a finger, and things a screen reader has to name.
//
// This game is taught on a tablet in a training room. Ordering a Backlog is the Product Owner's
// central act and it was a 12px chevron, then a 36px box - still under a fingertip. And the lobby's
// two fields were named by their card headings, so the session-name box announced itself as "Start
// a session", which is what the button does rather than what you type in the box.

describe('a target you can hit', () => {
  it('is 44 square, whatever the glyph inside it measures', () => {
    // h-11/w-11 is 44px in this scale. Written as a test because the number is the whole point:
    // it has been raised twice and stopped short both times.
    expect(TAP).toMatch(/\bh-11\b/);
    expect(TAP).toMatch(/\bw-11\b/);
  });

  it('is what the reorder chevrons sit in, on both Backlogs', () => {
    const board = readFileSync(join(__dirname, 'Board.tsx'), 'utf8');
    const sprint = readFileSync(join(__dirname, 'SprintBoard.tsx'), 'utf8');
    for (const [name, text] of [['the Product Backlog', board], ['the Sprint Backlog', sprint]] as const) {
      const reorder = text.split('\n').filter((l) => /Chevron(Up|Down)/.test(l) && /w-9|h-9|h-7/.test(l));
      expect(reorder, `${name}'s reorder chevrons are back to a hand-sized box: ${reorder.join(' | ')}`).toEqual([]);
      expect(text.includes('TAP'), `${name} does not use the shared target size`).toBe(true);
    }
  });
});

describe('two targets that do not fight each other', () => {
  it('lays the Product Backlog pair side by side, not stacked', () => {
    // A row on that list is 44 tall, so two stacked 44s are 100 and overflow it. Measured in a
    // browser after the targets were raised: a row's "down" covered 38 of the 44 pixels of the
    // next row's "up", so a tap near the boundary moved the wrong item the wrong way. Bigger and
    // worse. jsdom has no layout to measure, so what is guarded here is the arrangement.
    const text = readFileSync(join(__dirname, 'Board.tsx'), 'utf8');
    const lead = text.slice(text.indexOf('Move ${it.name} up the Product Backlog') - 900,
      text.indexOf('Move ${it.name} up the Product Backlog'));
    expect(lead, 'the reorder pair is stacked again, and will overflow its row').not.toMatch(/flex-col/);
  });
});

describe('the lobby says what each box holds', () => {
  const lobby = () => render(<Doorway onCreated={() => {}} onJoined={() => {}} />);

  it('names the session field for what you type, not for what the button does', () => {
    lobby();
    expect(screen.getByLabelText(/session name/i), 'the name field is not labelled').toBeTruthy();
    expect(screen.queryByLabelText(/^start a session$/i),
      'the field is still named after the act rather than the content').toBeNull();
  });

  it('names the code field, and still says which card is which', () => {
    lobby();
    expect(screen.getByLabelText(/six-letter code/i), 'the code field is not labelled').toBeTruthy();
    // The headings stay: two cards that both hold one text box need telling apart.
    expect(screen.getByText(/^Start a session$/), 'the card lost its heading').toBeTruthy();
    expect(screen.getByText(/^Join a session$/), 'the card lost its heading').toBeTruthy();
  });
});
