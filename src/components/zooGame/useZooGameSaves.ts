import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';
import type { ZooGameState } from './types';

// The Build A Zoo "save and resume" store. The whole game is one serialisable object
// (ZooGameState), kept as jsonb; phase/sprint are denormalised for the list. RLS scopes
// every row to its owner, so these queries only ever see the signed-in user's saves.
// Mirrors useFlowGameSaves.

export interface ZooGameSaveMeta {
  id: string;
  name: string;
  phase: string | null;
  sprint_number: number | null;
  updated_at: string;
}

/** Fields we denormalise from the game state for the list view. */
function summarise(state: ZooGameState) {
  return { phase: state.phase, sprint_number: state.sprintNumber ?? null };
}

export function useZooGameSaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['zoo-game-saves', user?.id];

  const list = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<ZooGameSaveMeta[]> => {
      const { data, error } = await supabase
        .from('zoo_game_saves')
        .select('id, name, phase, sprint_number, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  /** Insert a new save, or update the existing one when `id` is given. */
  const saveGame = useMutation({
    mutationFn: async ({ id, name, state }: { id?: string | null; name: string; state: ZooGameState }): Promise<string> => {
      if (!user) throw new Error('Sign in to save games');
      const payload = { name, state: state as unknown as Json, ...summarise(state) };
      if (id) {
        const { error } = await supabase.from('zoo_game_saves').update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from('zoo_game_saves')
        .insert({ ...payload, user_id: user.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const deleteGame = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('zoo_game_saves').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  /** Load one save's full game state. */
  const loadGame = async (id: string): Promise<ZooGameState> => {
    const { data, error } = await supabase.from('zoo_game_saves').select('state').eq('id', id).single();
    if (error) throw error;
    return data.state as unknown as ZooGameState;
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
