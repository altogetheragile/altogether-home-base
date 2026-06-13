import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliverableToSend {
  /** The impact-map deliverable node id (used to build the provenance link). */
  nodeId: string;
  title: string;
  /** Optional full story sentence (As a..., I need..., so that...) for the item body. */
  description?: string;
}

interface SendArgs {
  projectId: string;
  /** The saved impact-map artifact id (provenance source). */
  fromArtifactId: string;
  /** Human-readable provenance string stored on the backlog item, e.g. "From Impact Map: <goal>". */
  source: string;
  deliverables: DeliverableToSend[];
  /** The product-backlog artifact to add the items to (null = the project's ungrouped backlog). */
  backlogArtifactId?: string | null;
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
    mutationFn: async ({ projectId, fromArtifactId, source, deliverables, backlogArtifactId }: SendArgs) => {
      if (deliverables.length === 0) return { created: 0, skipped: 0 };
      const { data: { user } } = await supabase.auth.getUser();

      // Only send deliverables not already sent from this map TO THIS backlog: a
      // provenance link ('<artifactId>#deliverable:<nodeId>') exists per item sent,
      // so re-running "Send all" to the same backlog adds only new What items, while
      // the same deliverable can still populate a different backlog.
      const { data: links } = await supabase
        .from('project_artifact_links')
        .select('from_id, to_id')
        .eq('project_id', projectId)
        .eq('from_type', 'impact-map')
        .eq('to_type', 'backlog_item');
      const linkRows = links || [];
      const sentHere = new Set<string>();
      if (linkRows.length > 0) {
        // Cast: generated types lag the backlog_artifact_id column.
        const { data: its } = await (supabase.from('backlog_items') as any)
          .select('id, backlog_artifact_id')
          .in('id', linkRows.map((l) => l.to_id as string));
        const backlogOf = new Map(
          (its || []).map((i: { id: string; backlog_artifact_id?: string }) => [i.id, i.backlog_artifact_id ?? null]),
        );
        for (const l of linkRows) {
          if ((backlogOf.get(l.to_id as string) ?? null) === (backlogArtifactId ?? null)) {
            sentHere.add(l.from_id as string);
          }
        }
      }
      const fresh = deliverables.filter((d) => !sentHere.has(`${fromArtifactId}#deliverable:${d.nodeId}`));
      const skipped = deliverables.length - fresh.length;
      if (fresh.length === 0) return { created: 0, skipped };

      // Starting backlog position (append to the end of this project's list).
      const { data: maxPos } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', projectId)
        .order('backlog_position', { ascending: false })
        .limit(1);
      let position = (maxPos?.[0]?.backlog_position ?? -1) + 1;

      let created = 0;
      for (const d of fresh) {
        const title = d.title.trim() || 'Untitled deliverable';
        const { data: item, error: itemErr } = await (supabase.from('backlog_items') as any)
          .insert({
            project_id: projectId,
            title,
            description: d.description?.trim() || null,
            source,
            backlog_artifact_id: backlogArtifactId ?? null,
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
      return { created, skipped };
    },
    onSuccess: ({ created, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      if (created === 0) {
        toast.info(
          skipped > 0
            ? 'Those deliverables are already in the backlog.'
            : 'Nothing new to send.',
        );
      } else {
        toast.success(
          `Sent ${created} new item${created === 1 ? '' : 's'} to the backlog` +
            (skipped > 0 ? ` (${skipped} already there)` : ''),
        );
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Please try again';
      toast.error(`Could not send to backlog: ${message}`);
    },
  });
}
