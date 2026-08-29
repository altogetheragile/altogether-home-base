import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ZooLobby } from '@/components/zooGame/ZooLobby';
import { ZooGameScreens } from './ZooGame';
import { useZooSession, useSharedClock, useAiSeats } from '@/components/zooGame/useZooSession';
import { useZooSessions } from '@/components/zooGame/useZooSessions';
import type { SeatContext } from '@/components/zooGame/seatRules';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT } from '@/components/zooGame/ui/tokens';

// Build A Zoo, played together. The lobby seats a Scrum Team; the panel below is the seam
// where the game itself attaches - it holds a live shared game and proves the whole stack
// between two browsers, which is the thing that had to work before any of the game is
// wired to it.

function SharedGame({ gameId, sessionId, onBack }: { gameId: string; sessionId: string | null; onBack: () => void }) {
  // Which accountability this player holds, and which seats nobody is holding - the gate
  // needs both, because an empty seat's work falls to the team rather than to nobody.
  const lobby = useZooSessions(sessionId);
  const mySeat = lobby.seats.find((x) => x.participant_id === lobby.me?.id) ?? null;
  const ctx: SeatContext = {
    seat: mySeat?.seat ?? null,
    observer: lobby.me?.role === 'observer',
    emptySeats: lobby.seats.filter((x) => !x.participant_id && !x.is_ai).map((x) => x.seat),
  };
  const session = useZooSession(gameId, ctx);
  useSharedClock(session);
  // Seats with nobody in them are played by the game, so a pair can still field a whole
  // Scrum Team. What they do, they say - that is the part a solo player never gets.
  const [saidBy, setSaid] = useState<{ seat: string; says: string } | null>(null);
  const aiSeats = lobby.seats.filter((x) => x.is_ai).map((x) => x.seat);
  useAiSeats(session, aiSeats, useCallback((seat: string, says: string) => setSaid({ seat, says }), []));
  const { state, ready, present, drivesClock, error, refused, clearRefused } = session;

  if (error) return <p className="p-10 text-center text-sm text-destructive">{error}</p>;
  if (!ready || !state) return <p className="p-10 text-center text-sm text-muted-foreground">Joining the game…</p>;

  return (
    <div className="relative">
      {/* These used to sit above the game and push the whole page down each time one
          arrived, which on a screen with wide empty margins was the wrong place for them.
          Fixed to the right margin instead: they overlay nothing, reflow nothing, and stack
          where there was already empty space. */}
      <div className="pointer-events-none fixed right-3 top-24 z-40 flex w-72 flex-col gap-2">
        {saidBy && (
          <div className="pointer-events-auto rounded-lg border border-border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="mb-1 font-semibold capitalize">{saidBy.seat.replace('_', ' ')} (AI)</div>
            <p className="text-muted-foreground">{saidBy.says}</p>
            <button type="button" onClick={() => setSaid(null)} className="mt-1.5 text-[11px] underline">ok</button>
          </div>
        )}
        {refused && (
          <div className="pointer-events-auto rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-xs shadow-lg backdrop-blur dark:border-amber-700/60 dark:bg-amber-950/95">
            <p>{refused}</p>
            <button type="button" onClick={clearRefused} className="mt-1.5 text-[11px] underline">dismiss</button>
          </div>
        )}
      </div>

      {/* The game itself. The same screens the solo game uses - the only difference is which
          carrier the actions were built around, which is the whole point of one surface. */}
      <ZooGameScreens game={{ ...session, state }} saves={false}
        seat={mySeat?.seat ?? null} observer={ctx.observer}
        covering={ctx.emptySeats}
        // Every accountability with somebody in it - a person or an AI - has to agree the
        // Sprint Goal. Empty seats cannot agree, so they are not waited on.
        mustAgree={[...new Set(lobby.seats.filter((x) => x.participant_id || x.is_ai).map((x) => x.seat))]} />

      <div className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-muted-foreground">
        <span>
          {ctx.observer ? 'Watching this team. You act on nothing.'
            : mySeat ? `You are sitting as ${mySeat.seat.replace('_', ' ')}.` : 'You hold no seat.'}
          {' '}{present.length} here{drivesClock ? ' \u00b7 this browser is keeping time' : ''}
        </span>
        <button type="button" onClick={onBack} className="underline">Back to the lobby</button>
      </div>
    </div>
  );
}

export default function ZooTogether() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const [gameId, setGameId] = useState<string | null>(params.get('game'));

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={TEXT.screen}>Play together</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A shared session remembers who sat where and picks up where you left it, so it needs
          you signed in. The single-player game does not.
        </p>
      </div>
    );
  }

  if (gameId) return <SharedGame gameId={gameId} sessionId={sessionId} onBack={() => { setGameId(null); }} />;

  return (
    <ZooLobby
      sessionId={sessionId}
      onEnter={(id) => {
        // The lobby hands back a session id before a game exists, and a game id after.
        if (!sessionId) setParams({ session: id });
        else { setGameId(id); setParams({ session: sessionId, game: id }); }
      }}
      onLeave={() => setParams({})}
    />
  );
}
