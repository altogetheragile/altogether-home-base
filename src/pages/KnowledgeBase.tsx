import { KnowledgeBaseLayout } from '@/components/knowledge-base/KnowledgeBaseLayout';
import { ValueHorizonsMap } from '@/components/knowledge-base/ValueHorizonsMap';
import { colors as p } from '@/theme/colors';

const KnowledgeBase = () => {
  return (
    <KnowledgeBaseLayout
      title="Knowledge Base - Value Horizons - Altogether Agile"
      description="The ISA-O3 Value Horizons map: artifacts and techniques across Organisation, Coordination and Team horizons."
      canonicalPath="/knowledge-base"
    >
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1" style={{ color: p.deepTeal, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 }}>
          Value Horizons
        </h1>
        <p className="text-sm max-w-2xl" style={{ color: p.body }}>
          The ISA-O3 framework, mapped across three horizons. Each cell holds the artifacts that
          answer its question. Select an artifact to see its techniques and counterparts.
        </p>
      </div>
      <ValueHorizonsMap />
    </KnowledgeBaseLayout>
  );
};

export default KnowledgeBase;
