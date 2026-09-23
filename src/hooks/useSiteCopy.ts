import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// `site_copy` is not in the generated types yet, so it is cast in this one place. Drop the cast
// when the types are next regenerated. Same arrangement as zoo_copy.
//
// This used to say the table was applied by hand because the migration history was out of sync
// with remote. That was true and is not any more: the history was baselined on 23 September (#747)
// and `supabase db push` works. Schema changes go through a migration now.
const db = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => { order: (c: string, o: { ascending: boolean }) => Promise<{ data: CopyRow[] | null; error: { message: string } | null }> };
    update: (row: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
};

export interface CopyRow {
  key: string;
  page: string;
  value: string;
  label: string;
  hint: string;
  sort: number;
}

export function useSiteCopy() {
  return useQuery({
    queryKey: ['site-copy'],
    queryFn: async () => {
      const { data, error } = await db.from('site_copy').select('key, page, value, label, hint, sort').order('sort', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as CopyRow[];
    },
  });
}

export function useUpdateCopy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await db.from('site_copy').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-copy'] });
      toast({ title: 'Saved', description: 'The page will show it on its next load.' });
    },
    onError: (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });
}
