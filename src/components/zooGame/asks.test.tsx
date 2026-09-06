import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Asks } from './Asks';
import { asksNow } from './engine';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// What is being asked of you, on the screen where the work is.
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
    const s = sprint({}, { ...built, status: 'done', acConfirmed: [true, true, true, true],
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

describe('the panel', () => {
  const panel = (state: ZooGameState, props: Partial<Parameters<typeof Asks>[0]> = {}) => render(
    <MemoryRouter><Asks state={state} {...props} /></MemoryRouter>,
  );

  it('says whose each one is, and takes you to it - without a bar of buttons', () => {
    // "Why are there action buttons on messages?" - a message says what is being asked and opens
    // the thing it is about. Answering it belongs to the board, the bench and the park.
    const onOpenItem = vi.fn();
    const { container } = panel(sprint({}, built), { onOpenItem });
    expect(screen.getAllByText('PO').length, 'nothing says which accountability is being asked').toBeGreaterThan(0);
    const labels = [...container.querySelectorAll('[data-part="asks"] li button')]
      .map((b) => (b.textContent ?? ''));
    expect(labels.some((t) => /Check it against its criteria|Open it to visitors/.test(t)),
      'the messages grew action buttons again').toBe(false);
    fireEvent.click([...container.querySelectorAll('[data-part="asks"] li button')]
      .find((b) => /is built/.test(b.textContent ?? ''))!);
    expect(onOpenItem, 'the message named the work and then left you to find it').toHaveBeenCalled();
  });

  it('announces what just happened, from the log the Retrospective reads', () => {
    const s = sprint({ decisions: [{ sprint: 1, kind: 'moved', by: 'developer', what: 'The Developers took Lion Enclosure into Doing (5 points).' }] } as Partial<ZooGameState>, built);
    const { container } = panel(s);
    expect(container.textContent, 'nothing announced what the team had just done').toMatch(/took Lion Enclosure into Doing/);
  });

  it('puts your own accountability’s asks first', () => {
    const s = sprint({ carriedImpediment: { id: 'i1', title: 'A blocker', detail: 'x' } } as Partial<ZooGameState>, built);
    const { container } = panel(s, { seat: 'scrum_master' });
    const badges = [...container.querySelectorAll('[data-part="asks"] li span')]
      .map((e) => (e.textContent ?? '').trim()).filter((t) => ['PO', 'SM', 'Dev'].includes(t));
    expect(badges[0], 'the Scrum Master was shown somebody else’s work first').toBe('SM');
  });

  it('says so plainly when nobody is waiting on anything', () => {
    const { container } = panel(sprint({}, { started: false, design: undefined }), {});
    expect(container.textContent).toMatch(/Nothing is waiting|What are we taking next/);
  });
});
