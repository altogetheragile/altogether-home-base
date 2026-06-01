import { useParams, Link, Navigate } from 'react-router-dom';
import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { useKnowledgeBase } from '@/lib/knowledgeBase';
import { colors as p } from '@/theme/colors';

const KnowledgeBaseTechnique = () => {
  const { id = '' } = useParams();
  const kb = useKnowledgeBase();

  if (kb.loading) {
    return (
      <KnowledgeBaseLayout title="Technique - Altogether Agile">
        <p style={{ color: p.muted }}>Loading...</p>
      </KnowledgeBaseLayout>
    );
  }

  const technique = kb.getTechnique(id);
  if (!technique) {
    if (kb.getArtifact(id)) return <Navigate to={`/knowledge-base/artifacts/${id}`} replace />;
    return (
      <KnowledgeBaseLayout title="Not found - Altogether Agile" crumbs={[{ label: 'Techniques', to: '/knowledge-base/techniques' }, { label: 'Not found' }]}>
        <p style={{ color: p.body }}>That technique could not be found.</p>
      </KnowledgeBaseLayout>
    );
  }

  const produces = kb.artifactsForTechnique(id);
  const related = kb.relatedTechniques(id);

  return (
    <KnowledgeBaseLayout
      title={`${technique.name} - Technique - Altogether Agile`}
      description={technique.description.slice(0, 160)}
      canonicalPath={`/knowledge-base/techniques/${technique.id}`}
      crumbs={[{ label: 'Map', to: '/knowledge-base' }, { label: 'Techniques', to: '/knowledge-base/techniques' }, { label: technique.name }]}
    >
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          {technique.name}
        </h1>
        {technique.source && (
          <p className="text-sm mb-4" style={{ color: p.muted }}>Source: {technique.source}</p>
        )}

        {technique.description && (
          <p className="mb-6 leading-relaxed" style={{ color: p.body }}>{technique.description}</p>
        )}

        {/* Used To Produce */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Used To Produce</h2>
          {produces.length === 0 ? (
            <p className="text-sm" style={{ color: p.muted }}>No artifacts linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {produces.map((a) => (
                <Link
                  key={a.id}
                  to={`/knowledge-base/artifacts/${a.id}`}
                  className="rounded-full px-3 py-1 text-sm font-semibold hover:underline"
                  style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  {a.name}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Related Techniques */}
        {related.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>Related Techniques</h2>
            <div className="flex flex-wrap gap-1.5">
              {related.map((t) => (
                <Link
                  key={t.id}
                  to={`/knowledge-base/techniques/${t.id}`}
                  className="rounded-full px-3 py-1 text-sm font-semibold hover:underline"
                  style={{ background: p.white, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How To Run It - authored slot */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: p.deepTeal }}>How To Run It</h2>
          <p className="text-sm italic" style={{ color: p.muted }}>Coming soon.</p>
        </section>
      </div>
    </KnowledgeBaseLayout>
  );
};

export default KnowledgeBaseTechnique;
