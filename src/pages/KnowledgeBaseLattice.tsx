import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useLattice, type LatticeNode } from '@/lib/lattice';
import { colors as p } from '@/theme/colors';

const HORIZON_TINT: Record<string, string> = {
  Organisation: '#F9F5FF',
  Coordination: '#F0F9FF',
  Team: '#FFF7F0',
};
const HORIZON_BORDER: Record<string, string> = {
  Organisation: '#C8B8F5',
  Coordination: '#93C5E0',
  Team: '#F5C896',
};

function NodeCard({ n }: { n: LatticeNode }) {
  return (
    <Link
      to={`/knowledge-base/artifacts/${n.slug}`}
      className="block rounded-lg px-3 py-2 hover:shadow-md transition-shadow"
      style={{ background: HORIZON_TINT[n.horizon || ''] || p.white, border: `1.5px solid ${HORIZON_BORDER[n.horizon || ''] || p.paleTeal}` }}
    >
      {n.question ? (
        <>
          <div className="text-sm leading-snug" style={{ color: p.body }}>{n.question}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: p.deepTeal }}>
            {n.name}
          </div>
        </>
      ) : (
        <div className="text-sm font-semibold leading-tight" style={{ color: p.deepTeal }}>{n.name}</div>
      )}
      <div className="text-[10px]" style={{ color: p.muted }}>
        {n.horizon}{n.isa ? ` · ${n.isa}` : ''}
      </div>
    </Link>
  );
}

const KnowledgeBaseLattice = () => {
  const { loading, multiHorizonFamilies, cascadeChains } = useLattice();

  return (
    <KnowledgeBaseLayout
      title="Lattice (preview) - Knowledge Base - Altogether Agile"
      description="Prototype: anchor families inherited across horizons, and container cascades."
      crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: 'Lattice (preview)' }]}
    >
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          Lattice <span className="text-sm font-normal" style={{ color: p.muted }}>(preview)</span>
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: p.body }}>
          The same concept across horizons, drawn as one family. An anchor at a lower horizon may
          inherit the one above, or author its own (top = Organisation, down = Coordination, Team).
        </p>
      </div>

      {loading ? (
        <p style={{ color: p.muted }}>Loading...</p>
      ) : (
        <>
          {/* Anchor families (inheritance, top-down) */}
          <h2 className="text-lg font-bold mb-3" style={{ color: p.deepTeal }}>
            Anchor families <span className="text-xs font-normal" style={{ color: p.muted }}>· inherit down</span>
          </h2>
          {multiHorizonFamilies.length === 0 ? (
            <p className="text-sm mb-6" style={{ color: p.muted }}>No multi-horizon anchor families yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {multiHorizonFamilies.map((fam, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: p.midTeal }}>
                    {fam[0].name}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {fam.map((n, j) => (
                      <div key={n.slug}>
                        <NodeCard n={n} />
                        {j < fam.length - 1 && (
                          <div className="flex justify-center py-0.5" style={{ color: p.muted }}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Container cascades (items flow down the horizons) */}
          <h2 className="text-lg font-bold mb-3" style={{ color: p.deepTeal }}>
            Container cascades <span className="text-xs font-normal" style={{ color: p.muted }}>· flow down</span>
          </h2>
          {cascadeChains.length === 0 ? (
            <p className="text-sm" style={{ color: p.muted }}>No container cascades yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cascadeChains.map((chain, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: p.midTeal }}>
                    {chain[0].name}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {chain.map((n, j) => (
                      <div key={n.slug}>
                        <NodeCard n={n} />
                        {j < chain.length - 1 && (
                          <div className="flex justify-center py-0.5" style={{ color: p.muted }}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </KnowledgeBaseLayout>
  );
};

export default KnowledgeBaseLattice;
