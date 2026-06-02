import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { HORIZONS } from '@/lib/isaO3';
import { colors as p } from '@/theme/colors';

const HORIZON_DOT: Record<string, string> = {
  Organisation: '#8B6FE0',
  Coordination: '#2FA8A3',
  Team: '#FF9715',
};

const KnowledgeBaseTechniques = () => {
  const kb = useKnowledgeBase();
  const [query, setQuery] = useState('');
  const [horizon, setHorizon] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  // Categories present across techniques (the meaningful technique facet).
  const categories = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of kb.techniques) for (const c of t.categories) m.set(c.slug, c.name);
    return [...m.entries()].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [kb.techniques]);

  // Horizons each technique touches, via the artifacts it produces.
  const horizonsFor = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!kb.loading) {
      for (const t of kb.techniques) {
        const hs = new Set<string>();
        for (const a of kb.artifactsForTechnique(t.id)) if (a.horizon) hs.add(a.horizon);
        map.set(t.id, hs);
      }
    }
    return map;
  }, [kb]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kb.techniques.filter((t) => {
      const matchesQuery =
        !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchesHorizon = !horizon || horizonsFor.get(t.id)?.has(horizon);
      const matchesCategory = !category || t.categories.some((c) => c.slug === category);
      return matchesQuery && matchesHorizon && matchesCategory;
    });
  }, [kb.techniques, query, horizon, category, horizonsFor]);

  // Horizon filtering only works once techniques are linked to artifacts
  // (technique.produces). Hide the chips until that data exists, rather than
  // showing a filter that always returns zero.
  const hasHorizonData = useMemo(
    () => [...horizonsFor.values()].some((s) => s.size > 0),
    [horizonsFor],
  );

  return (
    <KnowledgeBaseLayout
      title="Technique Library - Knowledge Base - Altogether Agile"
      description="Browse the agile technique library: search and filter practical techniques across the ISA-O3 horizons."
      canonicalPath="/knowledge-base/techniques"
      crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: 'Techniques' }]}
    >
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          Technique Library
        </h1>
        <p className="text-sm" style={{ color: p.body }}>
          Practical techniques that produce the framework's artifacts.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search techniques..."
          className="h-9 px-3 rounded-md text-sm flex-grow max-w-xs outline-none"
          style={{ border: `1px solid ${p.paleTeal}`, color: p.body }}
        />
        {hasHorizonData && (
          <>
            <button
              onClick={() => setHorizon(null)}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: horizon === null ? p.deepTeal : p.white,
                color: horizon === null ? p.white : p.deepTeal,
                border: `1px solid ${p.paleTeal}`,
              }}
            >
              All
            </button>
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(horizon === h ? null : h)}
                className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                style={{
                  background: horizon === h ? p.deepTeal : p.white,
                  color: horizon === h ? p.white : p.deepTeal,
                  border: `1px solid ${p.paleTeal}`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: HORIZON_DOT[h] }} />
                {h}
              </button>
            ))}
          </>
        )}
        <span className="text-xs ml-auto" style={{ color: p.muted }}>
          {filtered.length} technique{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setCategory(null)}
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: category === null ? p.midTeal : p.white,
              color: category === null ? p.white : p.deepTeal,
              border: `1px solid ${p.paleTeal}`,
            }}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(category === c.slug ? null : c.slug)}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: category === c.slug ? p.midTeal : p.white,
                color: category === c.slug ? p.white : p.deepTeal,
                border: `1px solid ${p.paleTeal}`,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {kb.loading ? (
        <p style={{ color: p.muted }}>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t) => {
            const produced = kb.artifactsForTechnique(t.id);
            const hs = horizonsFor.get(t.id) || new Set<string>();
            return (
              <Link
                key={t.id}
                to={`/knowledge-base/techniques/${t.id}`}
                className="rounded-xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-md"
                style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold leading-tight" style={{ color: p.deepTeal }}>{t.name}</span>
                  {produced.length > 1 && (
                    <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5" style={{ background: p.skyTeal, color: p.midTeal }}>
                      Shared
                    </span>
                  )}
                </div>
                <p className="text-xs line-clamp-3" style={{ color: p.body }}>{t.description}</p>
                {produced.length > 0 && (
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <span className="flex items-center gap-1">
                      {HORIZONS.filter((h) => hs.has(h)).map((h) => (
                        <span key={h} className="w-2 h-2 rounded-full" style={{ background: HORIZON_DOT[h] }} title={h} />
                      ))}
                    </span>
                    <span className="text-[11px]" style={{ color: p.muted }}>
                      Used by {produced.length}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </KnowledgeBaseLayout>
  );
};

export default KnowledgeBaseTechniques;
