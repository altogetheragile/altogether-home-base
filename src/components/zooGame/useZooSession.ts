import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ZooGameState, ZooAction } from './types';
import { reducer } from './useZooGame';
import { localState, queueAction, confirmWrite, rebase, hasPending, writePayload, type SyncState } from './sessionSync';

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

export interface ZooSession {
  /** What to render: the server's state with this browser's unconfirmed actions on top. */
  state: ZooGameState | null;
  /** Apply an action: locally now, on the server shortly. */
  send: (action: ZooAction) => void;
  /** True once the game has loaded and the channel is up. */
  ready: boolean;
  /** Everyone currently in this game, by participant id. */
  present: string[];
  /** True while this browser owns the clock. Exactly one does, so the day is only ever
   *  ended once - see the reducer, which ends it rather than a component. */
  drivesClock: boolean;
  error: string | null;
}

/** How long to sit on a burst of actions before writing. Long enough that dragging a river
 *  is one write rather than forty; short enough that nobody notices. */
const FLUSH_MS = 250;

export function useZooSession(gameId: string | null): ZooSession {
  const { user } = useAuth();
  const [sync, setSync] = useState<SyncState | null>(null);
  const [present, setPresent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const send = useCallback((action: ZooAction) => {
    setSync((cur) => (cur ? queueAction(cur, action) : cur));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, FLUSH_MS);
  }, [flush]);

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

  // Exactly one browser drives the clock, chosen by a rule every client computes the same
  // way from the same list: the lowest participant id present. No election, no chatter, and
  // it re-settles by itself when that person closes their laptop.
  const drivesClock = !!user && present.length > 0 && [...present].sort()[0] === user.id;

  return { state: sync ? localState(sync) : null, send, ready, present, drivesClock, error };
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
