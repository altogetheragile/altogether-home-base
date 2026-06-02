import { Link } from 'react-router-dom';
import { colors as p } from '@/theme/colors';
import { HORIZONS, ISA, LAYERS } from '@/lib/isaO3';
import { useKnowledgeBase, type KbArtifact } from '@/lib/knowledgeBase';

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

function Cell({ artifacts, inheritablePrompt }: { artifacts: KbArtifact[]; inheritablePrompt: boolean }) {
  return (
    <div
      className="rounded-lg p-2.5 flex flex-col gap-1.5 min-h-[68px]"
      style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}
    >
      {artifacts.length === 0 && inheritablePrompt && (
        <span className="text-xs italic" style={{ color: p.muted, opacity: 0.7 }}>
          Set here, or inherit
        </span>
      )}
      {artifacts.map((a) => (
        <Link
          key={a.id}
          to={`/knowledge-base/artifacts/${a.id}`}
          className="block leading-snug group"
          style={{ color: p.deepTeal }}
          title={a.name}
        >
          <span className="text-sm group-hover:underline" style={{ color: p.body }}>
            {a.question || a.oneLiner || a.name}
          </span>
          <span className="block text-[10px] uppercase tracking-wide mt-0.5" style={{ color: p.muted }}>
            {a.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function ValueHorizonsMap() {
  const { loading, artifactsByCell } = useKnowledgeBase();
  const grid = artifactsByCell();

  if (loading) {
    return <p style={{ color: p.muted }}>Loading the Value Horizons map...</p>;
  }

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: '90px repeat(3, minmax(0, 1fr))' }}>
        <div />
        {ISA.map((s) => (
          <div
            key={s}
            className="rounded-md px-3 py-1.5 text-sm font-semibold"
            style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Horizon blocks */}
      {HORIZONS.map((h) => (
        <div
          key={h}
          className="rounded-xl p-2.5"
          style={{ background: HORIZON_TINT[h], border: `1.5px solid ${HORIZON_BORDER[h]}` }}
        >
          <div className="text-sm font-bold mb-2 px-0.5" style={{ color: p.deepTeal }}>
            {h}
          </div>
          {LAYERS.map((l) => (
            <div
              key={l}
              className="grid gap-1.5 mb-1.5 last:mb-0 items-stretch"
              style={{ gridTemplateColumns: '90px repeat(3, minmax(0, 1fr))' }}
            >
              <div
                className="flex items-center text-xs font-semibold uppercase tracking-wide px-1"
                style={{ color: p.midTeal }}
              >
                {l}
              </div>
              {ISA.map((s) => (
                <Cell key={s} artifacts={grid[h][l][s]} inheritablePrompt={l === 'Anchoring'} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
