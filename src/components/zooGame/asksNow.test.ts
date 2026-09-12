import { describe, it, expect } from 'vitest';
import { asksNow } from './engine';
import { enclosureAcceptance } from './design';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// What is being asked of whom, read off the game's own state.
//
// "How do I know what to do as a PO? e.g. to tick off ACs?" - and the honest answer was that you
// did not. The game knew the Developers had built something and were waiting on its criteria, that
// a question had been put and not answered, that work had met the Definition of Done and nobody had
// released it. It said none of it where the work was.

const sprint = (over: Partial<ZooGameState> = {}, item: Partial<BacklogItem> = {}): ZooGameState => {
  const base = initialZooState(3);
  const held = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    committedIds: [held.id],
    backlog: base.backlog.map((it) => (it.id === held.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: ['dev1'], ...item }
      : it)),
    ...over,
  } as ZooGameState;
};
const built = { design: { parts: {}, colors: {} } } as unknown as Partial<BacklogItem>;

describe('what the game is asking of whom', () => {
  it('asks the Product Owner to check what the Developers built', () => {
    const asks = asksNow(sprint({}, built));
    const accept = asks.find((a) => a.kind === 'accept')!;
    expect(accept, 'nothing said the built work was waiting on anybody').toBeTruthy();
    expect(accept.of).toBe('product_owner');
    expect(accept.text).toMatch(/is built/);
    expect(accept.text, 'it does not say how much is left to check').toMatch(/criteri/);
    expect(accept.from, 'nobody is asking - it just appeared').toBeTruthy();
  });

  it('puts the Developers’ question where it can be answered', () => {
    const s = sprint({}, built);
    const item = s.backlog.find((it) => it.started)!;
    const asked = { ...s, pendingPlacement: { itemId: item.id, askedAt: 80 } } as unknown as ZooGameState;
    const q = asksNow(asked).find((a) => a.kind === 'question')!;
    expect(q.of).toBe('product_owner');
    expect(q.text).toContain(item.name);
  });

  it('says when Done work is sitting unreleased', () => {
    const s = sprint({}, { ...built, status: 'done', acConfirmed: enclosureAcceptance().map(() => true),
      tasks: [{ id: 't', label: 'Get the PO’s sign-off', done: true }] } as Partial<BacklogItem>);
    const release = asksNow(s).find((a) => a.kind === 'release');
    expect(release, 'work met the Definition of Done and nothing said it was still shut').toBeTruthy();
    expect(release!.of).toBe('product_owner');
  });

  it('asks the Developers for a second pair of eyes, and for something to be started', () => {
    const one = asksNow(sprint({}, built)).find((a) => a.kind === 'review');
    expect(one, 'the Definition of Done asks for a review and nothing asked anybody for it').toBeTruthy();
    expect(one!.of).toBe('developer');

    const idle = asksNow(sprint({}, { started: false }));
    expect(idle.some((a) => a.kind === 'start' && a.of === 'developer'),
      'a Sprint with nothing in progress said nothing about it').toBe(true);
  });

  it('leaves what is still in the way with the Scrum Master', () => {
    const s = sprint({ carriedImpediment: { id: 'i1', title: 'The paint delivery is late', detail: 'x' } } as Partial<ZooGameState>);
    const blocker = asksNow(s).find((a) => a.kind === 'blocker')!;
    expect(blocker.of).toBe('scrum_master');
    expect(blocker.text).toContain('The paint delivery is late');
  });

  it('asks nothing at all outside a Sprint', () => {
    expect(asksNow({ ...initialZooState(3), phase: 'refine' } as ZooGameState)).toEqual([]);
  });
});
