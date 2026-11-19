import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { isReady, decisionsIn, startOnTheBoard } from './engine';
import { nextStep } from './nextFix';
import type { ZooGameState } from './types';

// From the eleventh scrum-master playtest (playtest-report-sm11).

describe('the Retrospective, on who chose the Sprint Backlog playing alone', () => {
  // Playing alone, no seat travels on a move, and the forecast was left with nobody's name on it.
  // The persona had pressed "Add Lion Enclosure to the Sprint" itself, and the Retrospective read
  // back: "The Sprint Backlog arrived chosen... Nobody here picked it."
  it('says the Developers chose it, because you hold their seats', () => {
    let s: ZooGameState = initialZooState(7);
    s = reducer(s, { type: 'WRITE_BACKLOG', brief: { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' } });
    s = reducer(s, { type: 'SET_PRODUCT_GOAL', goal: 'Open a zoo families come back to' });
    s = reducer(s, { type: 'AGREE_DOD' });
    s = reducer(s, { type: 'SET_PHASE', phase: 'planning' });
    // Split the top epic, as the persona did, and size what comes out.
    const epic = s.backlog.find((it) => it.category === 'epic')!;
    s = reducer(s, { type: 'SPLIT_EPIC', id: epic.id, memberIds: (epic.epicMembers ?? []).map((m) => m.id) });
    let pick = s.backlog.find((it) => it.status === 'backlog' && isReady(it));
    if (!pick) {
      const first = s.backlog.find((it) => it.status === 'backlog' && it.category === 'enclosure')!;
      s = reducer(s, { type: 'ESTIMATE_ITEM', id: first.id, points: 5 });
      pick = s.backlog.find((it) => it.id === first.id && isReady(it));
    }
    expect(pick, 'nothing ready to forecast').toBeTruthy();
    s = reducer(s, { type: 'SET_FORECAST', ids: [pick!.id] });
    s = reducer(s, { type: 'PLAN_SPRINT', ids: [pick!.id] });
    const said = decisionsIn(s, 1).map((d) => d.what).join(' | ');
    expect(said).toContain('The Developers chose the Sprint Backlog');
    expect(said).not.toContain('Nobody here picked it');
    expect(s.forecastBy, 'the next Sprint starts with nobody yet').toBeUndefined();
  });
});

describe('the card in Doing, once it stands on the park', () => {
  // "Next: build it on the park" was read eleven times by somebody looking at the enclosure on the
  // park, with a high fence round it. It now names the first thing the park says fails.
  it('names what fails, not "build it on the park"', () => {
    const s0 = startOnTheBoard(initialZooState(1) as ZooGameState);
    const item = s0.backlog.find((it) => it.status === 'committed' && it.category === 'enclosure')
      ?? s0.backlog.find((it) => it.status === 'committed')!;
    // Started is on the park: it is drawn there whether or not anybody chose its spot.
    const s = reducer(s0, { type: 'START_ITEM', id: item.id });
    const said = nextStep(s, s.backlog.find((it) => it.id === item.id)!);
    expect(said).not.toBe('Next: build it on the park');
    expect(said).toMatch(/^Next: /);
  });
});
