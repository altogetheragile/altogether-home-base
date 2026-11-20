import type { ZooGameState } from './types';

/** A second Developer on the item: the review the shipped Definition of Done asks for before Done.
 *  For tests that walk an item to Done by hand - in play the rail or the Developers give it. */
export function reviewed(state: ZooGameState, id: string): ZooGameState {
  const devs = state.team.developers.map((d) => d.id);
  return { ...state, backlog: state.backlog.map((it) => {
    if (it.id !== id) return it;
    const on = it.assignedDevs ?? [];
    const more = devs.filter((d) => !on.includes(d)).slice(0, Math.max(0, 2 - on.length));
    return { ...it, assignedDevs: [...on, ...more] };
  }) };
}

/** The Developers' plan finished - every step but the Product Owner's sign-off - which is what has
 *  to be true before she is asked to look. For tests that ask by hand. */
export function planFinished(state: ZooGameState, id: string): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id !== id ? it : {
    ...it, tasks: (it.tasks ?? []).map((t) => (/sign[- ]?off/i.test(t.label) ? t : { ...t, done: true })),
  })) };
}
