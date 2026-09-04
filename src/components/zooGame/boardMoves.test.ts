import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, decisionsIn } from './engine';
import type { ZooGameState } from './types';

// Moving a card across the board is a decision.
//
// It is the one the Sprint is made of - what the Developers took on today, and what they got to
// Done - and the Retrospective cannot inspect what nobody wrote down. So each move is recorded with
// the accountability that made it: only the Developers change the Sprint Backlog, which is why the
// game names them even when one person is playing all three.

/** A Sprint under way, with work forecast into it. */
function midSprint(): { s: ZooGameState; habitat: string } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const habitat = s.backlog.find((it) => it.category === 'enclosure')!.id;
  s = planSprint({ ...s, phase: 'planning' }, [habitat]);
  return { s: { ...s, dayStage: 'building', daySecondsLeft: 90 }, habitat };
}

const moves = (s: ZooGameState) => decisionsIn(s, s.sprintNumber).filter((d) => d.kind === 'moved');

describe('every move across the board is recorded', () => {
  it('records taking work into Doing, with what it was worth', () => {
    const { s, habitat } = midSprint();
    const started = reducer(s, { type: 'START_ITEM', id: habitat });
    const m = moves(started);
    expect(m.length, 'work was taken into Doing and nobody wrote it down').toBe(1);
    expect(m[0].what, 'the line does not say who, what, or how much').toMatch(/Developers took .+ into Doing \(\d+ points\)/);
    expect(m[0].by, 'the Sprint Backlog changed and the accountability was not named').toBe('developer');
  });

  it('names the seat that made the move, when a seat made it', () => {
    // In a shared game the person who moved the card is the record; playing alone the game names
    // the accountability the move belongs to instead.
    const { s, habitat } = midSprint();
    const started = reducer(s, { type: 'START_ITEM', id: habitat, by: 'scrum_master' });
    expect(moves(started)[0].by).toBe('scrum_master');
    expect(moves(started)[0].what).toMatch(/^The Scrum Master took/);
  });

  it('records reaching Done', () => {
    const { s, habitat } = midSprint();
    let out = reducer(s, { type: 'START_ITEM', id: habitat });
    // ...built and accepted, the way the board's own gate requires.
    out = { ...out, backlog: out.backlog.map((it) => (it.id === habitat
      ? { ...it, status: 'done' as const, acConfirmed: (it.acceptance ?? []).map(() => true),
          tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })) }
      : it)) };
    const done = reducer(out, { type: 'OPEN_ITEM', id: habitat });
    const last = moves(done)[moves(done).length - 1];
    expect(last.what, 'reaching Done - the move the Sprint is for - went unrecorded').toMatch(/moved .+ to Done \(\d+ points\)/);
  });

  it('records nothing when the move did not happen', () => {
    // The WIP limit, an unbuilt habitat, a card that is already in Doing: a refused move is not a
    // decision, and a log full of things that did not happen is a log nobody reads.
    const { s, habitat } = midSprint();
    const once = reducer(s, { type: 'START_ITEM', id: habitat });
    const twice = reducer(once, { type: 'START_ITEM', id: habitat });
    expect(moves(twice).length, 'starting the same item twice was recorded twice').toBe(1);

    const limited = reducer({ ...midSprint().s, wipLimit: 0 }, { type: 'SET_WIP_LIMIT', limit: 1 });
    const first = reducer(limited, { type: 'START_ITEM', id: habitat });
    const blocked = first.backlog.find((it) => it.status === 'committed' && !it.started && it.category !== 'exhibit');
    if (blocked) {
      const refused = reducer(first, { type: 'START_ITEM', id: blocked.id });
      expect(moves(refused).length, 'a move the WIP limit refused was recorded as if it happened').toBe(1);
    }
  });
});
