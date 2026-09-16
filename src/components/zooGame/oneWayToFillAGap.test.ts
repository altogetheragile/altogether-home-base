import { describe, it, expect } from 'vitest';
import { readSave, stampSave, SAVE_VERSION } from './zooSaves';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// Everything a save can be missing is filled in one place.
//
// It used to be two, and they both thought they were the one. `readSave` filled two fields by name;
// the reducer's LOAD_GAME merged the save over a fresh state, which fills every field and WINS,
// because the loaded state is spread second.
//
// So the version ladder in `readSave` looked maintained while doing nothing, and the first
// migration that changed what a field MEANS - rather than adding a new one - would have been
// silently overwritten with the value it was migrating away from. Nothing would have failed. The
// game would just have been quietly wrong about an old save, which is the worst way for a save
// format to break, and the needs model is about to start changing what fields mean.

const saved = (): ZooGameState => stampSave(initialZooState(3) as ZooGameState);
const load = (state: ZooGameState) => reducer(initialZooState(9) as ZooGameState, { type: 'LOAD_GAME', state });

describe('reading a save', () => {
  it('fills what an older one is missing', () => {
    // A save from before the zoo's value was counted, before the signal log existed, and before
    // anybody wrote a version on it.
    const old = { ...saved() } as Partial<ZooGameState>;
    delete old.value; delete old.lastLedger; delete old.signalLog; delete old.version;
    const read = readSave(old);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.state.value, 'a resumed game starts its value at NaN').toBe(0);
    expect(read.state.signalLog).toEqual([]);
    expect(read.state.version).toBe(SAVE_VERSION);
    expect(read.note, 'an unversioned save loads without saying so').toMatch(/earlier version/i);
  });

  it('refuses one from a newer game, and one that lies about its version', () => {
    expect(readSave({ ...saved(), version: SAVE_VERSION + 1 }).ok).toBe(false);
    expect(readSave({ ...saved(), version: 'two' }).ok).toBe(false);
    expect(readSave({ ...saved(), version: -1 }).ok).toBe(false);
    expect(readSave({ nope: true }).ok, 'anything with no Backlog on it is not a save').toBe(false);
  });
});

describe('loading one', () => {
  it('takes the snapshot as it is, and adds nothing to it', () => {
    // The contract, stated as an identity: what `readSave` produced is what the game resumes.
    //
    // Worth being exact about what the old merge did and did not do, because I had it wrong when I
    // wrote this up. `{ ...fresh, ...save }` spreads the SAVE second, so a migrated value survived
    // it - the merge could not overwrite a migration. What it did was fill any key the save did not
    // have, from a fresh game. Which means a migration that needs to REMOVE a field, or clear one,
    // could not: the fresh default came straight back, and nothing anywhere said so.
    // Asserted on the KEYS rather than on the whole object: loading runs the park's checks, which
    // is right - a resumed game should know what its own park says - and that moves verdicts about.
    // What must not happen is a key arriving that the save never had.
    const mine = { ...saved(), sprintNumber: 4, productGoal: 'Mine, not the default' } as ZooGameState;
    const after = load(mine);
    const added = Object.keys(after).filter((k) => !(k in mine));
    expect(added, 'the load added fields the save did not have, from a fresh game').toEqual([]);
    expect(after.sprintNumber).toBe(4);
    expect(after.productGoal).toBe('Mine, not the default');
  });

  it('lets a migration take a field away, which the merge could not', () => {
    // The failure mode, made concrete, and it is narrower than I claimed when I wrote this up.
    //
    // The merge could not overwrite a migrated VALUE - the save was spread second, so it won. What
    // it did was refill any key the save did not have. So a migration that drops a field entirely
    // got a fresh game's version of it straight back, and nothing anywhere said so. Under the
    // needs model, fields are about to stop meaning what they meant, and some of them will go.
    const migrated = { ...saved() } as Partial<ZooGameState>;
    delete migrated.productGoal;
    expect(load(migrated as ZooGameState).productGoal,
      'a field the ladder took away came back from a fresh game').toBeUndefined();
  });

  it('is handed a state that has already been through readSave', () => {
    // The contract: nothing reaches the reducer that has not been filled. If a field is missing
    // here it is `readSave` that has to learn about it, not the reducer, because only `readSave`
    // knows which version wrote the file.
    const old = { ...saved() } as Partial<ZooGameState>;
    delete old.value; delete old.signalLog; delete old.connectors; delete old.questions;
    const read = readSave(old);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const after = load(read.state);
    for (const key of ['value', 'signalLog', 'connectors', 'questions', 'decisions', 'zones'] as const) {
      expect(after[key], `${key} came through undefined, so something downstream will read it`).toBeDefined();
    }
  });

  it('survives a day and a Sprint after being resumed', () => {
    // The point of the fill is that the game still runs. A gap that only shows up three clicks
    // later is the same bug with a delay on it.
    const old = { ...saved(), phase: 'sprint', dayStage: 'building', daySecondsLeft: 30 } as Partial<ZooGameState>;
    delete old.value; delete old.signalLog; delete old.burndown; delete old.velocity; delete old.happiness;
    const read = readSave(old);
    if (!read.ok) throw new Error(read.why);
    let s = load(read.state);
    // Ten seconds, not the whole day: running it out ends the day and starts the next one at a
    // full clock, which is right and would make this assertion meaningless.
    for (let i = 0; i < 10; i++) s = reducer(s, { type: 'TICK_DAY' });
    expect(s.daySecondsLeft).toBeLessThan(30);
    s = reducer(s, { type: 'END_DAY' });
    expect(s.burndown.length, 'the burndown was never an array to push onto').toBeGreaterThan(0);
  });
});
