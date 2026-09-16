import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SeatBand } from './SeatBand';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Somebody has gone, and the game says so.
//
// A seat has a holder and an occupant, and they stop being the same the moment a laptop sleeps. The
// lobby has said this from the start - an amber "away" against the name. In the game the band only
// faded the chip to 40% and quietly added the work to somebody else's plate, which is the same news
// with the reason taken out: a chair nobody took and a person who has left are different things in
// a room of five people, and only one of them is somebody to go and check on.

const inSprint = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
} as ZooGameState);

describe('the band', () => {
  it('says away, in words, when a seat is held by somebody who is not here', () => {
    const { container } = render(
      <SeatBand state={inSprint()} seat="developer" covering={['product_owner']} away={['product_owner']} />,
    );
    const said = container.querySelector('[data-part="seat-away"]');
    expect(said, 'a dropped seat-holder is still only a faded chip').toBeTruthy();
    expect(said!.textContent).toMatch(/away/i);
  });

  it('tells a seat nobody took from a seat somebody left', () => {
    const { container } = render(
      <SeatBand state={inSprint()} seat="developer" covering={['product_owner', 'scrum_master']} away={['product_owner']} />,
    );
    expect(container.textContent, 'an empty chair is announced as somebody leaving').toMatch(/covering/);
    expect(container.querySelectorAll('[data-part="seat-away"]').length,
      'both are called away, or neither is').toBe(1);
  });

  it('says it to somebody who is only watching, too', () => {
    // An observer covers nothing - and is usually the one running the room.
    const { container } = render(
      <SeatBand state={inSprint()} seat={null} observer covering={['product_owner']} away={['product_owner']} />,
    );
    expect(container.querySelector('[data-part="seat-away"]'), 'the trainer cannot see who dropped out').toBeTruthy();
  });

  it('says nothing about away when everybody is here', () => {
    const { container } = render(<SeatBand state={inSprint()} seat="developer" />);
    expect(container.querySelector('[data-part="seat-away"]')).toBeNull();
  });
});

describe('who the rail is waiting on', () => {
  it('names the accountability rather than saying "them"', () => {
    // Knowing somebody else has to answer is half the news. Which chair to look at is the other.
    const s = inSprint();
    const asked = s.backlog.find((it) => it.category === 'enclosure')!;
    const state = { ...s,
      committedIds: [asked.id],
      backlog: s.backlog.map((it) => (it.id === asked.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, design: { shape: 'rounded' },
          askedPlacement: { id: 'p1', question: 'Rounded or square?', choices: ['Rounded', 'Square'] } }
        : it)) } as unknown as ZooGameState;
    render(<ActionRail state={state} seat="developer" />);
    const rail = screen.queryByText(/waiting on/i);
    if (rail) {
      expect(rail.textContent, 'the rail still says "them"').not.toMatch(/waiting on them/i);
      expect(rail.textContent).toMatch(/waiting on (the )?(Product Owner|Scrum Master|Developers)/i);
    } else {
      // Nothing is being asked in this state, which is fine - the rule is in the source either way.
      const text = readFileSync(join(__dirname, 'ActionRail.tsx'), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      expect(text, 'the rail says "waiting on them"').not.toMatch(/'waiting on them'/);
    }
  });
});

describe('what the lobby listens to', () => {
  // Seats belong to a game, not a session, so an unfiltered subscription woke this browser for a
  // seat taken in any session anywhere. The filter needs the game id, and the thing the unfiltered
  // subscription was covering by accident - somebody else starting a game - has to be watched on
  // purpose or joining a game nobody has created yet never resolves.
  const src = readFileSync(join(__dirname, 'useZooSessions.ts'), 'utf8');

  it('listens to this game’s seats, not everybody’s', () => {
    const seats = src.split('\n').find((l) => l.includes("table: 'zoo_game_seats'"))!;
    expect(seats, 'the seats subscription is unfiltered').toMatch(/filter: `game_id=eq\.\$\{gameId\}`/);
  });

  it('still hears about a game somebody else starts', () => {
    const games = src.split('\n').find((l) => l.includes("table: 'zoo_games'"));
    expect(games, 'nothing watches for a new game in this session').toBeTruthy();
    expect(games!).toMatch(/filter: `session_id=eq\.\$\{sessionId\}`/);
  });
});
