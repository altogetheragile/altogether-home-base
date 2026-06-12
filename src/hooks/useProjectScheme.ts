import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SchemeId, defaultSchemeForKind } from '@/config/prioritisationSchemes';

// Read and update a project's prioritisation_scheme. When the column is null the
// default is computed from projects.kind (project -> moscow, otherwise simple),
// per VISION_TO_VALUE.md 6.14. Standalone backlogs (no projectId) are always simple.
export function useProjectScheme(projectId?: string) {
  const [scheme, setSchemeState] = useState<SchemeId>('simple');

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setSchemeState('simple');
      return;
    }
    // The prioritisation_scheme column is added by a migration that may not be
    // reflected in the generated types yet, so query it untyped.
    (supabase.from('projects') as any)
      .select('prioritisation_scheme, kind')
      .eq('id', projectId)
      .maybeSingle()
      .then(({ data }: { data: { prioritisation_scheme?: string | null; kind?: string | null } | null }) => {
        if (cancelled || !data) return;
        setSchemeState((data.prioritisation_scheme as SchemeId) || defaultSchemeForKind(data.kind));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const setScheme = async (s: SchemeId) => {
    setSchemeState(s);
    if (projectId) {
      await (supabase.from('projects') as any).update({ prioritisation_scheme: s }).eq('id', projectId);
    }
  };

  return { scheme, setScheme, canPersist: !!projectId };
}
