import { describe, it, expect } from 'vitest';
import { checkDodLine, dodKind, dodVerdicts } from './dodChecks';
import { DEFAULT_DOD, DOD_LIBRARY, initialZooState } from './config';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { mayTake } from './seatRules';
import type { ZooGameState, BacklogItem, ZooAction } from './types';
import type { SeatName } from './useZooSessions';

// What the park can see about a Definition of Done, and - just as important - what it cannot.
//
// The rule this file holds: a line the game cannot read must come back as judgement rather than as
// a guess. Being wrong in that direction costs the team nothing; being wrong the other way means
// the game claims to have checked something nobody checked.

const item = (o: Partial<BacklogItem> = {}): BacklogItem => ({
  id: 'i1', name: 'Lion Enclosure', zone: 'Big Cats', category: 'enclosure', status: 'committed',
  estimate: 5, acceptance: [], acConfirmed: [], tasks: [], ...o,
} as BacklogItem);

const park = (items: BacklogItem[], o: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), backlog: items, connectors: [], ...o }) as ZooGameState;

describe('the Definition of Done, as far as the park can see it', () => {
  it('reads a second pair of hands, which nothing in the game ever looked at before', () => {
    const line = 'Peer-reviewed by another Developer';
    const alone = item({ assignedDevs: ['d1'] });
    const pair = item({ assignedDevs: ['d1', 'd2'] });
    expect(checkDodLine(park([alone]), alone, line)).toEqual({ kind: 'fact', met: false, evidence: 'one Developer worked it alone' });
    expect(checkDodLine(park([pair]), pair, line)).toEqual({ kind: 'fact', met: true, evidence: '2 Developers worked it' });
    expect(checkDodLine(park([item()]), item(), line))
      .toEqual({ kind: 'fact', met: false, evidence: 'nobody picked it up' });
  });

  it('counts the acceptance criteria rather than saying yes or no', () => {
    const it2 = item({ acceptance: ['a', 'b', 'c'], acConfirmed: [true, false, true] });
    // The count is the point: "1 outstanding" is actionable where "not met" is a shrug.
    expect(checkDodLine(park([it2]), it2, 'Meets its acceptance criteria'))
      .toEqual({ kind: 'fact', met: false, evidence: '2 of 3 accepted' });
  });

  it('answers escape-proof for a habitat, and says nothing about a kiosk', () => {
    const line = 'Enclosures secure and escape-proof';
    const fenced = item({ design: { parts: {}, colors: { fence: '#6b5b45' } } } as Partial<BacklogItem>);
    expect(checkDodLine(park([fenced]), fenced, line)).toMatchObject({ kind: 'fact', met: true });

    const kiosk = item({ id: 'k', category: 'amenity', template: 'kiosk', name: 'Kiosk' });
    // Not "no". A criterion that cannot apply is not a criterion this item failed.
    expect(checkDodLine(park([kiosk]), kiosk, line)).toEqual({ kind: 'na', evidence: 'nothing here to fence' });
  });

  it('asks the visitors’ own pathfinding whether the zone can be reached', () => {
    const enc = item({ pos: { x: 200, y: 200 } });
    const line = 'Safe and accessible to all visitors';
    expect(checkDodLine(park([enc]), enc, line)).toMatchObject({ kind: 'fact', met: false });

    const reached = park([enc], { connectors: [
      { id: 'c1', itemId: 'p1', a: { x: 200, y: 420 }, b: { x: 200, y: 200, featureId: 'i1' }, bends: [], thickness: 14, color: '#b9a888' },
    ] } as Partial<ZooGameState>);
    expect(checkDodLine(reached, enc, line)).toMatchObject({ kind: 'fact', met: true });
  });

  it('reads a building’s own sign, and otherwise looks for a signpost in the zone', () => {
    const line = 'Signposted so visitors can find it';
    const shop = item({ id: 's', category: 'amenity', name: 'Gift Shop',
      design: { parts: { sign: 'on' }, colors: { sign: '#e6a53a' } } } as Partial<BacklogItem>);
    expect(checkDodLine(park([shop]), shop, line)).toMatchObject({ kind: 'fact', met: true });

    const enc = item();
    expect(checkDodLine(park([enc]), enc, line)).toMatchObject({ kind: 'fact', met: false });
    const posts = park([enc, item({ id: 'sp', name: 'Signposts', category: 'flora', template: 'signpost', status: 'open' })]);
    expect(checkDodLine(posts, enc, line)).toMatchObject({ kind: 'fact', met: true });
  });

  it('treats an animal as placed when it is living in a habitat that exists', () => {
    // An exhibit has no position of its own. Reading `placed` literally called work that the
    // Developers built exactly where it belongs "not placed yet".
    const home = item({ id: 'e1', name: 'Lion Enclosure', status: 'open' });
    const lion = item({ id: 'a1', name: 'Lion', category: 'exhibit', enclosureId: 'e1' });
    expect(checkDodLine(park([home, lion]), lion, 'Placed on the park, ready to open'))
      .toEqual({ kind: 'fact', met: true, evidence: 'in the Lion Enclosure' });

    const homeless = item({ id: 'a2', name: 'Zebra', category: 'exhibit', enclosureId: 'nope' });
    expect(checkDodLine(park([homeless]), homeless, 'Placed on the park, ready to open'))
      .toMatchObject({ kind: 'fact', met: false });
  });

  it('leaves judgement alone rather than guessing at it', () => {
    const enc = item();
    for (const line of ['No known defects', 'On-brand and fits the park look',
      'Cleaned up - no leftover materials or hazards', 'The whole team is happy with it']) {
      expect(checkDodLine(park([enc]), enc, line), `"${line}" was answered by a game that cannot know`).toBeNull();
      expect(dodKind(line)).toBe('judgement');
    }
  });

  it('can answer every line of the Definition of Done a game starts with', () => {
    // Not a coincidence to preserve: the default DoD is what most players will ever see, and a
    // default full of lines the park shrugs at would teach that the agreement is decoration.
    for (const line of DEFAULT_DOD) {
      expect(dodKind(line), `the default DoD line "${line}" is not one the park can read`).toBe('fact');
    }
  });

  it('answers more of the coached library than it shrugs at', () => {
    const lines = DOD_LIBRARY.flatMap((g) => g.items);
    const facts = lines.filter((l) => dodKind(l) === 'fact');
    expect(facts.length, 'most of what the game suggests is something it cannot read')
      .toBeGreaterThan(lines.length / 2);
  });
});

describe('increment one changes nothing about what Done costs', () => {
  const AI: SeatName[] = ['scrum_master', 'developer'];

  it('an item still reaches Done with a Definition of Done the park can see is unmet', () => {
    let s: ZooGameState = initialZooState(7);
    const act = (a: ZooAction) => { s = reducer(s, a); };
    const settle = (limit = 400) => {
      for (let i = 0; i < limit; i += 1) {
        let moved = false;
        for (const seat of AI) {
          const m = aiTurn(s, seat);
          if (!m || !mayTake(m.action.type, { seat }).allowed) continue;
          s = reducer(s, m.action); moved = true; break;
        }
        if (!moved) return;
      }
      throw new Error('the seats never ran out of moves');
    };

    act({ type: 'WRITE_BACKLOG', brief: { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' } });
    act({ type: 'SET_PRODUCT_GOAL', goal: 'Open a zoo families come back to' });
    // A demanding agreement, none of which the game enforces yet.
    act({ type: 'SET_DOD', dod: ['Peer-reviewed by another Developer', 'Signposted so visitors can find it',
      'Safe and accessible to all visitors'] });
    act({ type: 'AGREE_DOD' });
    act({ type: 'SET_PHASE', phase: 'planning' });
    settle();
    act({ type: 'SET_SPRINT_GOAL', goal: 'Open the Big Cats zone so families have something to see' });
    settle();
    act({ type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    settle();
    act({ type: 'PLAN_SPRINT', ids: s.forecast, refinementPoints: 0 });
    for (let day = 0; day <= s.sprintDays && s.phase === 'sprint'; day += 1) {
      settle();
      act({ type: 'END_DAY' });
      if (s.dayStage === 'dailyScrum') settle();
    }

    const done = s.backlog.filter((x) => x.status === 'done' || x.status === 'open');
    expect(done.length, 'nothing was finished, so this proves nothing about the gate').toBeGreaterThan(0);
    // ...and the park can see that the agreement was not kept, which is the whole of increment one:
    // it says so, and it lets the work through anyway.
    const unmet = done.flatMap((x) => dodVerdicts(s, x))
      .filter((v) => v.answer?.kind === 'fact' && !v.answer.met);
    expect(unmet.length, 'nothing was left unmet, so the test is not exercising the gap').toBeGreaterThan(0);
  });
});
