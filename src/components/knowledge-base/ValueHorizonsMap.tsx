import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
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

// Concise, cell-level questions taken from the ISA-O3 Value Horizons canvas
// (Template B). Keyed [horizon][layer][isa]. One short question per cell keeps
// the canvas to a single page; the artifacts that live in the cell are listed
// beneath as small links.
const CELL_QUESTIONS: Record<string, Record<string, Record<string, string>>> = {
  Organisation: {
    Anchoring: {
      Intent: 'What is our purpose and direction?',
      Scope: 'What do we do, and for whom?',
      Approach: 'What rules guide how we decide?',
    },
    Iterative: {
      Intent: 'What must we achieve this period?',
      Scope: 'How do we create and capture value?',
      Approach: 'How are we organised to operate?',
    },
    Evidence: {
      Intent: 'What progress are we making toward our goals?',
      Scope: 'What are we now able to offer that we could not before?',
      Approach: 'Is the way we run things enabling or hindering us?',
    },
  },
  Coordination: {
    Anchoring: {
      Intent: "What is this initiative's purpose and direction?",
      Scope: 'What do we offer, and to whom?',
      Approach: 'Set delivery principles here, or inherit them.',
    },
    Iterative: {
      Intent: 'What will success look like?',
      Scope: 'What have we committed to deliver, and for whom?',
      Approach: 'How and when will we deliver?',
    },
    Evidence: {
      Intent: 'Is the work we delivered making a difference?',
      Scope: 'What have we shipped?',
      Approach: 'Is the way we are working together effective?',
    },
  },
  Team: {
    Anchoring: {
      Intent: "What is this team's purpose and direction?",
      Scope: "Set the team's remit here, or inherit it.",
      Approach: 'Set team principles here, or inherit them.',
    },
    Iterative: {
      Intent: 'What are we trying to achieve this cycle?',
      Scope: 'What have we committed to deliver this cycle?',
      Approach: 'What is our approach and plan?',
    },
    Evidence: {
      Intent: 'Is what we built being used and valued?',
      Scope: 'Did we finish to the standard we agreed?',
      Approach: 'What would make us work better next time?',
    },
  },
};

function Cell({ question, artifacts }: { question?: string; artifacts: KbArtifact[] }) {
  const empty = artifacts.length === 0;
  return (
    <div
      className="rounded-md px-2 py-1.5 flex flex-col gap-1 min-h-[54px] justify-center"
      style={{ background: p.white, border: `1px solid ${p.paleTeal}` }}
    >
      {question && (
        <span
          className="text-xs leading-snug"
          style={{ color: empty ? p.muted : p.body, opacity: empty ? 0.7 : 1 }}
        >
          {question}
        </span>
      )}
      {!empty && (
        <div className="leading-tight">
          {artifacts.map((a, i) => (
            <span key={a.id}>
              <Link
                to={`/knowledge-base/artifacts/${a.id}`}
                className="text-[10px] font-semibold uppercase tracking-wide hover:underline"
                style={{ color: p.deepTeal }}
                title={a.oneLiner || a.name}
              >
                {a.name}
              </Link>
              {i < artifacts.length - 1 && (
                <span className="text-[10px]" style={{ color: p.muted }}> · </span>
              )}
            </span>
          ))}
        </div>
      )}
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
    <div className="flex gap-1.5 items-stretch">
      {/* Left rail: Intent cascades down (top-down planning) */}
      <div
        className="flex flex-col items-center justify-between rounded-md shrink-0 py-2"
        style={{ width: 22, background: '#FFF3E0', border: '1px solid #F5D9A0' }}
      >
        <ArrowDown size={14} style={{ color: '#CC7510' }} />
        <span
          className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: '#CC7510', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Intent
        </span>
        <span className="w-3.5" />
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 space-y-2">
      {/* Column headers (leading spacers align with the vertical horizon label + layer label) */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: '28px 74px repeat(3, minmax(0, 1fr))' }}>
        <div />
        <div />
        {ISA.map((s) => (
          <div
            key={s}
            className="rounded-md px-3 py-1 text-sm font-semibold"
            style={{ background: p.skyTeal, color: p.deepTeal, border: `1px solid ${p.paleTeal}` }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Horizon blocks — vertical horizon label spans all layer rows */}
      {HORIZONS.map((h) => (
        <div
          key={h}
          className="rounded-xl p-2 grid gap-1.5"
          style={{
            background: HORIZON_TINT[h],
            border: `1.5px solid ${HORIZON_BORDER[h]}`,
            gridTemplateColumns: '28px 74px repeat(3, minmax(0, 1fr))',
          }}
        >
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              gridColumn: '1',
              gridRow: `1 / ${LAYERS.length + 1}`,
              background: p.white,
              border: `1px solid ${HORIZON_BORDER[h]}`,
            }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wide whitespace-nowrap"
              style={{ color: p.deepTeal, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {h}
            </span>
          </div>
          {LAYERS.map((l) => (
            <Fragment key={l}>
              <div
                className="flex items-center text-[11px] font-semibold uppercase tracking-wide px-1"
                style={{ color: p.midTeal }}
              >
                {l}
              </div>
              {ISA.map((s) => (
                <Cell key={s} question={CELL_QUESTIONS[h]?.[l]?.[s]} artifacts={grid[h][l][s]} />
              ))}
            </Fragment>
          ))}
        </div>
      ))}
      </div>

      {/* Right rail: Learning flows up (bottom-up feedback) */}
      <div
        className="flex flex-col items-center justify-between rounded-md shrink-0 py-2"
        style={{ width: 22, background: '#F0FAFA', border: '1px solid #A8E4E2' }}
      >
        <span className="w-3.5" />
        <span
          className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: '#2FA8A3', writingMode: 'vertical-rl' }}
        >
          Learning
        </span>
        <ArrowUp size={14} style={{ color: '#2FA8A3' }} />
      </div>
    </div>
  );
}
