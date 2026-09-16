import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// One word, one thing.
//
// The game teaches vocabulary as much as it teaches Scrum, and a word that means two things on two
// screens teaches neither. Three that had drifted:
//
//   "zone" and "area" for the same piece of ground;
//   "back" for both refusing built work (which stays in the Sprint) and handing an item out of the
//   Sprint altogether;
//   "Done" for both met-the-Definition-of-Done and open-to-visitors, which is the distinction the
//   Done column exists to make.
//
// Read off the source rather than through a render, because these are rules about every screen and
// a render only covers the one it mounted.

const DIR = __dirname;
const sources = readdirSync(DIR)
  .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.'))
  .map((f) => ({ f, text: readFileSync(join(DIR, f), 'utf8') }));

/** The bits of a source file a player can actually read: quoted strings and text between tags.
 *  Comments and identifiers are not copy, and `item.zone` is a field name, not a word on a screen.
 *
 *  Prose only, and prose is taken to start with a capital: it keeps object literals and fragments
 *  of expressions out (`, zone: `, `${name} planted around ${zone}`), at the price of missing a
 *  sentence that begins lower case. The rule is worth having imperfectly - it is a net, not a
 *  proof. */
const copyIn = (text: string): string[] => {
  const noComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [
    ...noComments.matchAll(/'([^'\\\n]{6,})'|"([^"\\\n]{6,})"|>\s*([A-Z][^<>{}\n]{5,})\s*</g),
  ].map((m) => m[1] ?? m[2] ?? m[3])
    .filter((s) => / /.test(s) && /^[A-Z]/.test(s) && !s.includes('${'));
};

describe('the ground is called an area', () => {
  it('is never called a zone on screen', () => {
    // "zone" survives as a field name, a plot lookup and the dead spelling of a reworded criterion
    // (parkChecks keeps those deliberately, so saves in flight still match). None of those is copy.
    const found: string[] = [];
    for (const { f, text } of sources) {
      // The two lists of dead criterion spellings, kept on purpose so a game already in play, and
      // every save ever taken, still matches its own acceptance criteria.
      if (f === 'parkChecks.ts' || f === 'design.ts') continue;
      for (const s of copyIn(text)) {
        if (/\bzones?\b/i.test(s) && !/^[a-z-]+$/.test(s)) found.push(`${f}: ${s.slice(0, 70)}`);
      }
    }
    expect(found, `the ground is called a zone here:\n${found.join('\n')}`).toEqual([]);
  });
});

describe('the two ways of giving something back', () => {
  // They are different acts with different destinations, and they both used the word "back".
  it('says where each one goes', () => {
    const board = readFileSync(join(DIR, 'SprintBoard.tsx'), 'utf8');
    const cards = readFileSync(join(DIR, 'Board.tsx'), 'utf8');
    expect(board, 'handing an item back does not say where it goes')
      .toMatch(/Hand it back to the Product Backlog/);
    expect(cards, 'refusing built work does not say where it goes - and it is not out of the Sprint')
      .toMatch(/Send it back to Doing/);
  });
});

describe('Done and open are two different things', () => {
  const base = (): ZooGameState => {
    const s = initialZooState(3);
    return { ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
      daySecondsLeft: 80 } as ZooGameState;
  };
  const noop = () => {};
  const board = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
    <MemoryRouter>
      <SprintBoard state={state}
        onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
        onPull={noop} onSplitEpic={noop} onAssignDev={noop}
        onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
        onStartDay={noop} onBuilding={noop} {...props} />
    </MemoryRouter>,
  );

  it('does not tell an empty Done column that Done means open', () => {
    // The hint said "Done is built, accepted and open" directly above a comment saying the opposite,
    // and opening is the Product Owner's separate call on the same card.
    const { container } = board(base());
    const done = container.querySelector('[data-column="done"]')!;
    expect(done.textContent, 'the Done column still defines Done as open to visitors')
      .not.toMatch(/Done is built, accepted and open/);
    expect(done.textContent, 'it does not say what Done is').toMatch(/built and accepted/i);
  });

  it('never says an item is open because it is Done', () => {
    const bad: string[] = [];
    for (const { f, text } of sources) {
      for (const s of copyIn(text)) {
        // "Done, and NOT open to visitors yet" is the distinction, not a breach of it.
        if (/\bDone\b.{0,30}\b(and|means|is)\b.{0,10}\bopen\b/i.test(s) && !/\bnot open\b/i.test(s)) {
          bad.push(`${f}: ${s.slice(0, 70)}`);
        }
      }
    }
    expect(bad, `Done is equated with open here:\n${bad.join('\n')}`).toEqual([]);
  });
});

describe('the last day of a Sprint', () => {
  const lastDay = (over: Partial<ZooGameState> = {}): ZooGameState => {
    const s = initialZooState(3);
    const take = s.backlog.filter((it) => !it.unsized && it.category === 'enclosure').slice(0, 1);
    return {
      ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
      dayNumber: s.sprintDays, daySecondsLeft: 40,
      committedIds: take.map((it) => it.id),
      backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id)
        ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true } : it)),
      ...over,
    } as ZooGameState;
  };
  const noop = () => {};
  const board = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
    <MemoryRouter>
      <SprintBoard state={state}
        onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
        onPull={noop} onSplitEpic={noop} onAssignDev={noop}
        onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
        onStartDay={noop} onBuilding={noop} {...props} />
    </MemoryRouter>,
  );

  it('asks before it ends the Sprint, and says what it costs', () => {
    // Ending Day 1 gives back the rest of the day. Ending the LAST day ends the Sprint, and
    // unfinished work goes back to the Product Backlog at the Review. The same button did both.
    const onEndDay = vi.fn();
    board(lastDay(), { onEndDay });
    // The day's dock is portalled and fixed, so it is in the document rather than under the board.
    const ask = document.querySelector('[data-part="end-sprint"]')!;
    expect(ask, 'the last day ends the Sprint with no warning').toBeTruthy();
    expect(ask.textContent, 'it does not say what is unfinished').toMatch(/1 unfinished/);
    fireEvent.click(ask);
    expect(onEndDay, 'asking ended the Sprint anyway').not.toHaveBeenCalled();
    const yes = document.querySelector('[data-part="end-sprint-confirm"]')!;
    expect(yes.textContent, 'the confirm does not say where the work goes').toMatch(/Product Backlog/);
    fireEvent.click(yes);
    expect(onEndDay, 'confirming did not end the Sprint').toHaveBeenCalled();
  });

  it('does not ask on an ordinary day', () => {
    // A dialog over every day is a dialog nobody reads by Sprint 2.
    board(lastDay({ dayNumber: 1 }));
    expect(document.querySelector('[data-part="end-sprint"]'), 'day 1 asks to end the Sprint').toBeNull();
    expect(document.querySelector('[data-part="end-day"]'), 'day 1 has no End Day').toBeTruthy();
  });
});
