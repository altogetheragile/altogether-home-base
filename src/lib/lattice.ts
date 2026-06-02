// PROTOTYPE data layer for the Value Horizons lattice: groups artifacts into
// anchor families (via anchors_to) and container cascades (via cascades_to),
// resolving the typed edges in knowledge_edges to artifacts. Read-only;
// separate from useKnowledgeBase so it doesn't change the existing views.
import { useMemo } from 'react';
import { useKnowledgeItems, type KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useKnowledgeEdges } from '@/lib/edges';
import { HORIZONS, type Horizon } from '@/lib/isaO3';

export interface LatticeNode {
  slug: string;
  name: string;
  horizon: Horizon | null;
  shape: string | null;
  isa: string | null;
  question: string | null;
}

const horizonRank = (h: string | null) => {
  const i = HORIZONS.indexOf((h as Horizon) ?? ('' as Horizon));
  return i === -1 ? 99 : i; // Organisation=0 (top) → Team=2 (bottom)
};

export function useLattice() {
  const { data: items, isLoading } = useKnowledgeItems({ limit: 1000, sortBy: 'alphabetical' });
  const { data: edges, isLoading: edgesLoading } = useKnowledgeEdges();

  return useMemo(() => {
    const artifacts = (items || []).filter((i) => i.item_type === 'artifact');
    const byUuid = new Map<string, KnowledgeItem>(artifacts.map((a) => [a.id, a]));
    const node = (i: KnowledgeItem): LatticeNode => ({
      slug: i.slug, name: i.name, horizon: (i.horizon as Horizon) ?? null, shape: i.shape ?? null, isa: i.isa ?? null,
      question: i.why_it_exists ?? null,
    });

    const anchorEdges = (edges || []).filter((e) => e.edge_type === 'anchors_to');
    const cascadeEdges = (edges || []).filter((e) => e.edge_type === 'cascades_to');

    // Anchor families = connected components over anchors_to (undirected).
    const adj = new Map<string, Set<string>>();
    const touch = (id: string) => { if (!adj.has(id)) adj.set(id, new Set()); };
    for (const e of anchorEdges) {
      if (!byUuid.has(e.source_id) || !byUuid.has(e.target_id)) continue;
      touch(e.source_id); touch(e.target_id);
      adj.get(e.source_id)!.add(e.target_id);
      adj.get(e.target_id)!.add(e.source_id);
    }
    const seen = new Set<string>();
    const anchorFamilies: LatticeNode[][] = [];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const comp: string[] = [];
      const stack = [start];
      while (stack.length) {
        const u = stack.pop()!;
        if (seen.has(u)) continue;
        seen.add(u); comp.push(u);
        for (const v of adj.get(u) || []) if (!seen.has(v)) stack.push(v);
      }
      const members = comp.map((id) => node(byUuid.get(id)!))
        .sort((a, b) => horizonRank(a.horizon) - horizonRank(b.horizon));
      anchorFamilies.push(members);
    }
    anchorFamilies.sort((a, b) => a[0].name.localeCompare(b[0].name));

    // Container cascades = directed chains over cascades_to (higher → lower).
    const targets = new Set(cascadeEdges.map((e) => e.target_id));
    const nextOf = new Map<string, string>();
    for (const e of cascadeEdges) nextOf.set(e.source_id, e.target_id);
    const cascadeChains: LatticeNode[][] = [];
    for (const e of cascadeEdges) {
      if (targets.has(e.source_id)) continue; // not a chain head
      const chain: LatticeNode[] = [];
      let cur: string | undefined = e.source_id;
      const guard = new Set<string>();
      while (cur && byUuid.has(cur) && !guard.has(cur)) {
        guard.add(cur);
        chain.push(node(byUuid.get(cur)!));
        cur = nextOf.get(cur);
      }
      if (chain.length > 1) cascadeChains.push(chain);
    }
    cascadeChains.sort((a, b) => a[0].name.localeCompare(b[0].name));

    return {
      loading: isLoading || edgesLoading,
      anchorFamilies,                                   // each: [highest horizon ... lowest]
      multiHorizonFamilies: anchorFamilies.filter((f) => f.length > 1),
      cascadeChains,
    };
  }, [items, edges, isLoading, edgesLoading]);
}
