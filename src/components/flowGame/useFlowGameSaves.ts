import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { GameState } from './types';

// The Flow Game "save and resume" store. The whole game is one serialisable
// object (GameState), kept as jsonb; phase/round/day are denormalised for the
// list. RLS scopes every row to its owner, so these queries only ever see the
// signed-in user's saves.
//
// `flow_game_saves` is created by migration 20260709120000 and is not yet in the
// generated Supabase types, so this one table is accessed through an untyped
// handle. Remove the cast once the types are regenerated.
const savesTable = () => (supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
}).from('flow_game_saves');

export interface FlowGameSaveMeta {
  id: string;
  name: string;
  phase: string | null;
  round_number: number | null;
  day: number | null;
  updated_at: string;
}

/** Fields we denormalise from the game state for the list view. */
function summarise(state: GameState) {
  return {
    phase: state.phase,
    round_number: state.round?.roundNumber ?? null,
    day: state.round?.day ?? null,
  };
}

export function useFlowGameSaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['flow-game-saves', user?.id];

  const list = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<FlowGameSaveMeta[]> => {
      const { data, error } = await savesTable()
        .select('id, name, phase, round_number, day, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FlowGameSaveMeta[];
    },
  });

  /** Insert a new save, or update the existing one when `id` is given. */
  const saveGame = useMutation({
    mutationFn: async ({ id, name, state }: { id?: string | null; name: string; state: GameState }): Promise<string> => {
      if (!user) throw new Error('Sign in to save games');
      const payload = { name, state, ...summarise(state) };
      if (id) {
        const { error } = await savesTable().update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await savesTable()
        .insert({ ...payload, user_id: user.id })
        .select('id')
        .single();
      if (error) throw error;
      return (data as unknown as { id: string }).id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const deleteGame = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await savesTable().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  /** Load one save's full game state. */
  const loadGame = async (id: string): Promise<GameState> => {
    const { data, error } = await savesTable().select('state').eq('id', id).single();
    if (error) throw error;
    return (data as unknown as { state: GameState }).state;
  };

  return {
    saves: list.data ?? [],
    isLoading: list.isLoading,
    saveGame: saveGame.mutateAsync,
    isSaving: saveGame.isPending,
    deleteGame: deleteGame.mutateAsync,
    loadGame,
  };
}
