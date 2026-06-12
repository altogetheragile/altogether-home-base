import {
  type LucideIcon,
  FileText,
  MessagesSquare,
  Target,
  UserCircle,
  Sparkles,
  FileSpreadsheet,
  LayoutTemplate,
  ClipboardList,
  Hexagon,
  FlaskConical,
  LineChart,
  RefreshCw,
  Map as MapIcon,
} from 'lucide-react';

export interface ToolVisual {
  icon: LucideIcon;
  color: string;
}

// Single source of truth for each tool / artifact type's icon and brand colour.
// Keyed by artifact_type where one exists, so the AI Tools Hub, the Project Tools
// menu, artifact cards and the artifact viewer all render the same icon in the
// same colour. Add a tool here once and every surface stays consistent.
export const TOOL_VISUALS: Record<string, ToolVisual> = {
  'coaching-session': { icon: MessagesSquare, color: '#004D4D' },
  'impact-map': { icon: Target, color: '#FF9715' },
  persona: { icon: UserCircle, color: '#C2603A' },
  bmc: { icon: Sparkles, color: '#1A9090' },
  canvas: { icon: FileSpreadsheet, color: '#6B5FCC' },
  'business-case': { icon: FileSpreadsheet, color: '#6B5FCC' },
  'product-vision': { icon: FileSpreadsheet, color: '#6B5FCC' },
  user_story: { icon: LayoutTemplate, color: '#3F8080' },
  'product-backlog': { icon: ClipboardList, color: '#E08A4E' },
  'project-model': { icon: Hexagon, color: '#9C8A6A' },
  'probe-tracker': { icon: FlaskConical, color: '#007A7A' },
  'benefits-scorecard': { icon: LineChart, color: '#FF9715' },
  'ways-of-working': { icon: RefreshCw, color: '#1A9090' },
  'journey-map': { icon: MapIcon, color: '#3F8080' },
};

const FALLBACK: ToolVisual = { icon: FileText, color: '#6B7280' };

export const getToolVisual = (key: string): ToolVisual => TOOL_VISUALS[key] ?? FALLBACK;
