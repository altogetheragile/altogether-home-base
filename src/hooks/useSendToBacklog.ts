import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliverableToSend {
  /** The impact-map deliverable node id (used to build the provenance link). */
  nodeId: string;
  title: string;
}

interface SendArgs {
  projectId: string;
  /** The saved impact-map artifact id (provenance source). */
  fromArtifactId: string;
  /** Human-readable provenance string stored on the backlog item, e.g. "From Impact Map: <goal>". */
  source: string;
  deliverables: DeliverableToSend[];
}

/**
 * Create backlog items from Impact Map deliverables and record provenance links
 * (project_artifact_links, link_kind 'derived_from'). Backlog items are
 * relational; impact-map nodes live inside artifact JSON, so the link's from_id
 * is the composite path '<artifact_id>#deliverable:<node_id>'.
 */
export function useSendToBacklog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, fromArtifactId, source, deliverables }: SendArgs) => {
      if (deliverables.length === 0) return 0;
      const { data: { user } } = await supabase.auth.getUser();

      // Starting backlog position (append to the end of this project's list).
      const { data: maxPos } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', projectId)
        .order('backlog_position', { ascending: false })
        .limit(1);
      let position = (maxPos?.[0]?.backlog_position ?? -1) + 1;

      let created = 0;
      for (const d of deliverables) {
        const title = d.title.trim() || 'Untitled deliverable';
        const { data: item, error: itemErr } = await supabase
          .from('backlog_items')
          .insert({
            project_id: projectId,
            title,
            source,
            backlog_position: position++,
            created_by: user?.id ?? null,
          })
          .select('id')
          .single();
        if (itemErr) throw itemErr;

        const { error: linkErr } = await supabase.from('project_artifact_links').insert({
          project_id: projectId,
          from_type: 'impact-map',
          from_id: `${fromArtifactId}#deliverable:${d.nodeId}`,
          to_type: 'backlog_item',
          to_id: item.id,
          link_kind: 'derived_from',
          created_by: user?.id ?? null,
        });
        if (linkErr) throw linkErr;
        created++;
      }
      return created;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast.success(`Sent ${count} deliverable${count === 1 ? '' : 's'} to the backlog`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Please try again';
      toast.error(`Could not send to backlog: ${message}`);
    },
  });
}
