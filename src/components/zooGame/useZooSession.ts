import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ZooGameState, ZooAction } from './types';
import { reducer } from './useZooGame';
import { localState, queueAction, confirmWrite, rebase, hasPending, writePayload, type SyncState } from './sessionSync';
import { zooActions, type ZooActions } from './zooActions';
import { mayTake, refusal, type SeatContext } from './seatRules';
import { aiTurn } from './aiSeats';
import { secondsPerPoint, teamIsBusy } from './engine';
import type { SeatName } from './useZooSessions';

// One shared game, kept in step across several browsers with no server code.
//
// Postgres is the authority and this is the cache: a session outlives every tab, so the
// truth cannot live in one. The loop is
//
//   act -> show it at once -> write WHERE version = <what we had> -> tell everyone
//
// and a write that matches no rows means somebody got there first, so we take what the
// server has and replay whatever has not been confirmed on top of it. sessionSync.ts holds
// that reconciliation, and its tests are where the races are pinned down; this file is the
// plumbing around it.

export interface ZooSession extends ZooActions {
  /** What to render: the server's state with this browser's unconfirmed actions on top. */
  state: ZooGameState | null;
  /** Apply an action: locally now, on the server shortly. Gated against your own seat. */
  send: (action: ZooAction) => void;
  /** Apply an action taken by another seat - an AI one. Gated against THAT seat, because an
   *  AI Developer sizing the work is the Developers doing their job, not you doing theirs.
   *  Sending it through `send` judged it against whoever is sitting at this browser, so
   *  every AI move was refused the moment a human held a different seat. */
  sendAs: (seat: SeatName, action: ZooAction) => void;
  /** True once the game has loaded and the channel is up. */
  ready: boolean;
  /** Everyone currently in this game, by participant id. */
  present: string[];
  /** True while this browser owns the clock. Exactly one does, so the day is only ever
   *  ended once - see the reducer, which ends it rather than a component. */
  drivesClock: boolean;
  /** Set when the last action was refused because it belongs to another accountability.
   *  Worth showing: the sentence is the teaching, and a silent no reads as a broken button. */
  refused: string | null;
  clearRefused: () => void;
  error: string | null;
}

/** How long to sit on a burst of actions before writing. Long enough that dragging a river
 *  is one write rather than forty; short enough that nobody notices. */
const FLUSH_MS = 250;

/** The actions where "who did this?" is the lesson rather than a detail.
 *
 *  The accountability travels IN the action, not beside it, because an action is a message: it is
 *  written to the shared game and replayed by every other browser, and an actor left on the
 *  outside would be lost the moment it crossed the wire. */
// Moving a card across the board is a decision like the rest of these, so it is stamped with the
// seat that made it. Playing alone there is no seat, and the engine names the accountability the
// move belongs to instead: only the Developers change the Sprint Backlog.
const ACTOR_MATTERS = new Set(['SET_FORECAST', 'PLAN_SPRINT', 'PULL_ITEM', 'RUN_DAILY_SCRUM',
  'SKIP_DAILY_SCRUM', 'SET_WIP_LIMIT', 'SET_DOD', 'START_ITEM', 'OPEN_ITEM']);
const stamped = (action: ZooAction, seat: SeatName | null | undefined): ZooAction =>
  (seat && ACTOR_MATTERS.has(action.type) ? { ...action, by: seat } as ZooAction : action);

export function useZooSession(gameId: string | null, seat: SeatContext = { seat: null }): ZooSession {
  const { user } = useAuth();
  const [sync, setSync] = useState<SyncState | null>(null);
  const [present, setPresent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refused, setRefused] = useState<string | null>(null);

  // The writer runs outside React's render: it has to read the newest sync state at the
  // moment it writes, not the one captured when it was scheduled.
  const syncRef = useRef<SyncState | null>(null);
  syncRef.current = sync;
  const writing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- load ----
  useEffect(() => {
    if (!gameId) return;
    let live = true;
    (async () => {
      const { data, error: e } = await supabase
        .from('zoo_games').select('state, version').eq('id', gameId).single();
      if (!live) return;
      if (e) { setError(e.message); return; }
      setSync({ server: data.state as unknown as ZooGameState, version: data.version, pending: [] });
      setReady(true);
    })();
    return () => { live = false; };
  }, [gameId]);

  // ---- write ----
  const flush = useCallback(async () => {
    const s = syncRef.current;
    if (!gameId || !s || writing.current || !hasPending(s)) return;
    writing.current = true;
    try {
      const { state, count, version } = writePayload(s);
      const { data, error: e } = await supabase
        .from('zoo_games')
        .update({ state: state as never, version: version + 1 })
        .eq('id', gameId)
        .eq('version', version)          // optimistic concurrency: the whole safety net
        .select('id');

      if (e) { setError(e.message); return; }

      if (data && data.length > 0) {
        setSync((cur) => (cur ? confirmWrite(cur, count, version + 1) : cur));
      } else {
        // Somebody got there first. Take theirs, keep ours, and go round again.
        const { data: fresh } = await supabase
          .from('zoo_games').select('state, version').eq('id', gameId).single();
        if (fresh) setSync((cur) => (cur ? rebase(cur, fresh.state as unknown as ZooGameState, fresh.version) : cur));
      }
    } finally {
      writing.current = false;
      // Anything queued while that was in flight, or a conflict to retry.
      if (syncRef.current && hasPending(syncRef.current)) {
        timer.current = setTimeout(() => { void flush(); }, FLUSH_MS);
      }
    }
  }, [gameId]);

  // The gate. It refuses before anything is applied locally, so a player never sees a change
  // that is about to be undone - and it says whose call it was, because that sentence is the
  // reason the gate exists at all.
  //
  // Client-side is the right place for it. This is a teaching game, not a threat model: the
  // point is that the interface tells you the Backlog is the Product Owner's, not that a
  // determined learner cannot get round it.
  const seatRef = useRef(seat);
  seatRef.current = seat;

  /** Queue an action that has already been judged. */
  const apply = useCallback((action: ZooAction) => {
    setSync((cur) => (cur ? queueAction(cur, action) : cur));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, FLUSH_MS);
  }, [flush]);

  const send = useCallback((action: ZooAction) => {
    const verdict = mayTake(action.type, seatRef.current);
    if (!verdict.allowed) { setRefused(refusal(verdict)); return; }
    setRefused(null);
    apply(stamped(action, seatRef.current.seat));
  }, [apply]);

  // An AI seat is a player, so its move is judged the same way - just against its own
  // accountability rather than against whoever happens to be sitting here.
  const sendAs = useCallback((asSeat: SeatName, action: ZooAction) => {
    if (!mayTake(action.type, { seat: asSeat }).allowed) return;
    apply(stamped(action, asSeat));
  }, [apply]);

  // ---- listen ----
  useEffect(() => {
    if (!gameId || !user) return;
    const channel = supabase.channel(`zoo_game_${gameId}`, { config: { presence: { key: user.id } } });

    channel
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'zoo_games', filter: `id=eq.${gameId}` },
        (payload) => {
          const row = payload.new as { state: unknown; version: number };
          setSync((cur) => {
            if (!cur || row.version <= cur.version) return cur;   // our own write, or stale
            return rebase(cur, row.state as ZooGameState, row.version);
          });
        })
      .on('presence', { event: 'sync' }, () => setPresent(Object.keys(channel.presenceState())))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ at: null });
      });

    return () => { void supabase.removeChannel(channel); };
  }, [gameId, user]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // A refusal is about the thing you just tried, so it should not follow you to the next
  // screen. Left up, it reads as a comment on where you are now - a note about selecting
  // work still on screen at topic three looks like it is talking about topic three.
  const phase = sync ? localState(sync).phase : null;
  useEffect(() => { setRefused(null); }, [phase]);

  // Exactly one browser drives the clock, chosen by a rule every client computes the same
  // way from the same list: the lowest participant id present. No election, no chatter, and
  // it re-settles by itself when that person closes their laptop.
  const drivesClock = !!user && present.length > 0 && [...present].sort()[0] === user.id;

  // The same surface a solo game offers, built around this carrier instead of the reducer,
  // so a screen cannot tell which kind of game it was handed.
  const actions = useMemo(() => zooActions(send), [send]);

  return { state: sync ? localState(sync) : null, send, sendAs, ready, present, drivesClock,
           refused, clearRefused: () => setRefused(null), error, ...actions };
}

/** The clock, for a shared game: the same heartbeat useZooGame runs alone, but only on the
 *  browser that owns it. Kept here rather than in the hook above so a session that is not
 *  yet playing does not tick. */
export function useSharedClock(session: ZooSession) {
  const { state, send, drivesClock } = session;
  const stage = state?.dayStage;
  const ticking = drivesClock && state?.phase === 'sprint' && !state.learnMode;
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => send({ type: stage === 'dailyScrum' ? 'TICK_SCRUM' : 'TICK_DAY' }), 1000);
    return () => clearInterval(id);
  }, [ticking, stage, send]);
}

/** Re-export so a caller can build a state without importing the reducer separately. */
export { reducer };


/** How long to pause before a move lands. Not the cost of the work - that is charged to the
 *  day clock, so the board never sits dead while a large item is built - just long enough
 *  that a move reads as somebody doing something rather than the board twitching. */
const BEAT_MS = 900;
const WORK_BEAT_MS = 2200;
/** The pause either side of moving the event on to the next topic.
 *
 *  Sprint Planning is three topics with an order, and the seats played by the game can do a
 *  topic's work in about a second - so the whole of topic two happened between two blinks and a
 *  Product Owner saw the Sprint Backlog full without ever seeing it fill. The work is not the
 *  event: arriving at a topic, doing the one thing it is for, and then moving on is. This is the
 *  breath in between, and it is a display decision, which is why it lives out here and not in the
 *  seats' judgement. */
const TOPIC_BEAT_MS = 5000;
/** How long an event of its own stays on screen before a seat played by the game concludes it.
 *  Longer than a topic: the Daily Scrum has something to read on it, and holding or skipping it
 *  is a decision somebody at the table might want to make themselves. */
const EVENT_BEAT_MS = 9000;

/** Play the seats nobody is sitting in.
 *
 *  Only one browser does this - the same one that drives the clock - or every browser takes
 *  the same turn and the Backlog gets sized four times.
 *
 *  Each move goes through `sendAs` like anybody's, so it is written, shared, and refused by
 *  the gate if it does not belong to that accountability. An AI seat is a player, not a back
 *  door - and now it works at something like the pace of one.
 */
export function useAiSeats(session: ZooSession, aiSeats: SeatName[], onSay?: (seat: SeatName, says: string, action: ZooAction) => void,
  /** Who still has to agree a Sprint Goal before topic two begins: the seats somebody or some AI
   *  is holding. An empty seat cannot agree, so waiting on it would stall the game. */
  mustAgree?: readonly string[]) {
  const { state, drivesClock, sendAs } = session;
  const seats = aiSeats.join(',');
  const agreers = (mustAgree ?? []).join(',');
  // The state is read when the beat lands, not captured when it was scheduled.
  //
  // This used to be an effect that took `state` as a dependency and scheduled the move on a
  // timeout. During a Sprint the shared clock rewrites the state every second, so the effect
  // tore down and rescheduled every second too - and any beat longer than that never arrived.
  // Building is the one move with a long beat, so the Developers could forecast, plan and pull
  // work, and then never build a single thing: the board sat still for a whole day with an
  // item in Doing and nobody saying why.
  const latest = useRef<{ state: typeof state; sendAs: typeof sendAs; onSay: typeof onSay }>({ state, sendAs, onSay });
  useEffect(() => { latest.current = { state, sendAs, onSay }; });

  useEffect(() => {
    if (!drivesClock || !seats) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    // A move that deserves watching gets its pause BEFORE it lands as well as after, so it reads
    // as somebody about to do something rather than as something already done. Held once per
    // move: the same move coming back after its wait is taken rather than deferred forever.
    let waitedFor: string | null = null;
    const beat = () => {
      const { state: now, sendAs: send, onSay: say } = latest.current;
      // Busy hands take no new work. While there is time owed on what they have already taken on,
      // the seats are building it - which is most of what makes a Sprint take a Sprint. Charged in
      // a lump and acted on at once, a whole forecast went by in a few seconds.
      if (now && teamIsBusy(now)) { if (live) timer = setTimeout(beat, BEAT_MS); return; }
      let next: { seat: SeatName; move: NonNullable<ReturnType<typeof aiTurn>> } | null = null;
      if (now) {
        for (const seat of seats.split(',') as SeatName[]) {
          const move = aiTurn(now, seat, agreers ? agreers.split(',') : undefined);
          // A move its own accountability may not take is skipped rather than sent, so a seat
          // that keeps proposing something impossible cannot starve the seats behind it in
          // this list - which is how the Scrum Master ended up never getting to agree.
          if (!move || !mayTake(move.action.type, { seat }).allowed) continue;
          next = { seat, move }; break;
        }
      }
      if (next) {
        // A build is the work itself, and a topic change is the event moving on. Both used to
        // appear a second after the move before them: an item was taken and built inside one
        // beat, and a Product Owner who agreed the Sprint Goal was on topic two before they had
        // let go of the mouse.
        // A Daily Scrum is an event, not a move: the Scrum Master used to hold it about a second
        // after it opened, so the screen appeared and was gone before anybody had read the
        // blocker on it - and a human who wanted to hold or skip it themselves never got the
        // chance. It waits the longest of anything here.
        const lead = next.move.weight ? WORK_BEAT_MS
          : next.move.action.type === 'RUN_DAILY_SCRUM' ? EVENT_BEAT_MS
            : next.move.action.type === 'SET_PLANNING_TOPIC' ? TOPIC_BEAT_MS : 0;
        const key = `${next.seat}:${next.move.action.type}:${'id' in next.move.action ? next.move.action.id : ''}`;
        if (lead && waitedFor !== key) {
          waitedFor = key;
          if (live) timer = setTimeout(beat, lead);
          return;
        }
        waitedFor = null;
        const { seat, move } = next;
        // The whole action travels with the line, so a rail can tell one kind of move from
        // another - five items planned in a row is one thing happening, not five - and can tell
        // which screen the line belongs to, which is not always the screen it was said on: the
        // move that changes the topic is about the topic it moves to.
        say?.(seat, move.says, move.action);
        send(seat, move.action);       // one move at a time, so it reads as somebody working
        // ...and the work costs the day, the way it would if a person had done it. Owed rather than
        // taken: the cost drains a second per second while the team works it off, and they take no
        // new move until it is worked off. Charged in a lump, a Sprint's forecast went in a few
        // seconds and the day clock stopped meaning anything - reported from playing it.
        if (move.weight && now) send(seat, { type: 'SPEND_DAY', seconds: Math.round(secondsPerPoint(now) * move.weight) });
      }
      // ...and how long before the next one. A topic change, and the selection that finishes a
      // topic, are each left on screen long enough to read.
      //
      // Nothing to do is not a reason to stop looking, either: what the seats can do next changes
      // with the clock as much as with anybody's move.
      const kind = next?.move.action.type;
      const pause = next?.move.weight ? WORK_BEAT_MS
        : kind === 'SET_PLANNING_TOPIC' || kind === 'SET_FORECAST' ? TOPIC_BEAT_MS
          : BEAT_MS;
      if (live) timer = setTimeout(beat, pause);
    };
    timer = setTimeout(beat, BEAT_MS);
    return () => { live = false; clearTimeout(timer); };
  }, [drivesClock, seats, agreers]);
}
