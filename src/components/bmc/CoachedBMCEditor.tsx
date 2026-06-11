import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { CoachChat } from '@/components/coaching/CoachChat';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';
import type { CellCoach } from '@/types/coaching';

const TEAL = '#004D4D';
const MIDTEAL = '#1A9090';
const ORANGE = '#E08A4E';
const TAN = '#9C8A6A';
const PURPLE = '#6B5FCC';

export interface BMCData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

type BMCKey = keyof BMCData;

const emptyBMC = (): BMCData => ({
  keyPartners: [], keyActivities: [], keyResources: [], valuePropositions: [],
  customerRelationships: [], channels: [], customerSegments: [], costStructure: [], revenueStreams: [],
});

const toLines = (val?: string | string[]): string[] => {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : `${val}`.split(/\r?\n|•/g);
  return arr.map((s) => `${s}`.replace(/^[-•\s]+/, '').trim()).filter(Boolean);
};

// The nine blocks, in the order people usually reason about them, each with a
// coaching question and one gentle stretch. Right-hand value side first, then
// the left-hand efficiency side, then the base.
const BMC_CELLS: { key: BMCKey; label: string; coach: CellCoach }[] = [
  { key: 'customerSegments', label: 'Customer Segments', coach: { tag: 'SEGMENTS', question: 'Who are the most important customers you are creating value for?', help: 'The distinct groups of people or organisations you aim to serve.', stretch: 'Which segment are you serving out of habit rather than choice?', color: TEAL } },
  { key: 'valuePropositions', label: 'Value Propositions', coach: { tag: 'VALUE', question: 'What value do you deliver, and which customer problem are you solving?', help: 'The bundle of products and services that creates value for a segment.', stretch: 'Which part of your value do customers actually pay for, rather than the part you are proud of?', color: MIDTEAL } },
  { key: 'channels', label: 'Channels', coach: { tag: 'CHANNELS', question: 'Through which channels do your customers want to be reached?', help: 'How you communicate with and deliver to your segments.', stretch: 'Which channel works because it is easy for you, not easy for them?', color: MIDTEAL } },
  { key: 'customerRelationships', label: 'Customer Relationships', coach: { tag: 'RELATIONSHIPS', question: 'What kind of relationship does each segment expect from you?', help: 'From self-serve to dedicated personal support.', stretch: 'Where are you investing in a relationship the customer does not actually want?', color: ORANGE } },
  { key: 'revenueStreams', label: 'Revenue Streams', coach: { tag: 'REVENUE', question: 'What are customers genuinely willing to pay for, and how?', help: 'The cash you generate from each segment.', stretch: 'Which revenue stream are you assuming will appear rather than testing?', color: ORANGE } },
  { key: 'keyResources', label: 'Key Resources', coach: { tag: 'RESOURCES', question: 'What key resources does your value proposition require?', help: 'The most important assets: people, physical, intellectual, financial.', stretch: 'Which resource would hurt most if it disappeared tomorrow?', color: TAN } },
  { key: 'keyActivities', label: 'Key Activities', coach: { tag: 'ACTIVITIES', question: 'What key activities does your value proposition require?', help: 'The most important things you must do to make the model work.', stretch: 'Which activity do you keep in-house that you no longer need to?', color: TAN } },
  { key: 'keyPartners', label: 'Key Partnerships', coach: { tag: 'PARTNERS', question: 'Who are your key partners and suppliers?', help: 'The network that makes the model work.', stretch: 'Which partner are you depending on more than you would like to admit?', color: PURPLE } },
  { key: 'costStructure', label: 'Cost Structure', coach: { tag: 'COSTS', question: 'What are the most important costs in your model?', help: 'The costs inherent in operating the business model.', stretch: 'Which cost have you normalised that a newcomer would question?', color: PURPLE } },
];

interface CoachedBMCEditorProps {
  initialData?: BMCData;
  initialCompanyName?: string;
  preselectedProjectId?: string;
  onBack?: () => void;
}

export function CoachedBMCEditor({ initialData, initialCompanyName, preselectedProjectId, onBack }: CoachedBMCEditorProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName ?? '');
  const [bmc, setBmc] = useState<BMCData>(() => ({ ...emptyBMC(), ...(initialData ?? {}) }));
  const [coachFor, setCoachFor] = useState<BMCKey | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const bmcRef = useRef<BusinessModelCanvasRef>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const setBlock = (key: BMCKey, value: string[]) => setBmc((b) => ({ ...b, [key]: value }));

  const handleSaveToProject = () => {
    if (!user) {
      toast.error('Please sign in to save to a project');
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };
  const handleSaveComplete = (projectId: string) => {
    toast.success('Business Model Canvas saved to project');
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" /> Choose a different way</Button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <BMCExportDialog companyName={companyName || 'Business Model Canvas'} canvasRef={bmcRef} bmcData={bmc} />
          <Button size="sm" onClick={handleSaveToProject}><Save className="mr-1.5 h-4 w-4" /> Save to Project</Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold tracking-wide text-muted-foreground">NAME</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="The company or initiative this canvas is for" className="mt-1 max-w-md" />
      </div>

      <p className="text-sm text-muted-foreground">
        Fill each block in your own words. Type directly, or ask the coach to help you think it through. Nothing is
        written for you that you did not say.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {BMC_CELLS.map((cell) => (
          <div key={cell.key} className="rounded-lg border border-border bg-card p-3" style={{ borderTopWidth: 3, borderTopColor: cell.coach.color }}>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ color: cell.coach.color }}>{cell.label}</h3>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setCoachFor(coachFor === cell.key ? null : cell.key)}>
                <MessageCircle className="h-3.5 w-3.5" /> {coachFor === cell.key ? 'Hide' : 'Ask the coach'}
              </button>
            </div>
            <p className="mb-1.5 text-xs text-muted-foreground">{cell.coach.help}</p>
            <textarea
              value={bmc[cell.key].join('\n')}
              onChange={(e) => setBlock(cell.key, toLines(e.target.value))}
              rows={4}
              placeholder="One point per line"
              className="w-full resize-none rounded-md border border-border bg-background p-2 text-sm"
            />
            {coachFor === cell.key && (
              <div className="mt-2">
                <CoachChat
                  tool="bmc"
                  cell={{ tag: cell.coach.tag, question: cell.coach.question, stretch: cell.coach.stretch }}
                  onAccept={(text) => { setBlock(cell.key, [...bmc[cell.key], ...toLines(text)]); setCoachFor(null); }}
                  onClose={() => setCoachFor(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-3 text-sm font-bold" style={{ color: TEAL }}>Live preview</h3>
        <BusinessModelCanvas
          ref={bmcRef}
          data={bmc}
          companyName={companyName}
          isEditable
          showWatermark={!user}
          onDataChange={(d) => setBmc(d as BMCData)}
        />
      </div>

      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="bmc"
        artifactName={companyName ? `${companyName} - Business Model Canvas` : 'Business Model Canvas'}
        artifactDescription={companyName ? `Coached BMC for ${companyName}` : 'Coached Business Model Canvas'}
        artifactData={{ formData: { companyName }, bmcData: bmc }}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}
