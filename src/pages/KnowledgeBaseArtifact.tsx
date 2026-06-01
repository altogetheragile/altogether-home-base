import { useParams, Link, Navigate } from 'react-router-dom';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { colors as p } from '@/theme/colors';

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
    >
      <span style={{ color: p.muted }}>{label}:</span> {value}
    </span>
  );
}

const KnowledgeBaseArtifact = () => {
  const { id = '' } = useParams();
  const kb = useKnowledgeBase();

  if (kb.loading) {
    return (
      <KnowledgeBaseLayout title="Artifact - Altogether Agile">
        <p style={{ color: p.muted }}>Loading...</p>
      </KnowledgeBaseLayout>
    );
  }

  const artifact = kb.getArtifact(id);
  if (!artifact) {
    // Slug might be a technique (e.g. an old link) - hand off if so.
    if (kb.getTechnique(id)) return <Navigate to={`/knowledge-base/techniques/${id}`} replace />;
    return (
      <KnowledgeBaseLayout title="Not found - Altogether Agile" crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: 'Not found' }]}>
        <p style={{ color: p.body }}>That artifact could not be found.</p>
      </KnowledgeBaseLayout>
    );
  }

  const techniques = kb.techniquesForArtifact(id);
  const counterparts = kb.counterpartsOf(id);

  return (
    <KnowledgeBaseLayout
      title={`${artifact.name} - Knowledge Base - Altogether Agile`}
      description={artifact.oneLiner}
      canonicalPath={`/knowledge-base/artifacts/${artifact.id}`}
      crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: artifact.name }]}
    >
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          {artifact.name}
        </h1>
        {artifact.oneLiner && <p className="text-base mb-3" style={{ color: p.body }}>{artifact.oneLiner}</p>}

        <div className="flex flex-wrap gap-1.5 mb-5">
          {artifact.kind && <Tag label="Kind" value={artifact.kind} />}
          {artifact.horizon && <Tag label="Horizon" value={artifact.horizon} />}
          {artifact.isa && <Tag label="ISA" value={artifact.isa} />}
          {artifact.layer && <Tag label="Layer" value={artifact.layer} />}
          {artifact.facet && <Tag label="Facet" value={artifact.facet} />}
        </div>

        {artifact.question && (
          <p className="italic mb-5" style={{ color: p.muted }}>{artifact.question}</p>
        )}

        {artifact.description && artifact.description !== artifact.oneLiner && (
          <p className="mb-6 leading-relaxed" style={{ color: p.body }}>{artifact.description}</p>
        )}

        {/* Components */}
        {artifact.components.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Components</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ color: p.muted }}>
                  <th className="text-left py-1.5 pr-3 font-semibold border-b" style={{ borderColor: p.paleTeal }}>Name</th>
                  <th className="text-left py-1.5 pr-3 font-semibold border-b" style={{ borderColor: p.paleTeal }}>Question</th>
                  <th className="text-left py-1.5 font-semibold border-b" style={{ borderColor: p.paleTeal }}>Perspective</th>
                </tr>
              </thead>
              <tbody>
                {artifact.components.map((c, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3 align-top" style={{ color: p.body }}>{c.name}</td>
                    <td className="py-1.5 pr-3 align-top" style={{ color: p.body }}>{c.question}</td>
                    <td className="py-1.5 align-top" style={{ color: p.muted }}>{c.perspective}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Techniques */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Techniques</h2>
          {techniques.length === 0 ? (
            <p className="text-sm" style={{ color: p.muted }}>No techniques linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {techniques.map((t) => (
                <Link
                  key={t.id}
                  to={`/knowledge-base/techniques/${t.id}`}
                  className="rounded-full px-3 py-1 text-sm font-semibold hover:underline"
                  style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Counterparts */}
        {counterparts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Counterparts</h2>
            <div className="flex flex-wrap gap-1.5">
              {counterparts.map((a) => (
                <Link
                  key={a.id}
                  to={`/knowledge-base/artifacts/${a.id}`}
                  className="rounded-full px-3 py-1 text-sm font-semibold hover:underline"
                  style={{ background: p.white, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </KnowledgeBaseLayout>
  );
};

export default KnowledgeBaseArtifact;
