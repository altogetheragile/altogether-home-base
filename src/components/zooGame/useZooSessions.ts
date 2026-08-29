import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { initialZooState } from './config';

// Creating, joining and seating a shared session. The game state itself is useZooSession's
// job; this is the lobby's data - who is here and who is sitting where.

export type SeatName = 'product_owner' | 'scrum_master' | 'developer';

export interface Participant {
  id: string; user_id: string; display_name: string;
  role: 'player' | 'observer'; can_facilitate: boolean;
}
export interface Seat {
  id: string; seat: SeatName; seat_no: number;
  participant_id: string | null; is_ai: boolean;
}
export interface SessionRow {
  id: string; name: string; join_code: string; host_user_id: string;
  status: 'lobby' | 'live' | 'paused' | 'done';
}

/** The seats a Scrum Team starts with. One Product Owner, one Scrum Master, and room for
 *  Developers - the Guide's "typically 10 or fewer" for the whole team, so four here leaves
 *  a team of six. Unclaimed seats fall to AI, so a pair can still see a whole team work. */
export const STARTING_SEATS: { seat: SeatName; seat_no: number }[] = [
  { seat: 'product_owner', seat_no: 1 },
  { seat: 'scrum_master', seat_no: 1 },
  ...Array.from({ length: 4 }, (_, i) => ({ seat: 'developer' as SeatName, seat_no: i + 1 })),
];

/** Readable aloud, so a trainer can give it to a room. No I, O, 0 or 1. */
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function useZooSessions(sessionId: string | null) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (id: string) => {
    const [s, p, g] = await Promise.all([
      supabase.from('zoo_sessions').select('id, name, join_code, host_user_id, status').eq('id', id).single(),
      supabase.from('zoo_session_participants').select('id, user_id, display_name, role, can_facilitate').eq('session_id', id),
      supabase.from('zoo_games').select('id').eq('session_id', id).order('seq', { ascending: false }).limit(1),
    ]);
    if (s.error) { setError(s.error.message); return; }
    setSession(s.data as SessionRow);
    setParticipants((p.data ?? []) as Participant[]);
    const game = g.data?.[0]?.id ?? null;
    setGameId(game);
    if (game) {
      const { data } = await supabase.from('zoo_game_seats')
        .select('id, seat, seat_no, participant_id, is_ai').eq('game_id', game);
      setSeats((data ?? []) as Seat[]);
    } else setSeats([]);
  }, []);

  useEffect(() => { if (sessionId) void refresh(sessionId); }, [sessionId, refresh]);

  // Everything in the lobby moves for everyone: a seat taken on one screen has to appear on
  // the others, or two people claim the same one.
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`zoo_lobby_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zoo_session_participants', filter: `session_id=eq.${sessionId}` }, () => void refresh(sessionId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zoo_game_seats' }, () => void refresh(sessionId))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [sessionId, refresh]);

  /** Open a session and take the host's own seat at the table. */
  const createSession = useCallback(async (name: string): Promise<string | null> => {
    if (!user) { setError('Sign in to start a session'); return null; }
    setBusy(true);
    try {
      const { data, error: e } = await supabase.from('zoo_sessions')
        .insert({ name, host_user_id: user.id, join_code: makeCode() })
        .select('id').single();
      if (e) { setError(e.message); return null; }
      // The host is a participant like anyone else. Hosting is ownership, not authority:
      // can_facilitate is granted separately, so opening a session does not make you a trainer.
      await supabase.from('zoo_session_participants').insert({
        session_id: data.id, user_id: user.id,
        display_name: user.email?.split('@')[0] ?? 'Host',
      });
      return data.id;
    } finally { setBusy(false); }
  }, [user]);

  /** Join by code. Goes through the definer function, because a joiner cannot see the
   *  session row yet - which is what stops knowing an id being a way in. */
  const joinByCode = useCallback(async (code: string): Promise<string | null> => {
    if (!user) { setError('Sign in to join a session'); return null; }
    setBusy(true);
    try {
      const { data, error: e } = await supabase.rpc('join_zoo_session', {
        _join_code: code.trim().toUpperCase(),
        _display_name: user.email?.split('@')[0] ?? 'Player',
      });
      if (e) { setError(e.message); return null; }
      return data as string;
    } finally { setBusy(false); }
  }, [user]);

  /** Start a game: one run toward one Product Goal. A session has several, which is what a
   *  training session actually is - play, reflect, play again - and it is why seats belong
   *  to the game rather than to the session.
   *
   *  `rotate` moves everyone one accountability along, so over three games each person has
   *  held each one. That is the reflection the second game exists for: you were Product
   *  Owner then and a Developer now, what looked different? */
  const startGame = useCallback(async (rotate = false): Promise<string | null> => {
    if (!session) return null;
    setBusy(true);
    try {
      const seed = Math.floor(Math.random() * 1_000_000);
      const { data: last } = await supabase.from('zoo_games')
        .select('seq').eq('session_id', session.id).order('seq', { ascending: false }).limit(1);
      const seq = (last?.[0]?.seq ?? 0) + 1;
      // Who sat where last time, so the rotation has something to move along.
      const previous = seats.filter((x) => x.participant_id).map((x) => ({ seat: x.seat, participant_id: x.participant_id! }));
      const { data, error: e } = await supabase.from('zoo_games')
        .insert({ session_id: session.id, seq, seed, theme: 'zoo',
                  state: initialZooState(seed) as never })
        .select('id').single();
      if (e) { setError(e.message); return null; }
      // Every seat starts played by AI, so an accountability is always held by somebody and
      // the gate has something to enforce from the first click. Claiming a seat clears its
      // AI flag; this is what makes a lone player face a real Scrum Team rather than a set
      // of empty chairs that quietly permit everything.
      const ROTATION: Record<SeatName, SeatName> = {
        product_owner: 'scrum_master', scrum_master: 'developer', developer: 'product_owner',
      };
      // Everyone who had a seat gets one again, moved along if rotating. Anything left over
      // is played by AI, so the team is complete from the first click.
      const taken = new Map<string, string>();   // "seat:no" -> participant
      previous.forEach((prev, i) => {
        const want = rotate ? ROTATION[prev.seat] : prev.seat;
        const free = STARTING_SEATS.find((c) => c.seat === want && !taken.has(`${c.seat}:${c.seat_no}`))
          ?? STARTING_SEATS.find((c) => !taken.has(`${c.seat}:${c.seat_no}`));
        if (free) taken.set(`${free.seat}:${free.seat_no}`, prev.participant_id);
        else void i;
      });
      await supabase.from('zoo_game_seats').insert(STARTING_SEATS.map((c) => {
        const who = taken.get(`${c.seat}:${c.seat_no}`);
        return { game_id: data.id, ...c, participant_id: who ?? null, is_ai: !who,
                 claimed_at: who ? new Date().toISOString() : null };
      }));
      await supabase.from('zoo_sessions').update({ status: 'live' }).eq('id', session.id);
      await refresh(session.id);
      return data.id;
    } finally { setBusy(false); }
  }, [session, seats, refresh]);

  const me = participants.find((p) => p.user_id === user?.id) ?? null;

  /** Take a seat, leaving whichever one you were in. Nobody holds two in a game - a unique
   *  index says so as well, so a race cannot leave you in both. */
  const claimSeat = useCallback(async (seatId: string) => {
    if (!me || !gameId) return;
    setBusy(true);
    try {
      await supabase.from('zoo_game_seats').update({ participant_id: null, claimed_at: null })
        .eq('game_id', gameId).eq('participant_id', me.id);
      const { error: e } = await supabase.from('zoo_game_seats')
        .update({ participant_id: me.id, is_ai: false, claimed_at: new Date().toISOString() })
        .eq('id', seatId).is('participant_id', null);
      if (e) setError(e.message);
      if (sessionId) await refresh(sessionId);
    } finally { setBusy(false); }
  }, [me, gameId, sessionId, refresh]);

  const leaveSeat = useCallback(async (seatId: string) => {
    setBusy(true);
    try {
      await supabase.from('zoo_game_seats').update({ participant_id: null, claimed_at: null }).eq('id', seatId);
      if (sessionId) await refresh(sessionId);
    } finally { setBusy(false); }
  }, [sessionId, refresh]);

  /** Hand an empty seat to AI, so a pair can still field a whole Scrum Team. */
  const fillWithAi = useCallback(async (seatId: string, on: boolean) => {
    setBusy(true);
    try {
      await supabase.from('zoo_game_seats').update({ is_ai: on, participant_id: null }).eq('id', seatId);
      if (sessionId) await refresh(sessionId);
    } finally { setBusy(false); }
  }, [sessionId, refresh]);

  /** Watch without a seat. A trainer coaching several tables, and the only kind of watcher
   *  there is: observers act on nothing. */
  const setRole = useCallback(async (role: 'player' | 'observer') => {
    if (!me) return;
    await supabase.from('zoo_session_participants').update({ role }).eq('id', me.id);
    if (sessionId) await refresh(sessionId);
  }, [me, sessionId, refresh]);

  return {
    session, participants, seats, gameId, me, busy, error,
    isHost: !!user && session?.host_user_id === user.id,
    createSession, joinByCode, startGame, claimSeat, leaveSeat, fillWithAi, setRole, refresh,
  };
}
