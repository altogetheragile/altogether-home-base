// ISA-O3 Knowledge Base data layer. Reads live from Supabase (knowledge_items)
// and exposes id-keyed lookups + cross-link helpers. All knowledge-base views
// read through this hook so the content stays single-sourced.
import { useMemo } from 'react';
import { useKnowledgeItems, type KnowledgeItem } from '@/hooks/useKnowledgeItems';
import {
  HORIZONS,
  ISA,
  LAYERS,
  type Horizon,
  type Isa,
  type Layer,
  type Component,
} from '@/lib/isaO3';

export interface KbArtifact {
  id: string;
  name: string;
  horizon: Horizon | null;
  isa: Isa | null;
  layer: Layer | null;
  kind: string | null;
  facet: string | null;
  oneLiner: string;
  description: string;
  question: string | null;
  inheritable: boolean;
  counterparts: string[];
  techniques: string[];
  components: Component[];
}

export interface KbTechnique {
  id: string;
  name: string;
  description: string;
  source: string;
  produces: string[];
}

const toArtifact = (i: KnowledgeItem): KbArtifact => ({
  id: i.slug,
  name: i.name,
  horizon: (i.horizon as Horizon) ?? null,
  isa: (i.isa as Isa) ?? null,
  layer: (i.layer as Layer) ?? null,
  kind: i.kind ?? null,
  facet: i.facet ?? null,
  oneLiner: i.description ?? '',
  description: i.background || i.description || '',
  question: i.why_it_exists ?? null,
  inheritable: !!i.inheritable,
  counterparts: i.counterparts ?? [],
  techniques: i.techniques ?? [],
  components: (i.components as Component[]) ?? [],
});

const toTechnique = (i: KnowledgeItem): KbTechnique => ({
  id: i.slug,
  name: i.name,
  description: i.description ?? '',
  source: i.source ?? '',
  produces: i.produces ?? [],
});

export function useKnowledgeBase() {
  const { data: items, isLoading, isError } = useKnowledgeItems({ limit: 1000, sortBy: 'alphabetical' });

  return useMemo(() => {
    const all = items || [];
    const artifacts = all.filter((i) => i.item_type === 'artifact').map(toArtifact);
    const techniques = all.filter((i) => i.item_type === 'technique').map(toTechnique);

    const artifactById = new Map(artifacts.map((a) => [a.id, a]));
    const techniqueById = new Map(techniques.map((t) => [t.id, t]));

    const getArtifact = (id: string) => artifactById.get(id) || null;
    const getTechnique = (id: string) => techniqueById.get(id) || null;

    // Techniques that produce an artifact: union of the artifact's own
    // `techniques` list and any technique whose `produces` names the artifact.
    const techniquesForArtifact = (id: string): KbTechnique[] => {
      const a = artifactById.get(id);
      const ids = new Set<string>(a?.techniques ?? []);
      for (const t of techniques) if (t.produces.includes(id)) ids.add(t.id);
      return [...ids].map((tid) => techniqueById.get(tid)).filter(Boolean) as KbTechnique[];
    };

    // Artifacts a technique produces: union of `produces` and any artifact
    // whose `techniques` names this technique.
    const artifactsForTechnique = (id: string): KbArtifact[] => {
      const t = techniqueById.get(id);
      const ids = new Set<string>(t?.produces ?? []);
      for (const a of artifacts) if (a.techniques.includes(id)) ids.add(a.id);
      return [...ids].map((aid) => artifactById.get(aid)).filter(Boolean) as KbArtifact[];
    };

    const counterpartsOf = (id: string): KbArtifact[] => {
      const a = artifactById.get(id);
      return (a?.counterparts ?? []).map((cid) => artifactById.get(cid)).filter(Boolean) as KbArtifact[];
    };

    // Techniques that share a produced artifact with the given technique.
    const relatedTechniques = (techniqueId: string): KbTechnique[] => {
      const produced = new Set(artifactsForTechnique(techniqueId).map((a) => a.id));
      if (produced.size === 0) return [];
      const related = new Set<string>();
      for (const a of produced) {
        for (const t of techniquesForArtifact(a)) {
          if (t.id !== techniqueId) related.add(t.id);
        }
      }
      return [...related].map((tid) => techniqueById.get(tid)).filter(Boolean) as KbTechnique[];
    };

    // Grouped horizon -> layer -> isa -> artifacts[], for the Value Horizons map.
    const artifactsByCell = () => {
      const grid: Record<string, Record<string, Record<string, KbArtifact[]>>> = {};
      for (const h of HORIZONS) {
        grid[h] = {};
        for (const l of LAYERS) {
          grid[h][l] = {};
          for (const s of ISA) grid[h][l][s] = [];
        }
      }
      for (const a of artifacts) {
        if (a.horizon && a.layer && a.isa && grid[a.horizon]?.[a.layer]?.[a.isa]) {
          grid[a.horizon][a.layer][a.isa].push(a);
        }
      }
      return grid;
    };

    return {
      loading: isLoading,
      error: isError,
      artifacts,
      techniques,
      getArtifact,
      getTechnique,
      techniquesForArtifact,
      artifactsForTechnique,
      counterpartsOf,
      relatedTechniques,
      artifactsByCell,
    };
  }, [items, isLoading, isError]);
}
