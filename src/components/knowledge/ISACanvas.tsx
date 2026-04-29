import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useKnowledgeItems, KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useIsaDimensions } from '@/hooks/useIsaDimensions';
import { useDecisionLevels } from '@/hooks/useDecisionLevels';
import { useIsMobile } from '@/hooks/use-mobile';

// ISA dimension color palettes (from Agile_Flow_v2_8.html)
const ISA_COLORS: Record<string, {
  bd: string; bg: string; dk: string; lt: string;
}> = {
  intent:   { bd: '#CC7510', bg: '#FFF3E0', dk: '#7A3D00', lt: '#FFF8F0' },
  scope:    { bd: '#2FA8A3', bg: '#E8FAF9', dk: '#003D3A', lt: '#F0FAFA' },
  approach: { bd: '#8B6FE0', bg: '#F0ECFE', dk: '#2A1A6E', lt: '#F8F5FF' },
  evidence: { bd: '#5DB845', bg: '#EDFAE8', dk: '#1A4D08', lt: '#F5FDF3' },
};

// Horizon color palettes
const HORIZON_COLORS: Record<string, {
  bg: string; border: string; text: string;
}> = {
  organisation: { bg: '#F9F5FF', border: '#C8B8F5', text: '#6B46C1' },
  coordination: { bg: '#F0F9FF', border: '#93C5E0', text: '#1E6F9F' },
  team:         { bg: '#FFF7F0', border: '#F5C896', text: '#B45309' },
};

// Guiding questions per horizon × ISA dimension
const CELL_QUESTIONS: Record<string, Record<string, string>> = {
  organisation: {
    intent:   'Who are we, who do we serve and where are we going?',
    scope:    'What will we do and for whom? Which opportunities should we pursue?',
    approach: 'Where will we play and how will we win? How do we run?',
    evidence: 'Is our strategy producing the intended value?',
  },
  coordination: {
    intent:   'Why does this initiative exist? What outcome are we pursuing?',
    scope:    'Who are we serving and what will we deliver?',
    approach: 'How will we deliver, coordinate, and govern this initiative?',
    evidence: 'Are we delivering the right outcomes? Is the initiative on track?',
  },
  team: {
    intent:   'Why this cycle? What must be true by the end of it?',
    scope:    'What are we taking on this cycle?',
    approach: 'How will we actually hit the goal this cycle?',
    evidence: 'What did the cycle produce? How well did the delivery system perform?',
  },
};

// Domain of Interest labels per ISA dimension
const DOMAIN_LABELS: Record<string, string> = {
  intent:   'Value Ownership',
  scope:    'All Three Domains',
  approach: 'Delivery Enablement',
  evidence: 'Flows outward',
};

interface ISACanvasProps {
  searchTerm?: string;
}

const ISACanvas: React.FC<ISACanvasProps> = ({ searchTerm = '' }) => {
  const { data: items = [], isLoading: itemsLoading } = useKnowledgeItems({ showUnpublished: false });
  const { data: isaDimensions = [], isLoading: isaLoading } = useIsaDimensions();
  const { data: decisionLevels = [], isLoading: horizonsLoading } = useDecisionLevels();
  const isMobile = useIsMobile();

  // Filter to the 3 horizons (exclude "General")
  const horizons = useMemo(
    () => decisionLevels.filter(dl => dl.slug !== 'general').sort((a, b) => a.display_order - b.display_order),
    [decisionLevels]
  );

  // Only show artifact-type items that have ISA dimensions
  const artifactItems = useMemo(() => {
    let filtered = items.filter(item =>
      item.item_type === 'artifact' && item.isa_dimensions?.length > 0
    );
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [items, searchTerm]);

  // Group items into a map: "horizonSlug-isaSlug" -> KnowledgeItem[]
  const cellMap = useMemo(() => {
    const map = new Map<string, KnowledgeItem[]>();
    for (const item of artifactItems) {
      for (const horizon of item.decision_levels || []) {
        for (const isa of item.isa_dimensions || []) {
          const key = `${horizon.slug}-${isa.slug}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(item);
        }
      }
    }
    return map;
  }, [artifactItems]);

  const isLoading = itemsLoading || isaLoading || horizonsLoading;

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
        Loading canvas...
      </div>
    );
  }

  if (isMobile) {
    return <MobileCanvas horizons={horizons} isaDimensions={isaDimensions} cellMap={cellMap} />;
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 1123,
      margin: '0 auto 32px',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      overflow: 'hidden',
    }}>
      {/* Canvas header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px 12px',
        borderBottom: '1px solid #E5E7EB',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Altogether Agile</span>
          <span style={{ color: '#E5E7EB', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' as const, color: '#6B7280' }}>Knowledge Base</span>
          <span style={{ color: '#E5E7EB', fontSize: 11 }}>·</span>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: '#004D4D', lineHeight: 1.1 }}>
            Agile Business Architecture Flow
          </h1>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const,
          border: '1.5px dashed #007A7A', color: '#007A7A', borderRadius: 20, padding: '4px 12px', whiteSpace: 'nowrap' as const,
        }}>
          Intent · Scope · Approach · Evidence
        </div>
      </div>

      {/* Canvas body */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Hint */}
        <div style={{
          background: '#F0FAFA',
          border: '1px solid #D9F2F2',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 11,
          color: '#004D4D',
          lineHeight: 1.5,
          marginBottom: 16,
        }}>
          <strong>Three horizons. Four dimensions at each.</strong> Intent cascades inward from Organisation to Team. Evidence flows outward. Each cell shows the artifacts produced at that horizon and the question that unlocks them. Click any artifact to explore it.
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '88px repeat(4, minmax(0, 1fr))',
          gap: 6,
          marginBottom: 6,
        }}>
          <div /> {/* Empty top-left corner */}
          {isaDimensions.map(isa => {
            const c = ISA_COLORS[isa.slug] || ISA_COLORS.intent;
            return (
              <div key={isa.id} style={{
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: c.bg,
                border: `1px solid ${c.bd}`,
              }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, lineHeight: 1, color: c.dk }}>
                  {isa.name}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: c.dk, opacity: 0.7, marginTop: 2 }}>
                  {DOMAIN_LABELS[isa.slug] || ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {horizons.map(horizon => {
            const hc = HORIZON_COLORS[horizon.slug] || HORIZON_COLORS.organisation;
            return (
              <div key={horizon.id} style={{
                display: 'grid',
                gridTemplateColumns: '88px repeat(4, minmax(0, 1fr))',
                gap: 6,
              }}>
                {/* Horizon label */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  padding: '10px 6px',
                  textAlign: 'center',
                  gap: 4,
                  border: `1.5px solid ${hc.border}`,
                  background: hc.bg,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', lineHeight: 1.2, color: hc.text }}>
                    {horizon.name}
                  </div>
                </div>

                {/* ISA cells */}
                {isaDimensions.map(isa => {
                  const c = ISA_COLORS[isa.slug] || ISA_COLORS.intent;
                  const cellItems = cellMap.get(`${horizon.slug}-${isa.slug}`) || [];
                  const question = CELL_QUESTIONS[horizon.slug]?.[isa.slug] || '';

                  return (
                    <div key={`${horizon.id}-${isa.id}`} style={{
                      borderRadius: 8,
                      padding: '10px 12px',
                      border: `1px solid`,
                      borderColor: isa.slug === 'intent' ? '#F5D9A0' :
                                   isa.slug === 'scope' ? '#A8E4E2' :
                                   isa.slug === 'approach' ? '#CFC0F8' : '#B4E8A8',
                      background: c.lt,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      minHeight: 110,
                      transition: 'transform .15s, box-shadow .15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    >
                      {/* Cell horizon label */}
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: c.bd, opacity: 0.5 }}>
                        {horizon.name} · {isa.name}
                      </div>

                      {/* Artifact names */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', lineHeight: 1.4 }}>
                        {cellItems.length > 0
                          ? cellItems.map((item, i) => (
                              <React.Fragment key={item.id}>
                                {i > 0 && <span style={{ fontWeight: 400 }}> · </span>}
                                <Link
                                  to={`/knowledge/${item.slug}`}
                                  style={{
                                    color: '#374151',
                                    textDecoration: 'none',
                                    borderBottom: `1px solid ${c.bd}40`,
                                    transition: 'border-color .15s',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.borderBottomColor = c.bd)}
                                  onMouseLeave={e => (e.currentTarget.style.borderBottomColor = `${c.bd}40`)}
                                >
                                  {item.name}
                                </Link>
                              </React.Fragment>
                            ))
                          : <span style={{ color: '#9CA3AF', fontWeight: 400, fontStyle: 'italic' }}>No artifacts yet</span>
                        }
                      </div>

                      {/* Question */}
                      {question && (
                        <div style={{
                          fontSize: 11,
                          fontStyle: 'italic',
                          lineHeight: 1.45,
                          borderTop: `1px solid ${isa.slug === 'intent' ? '#F5D9A0' : isa.slug === 'scope' ? '#A8E4E2' : isa.slug === 'approach' ? '#CFC0F8' : '#B4E8A8'}`,
                          paddingTop: 6,
                          marginTop: 4,
                          color: c.bd,
                        }}>
                          {question}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Flow arrows */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          marginTop: 14,
          padding: '10px 12px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
        }}>
          <div style={{ flex: 1, fontSize: 10, color: '#6B7280' }}>
            <strong style={{ color: '#CC7510' }}>↓ Intent cascades inward.</strong> Organisation purpose shapes coordination goals. Coordination goals shape team goals. When the chain breaks, teams build without purpose.
          </div>
          <div style={{ width: 1, background: '#E5E7EB', margin: '0 4px' }} />
          <div style={{ flex: 1, fontSize: 10, color: '#6B7280' }}>
            <strong style={{ color: '#5DB845' }}>↑ Evidence flows outward.</strong> Team reviews inform coordination. Coordination reviews inform organisation. Deployed outputs reaching real users are the only true source of evidence.
          </div>
          <div style={{ width: 1, background: '#E5E7EB', margin: '0 4px' }} />
          <div style={{ flex: 1, fontSize: 10, color: '#6B7280' }}>
            <strong style={{ color: '#8B6FE0' }}>⇄ Domains are always active.</strong> Value Ownership (why), Solution Delivery (what/feasibility), Delivery Enablement (how/flow) are present at every horizon.
          </div>
        </div>
      </div>

      {/* Canvas footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 18px',
        borderTop: '1px solid #E5E7EB',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase' as const,
        color: '#6B7280',
      }}>
        <span>Agile Business Architecture Flow · Altogether Agile</span>
        <span>© Altogether Agile</span>
      </div>
    </div>
  );
};

// Mobile layout: stacked horizons with ISA cells
const MobileCanvas: React.FC<{
  horizons: Array<{ id: string; name: string; slug: string }>;
  isaDimensions: Array<{ id: string; name: string; slug: string }>;
  cellMap: Map<string, KnowledgeItem[]>;
}> = ({ horizons, isaDimensions, cellMap }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {horizons.map(horizon => {
        const hc = HORIZON_COLORS[horizon.slug] || HORIZON_COLORS.organisation;
        return (
          <div key={horizon.id} style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,.08)',
            overflow: 'hidden',
          }}>
            {/* Horizon header */}
            <div style={{
              background: hc.bg,
              borderBottom: `2px solid ${hc.border}`,
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: hc.text }}>
                {horizon.name} Horizon
              </div>
            </div>

            {/* ISA cells stacked */}
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isaDimensions.map(isa => {
                const c = ISA_COLORS[isa.slug] || ISA_COLORS.intent;
                const cellItems = cellMap.get(`${horizon.slug}-${isa.slug}`) || [];
                const question = CELL_QUESTIONS[horizon.slug]?.[isa.slug] || '';

                return (
                  <div key={isa.id} style={{
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: `1px solid ${c.bd}40`,
                    background: c.lt,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: c.dk }}>
                      {isa.name}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: 1.4 }}>
                      {cellItems.map((item, i) => (
                        <React.Fragment key={item.id}>
                          {i > 0 && <span style={{ fontWeight: 400 }}> · </span>}
                          <Link to={`/knowledge/${item.slug}`} style={{ color: '#374151', textDecoration: 'none', borderBottom: `1px solid ${c.bd}40` }}>
                            {item.name}
                          </Link>
                        </React.Fragment>
                      ))}
                      {cellItems.length === 0 && (
                        <span style={{ color: '#9CA3AF', fontWeight: 400, fontStyle: 'italic' }}>No artifacts yet</span>
                      )}
                    </div>
                    {question && (
                      <div style={{ fontSize: 11, fontStyle: 'italic', color: c.bd, lineHeight: 1.4 }}>
                        {question}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ISACanvas;
