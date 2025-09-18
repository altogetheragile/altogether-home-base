// Enhanced Template System Types - Foundation Phase

export type TemplateElementType = 'text' | 'shape' | 'icon' | 'image' | 'container' | 'interactive';

export type TemplateShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'polygon' | 'path';

export type TemplateTextType = 'plain' | 'heading' | 'rich' | 'label';

export interface TemplateElementStyle {
  // Universal styling
  opacity?: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  
  // Text styling
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  lineHeight?: number;
  letterSpacing?: number;
  
  // Color styling
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  color?: string; // For text
  
  // Shape styling
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  
  // Layout styling
  padding?: number | { top: number; right: number; bottom: number; left: number };
  margin?: number | { top: number; right: number; bottom: number; left: number };
}

export interface TemplateElementConstraints {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  lockAspectRatio?: boolean;
  snapToGrid?: boolean;
  resizable?: boolean;
  draggable?: boolean;
}

export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  
  // Position and dimensions
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  
  // Styling and constraints
  style: TemplateElementStyle;
  constraints?: TemplateElementConstraints;
  
  // Type-specific content
  content: TemplateElementContent;
  
  // Metadata
  name?: string;
  tags?: string[];
  created?: string;
  modified?: string;
  layer?: string;
}

export type TemplateElementContent = 
  | TemplateTextContent
  | TemplateShapeContent
  | TemplateIconContent
  | TemplateImageContent
  | TemplateContainerContent
  | TemplateInteractiveContent;

export interface TemplateTextContent {
  type: 'text';
  textType: TemplateTextType;
  text: string;
  richText?: any; // Tiptap JSON content
  editable?: boolean;
}

export interface TemplateShapeContent {
  type: 'shape';
  shapeType: TemplateShapeType;
  points?: { x: number; y: number }[]; // For polygons and paths
  radius?: number; // For circles
  startAngle?: number; // For arcs
  endAngle?: number; // For arcs
}

export interface TemplateIconContent {
  type: 'icon';
  iconName: string;
  iconLibrary: 'lucide' | 'heroicons' | 'feather' | 'custom';
  svgPath?: string; // For custom icons
}

export interface TemplateImageContent {
  type: 'image';
  src: string;
  alt?: string;
  fit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  alignment?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface TemplateContainerContent {
  type: 'container';
  children: string[]; // Element IDs
  layout: 'free' | 'grid' | 'flex';
  gridConfig?: {
    columns: number;
    rows: number;
    gap: number;
  };
  flexConfig?: {
    direction: 'row' | 'column';
    justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    align: 'start' | 'center' | 'end' | 'stretch';
    gap: number;
  };
}

export interface TemplateInteractiveContent {
  type: 'interactive';
  fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'slider';
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select, radio
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  defaultValue?: any;
}

export interface TemplateCanvasConfig {
  // Canvas dimensions and layout
  dimensions: {
    width: number;
    height: number;
  };
  
  // Grid and snapping
  grid: {
    enabled: boolean;
    size: number;
    snap: boolean;
    visible: boolean;
    color: string;
  };
  
  // Canvas styling
  background: {
    color: string;
    image?: string;
    pattern?: 'none' | 'dots' | 'lines' | 'grid';
  };
  
  // Export settings
  export: {
    formats: ('png' | 'jpeg' | 'pdf' | 'svg')[];
    quality: number;
    dpi: number;
  };
  
  // Collaboration settings
  collaboration: {
    enabled: boolean;
    cursors: boolean;
    comments: boolean;
    realtime: boolean;
  };
}

export interface EnhancedTemplateConfig {
  // Canvas configuration
  canvas: TemplateCanvasConfig;
  
  // All template elements
  elements: TemplateElement[];
  
  // Element relationships
  groups: Record<string, string[]>; // group_id -> element_ids
  layers: Record<string, string[]>; // layer_name -> element_ids
  
  // Global styling
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  
  // Version and metadata
  version: string;
  created: string;
  modified: string;
  compatibility: string[];
}

export interface EnhancedKnowledgeTemplate {
  id: string;
  title: string;
  description?: string;
  template_type: 'canvas' | 'document' | 'form' | 'worksheet' | 'matrix';
  
  // Enhanced configuration
  config: EnhancedTemplateConfig;
  canvas_config: TemplateCanvasConfig;
  
  // Assets
  assets: string[]; // Asset IDs
  
  // Collaboration
  collaboration: {
    shared_with: string[];
    permissions: Record<string, 'view' | 'edit' | 'admin'>;
    public_link?: string;
  };
  
  // Metadata
  category?: string;
  tags?: string[];
  version: string;
  is_public: boolean;
  usage_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface TemplateAsset {
  id: string;
  template_id: string;
  type: 'image' | 'icon' | 'font' | 'shape';
  storage_path: string;
  original_filename?: string;
  file_size?: number;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  config: EnhancedTemplateConfig;
  canvas_config: TemplateCanvasConfig;
  change_summary?: string;
  created_by?: string;
  created_at: string;
}

// Utility types for the canvas engine
export interface CanvasSelection {
  elementIds: string[];
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CanvasHistory {
  states: EnhancedTemplateConfig[];
  currentIndex: number;
  maxStates: number;
}

export interface CanvasViewport {
  zoom: number;
  pan: { x: number; y: number };
  bounds: {
    minZoom: number;
    maxZoom: number;
    width: number;
    height: number;
  };
}

export interface CanvasTools {
  activeTool: 'select' | 'text' | 'shape' | 'icon' | 'image' | 'pan' | 'zoom';
  brushSize?: number;
  activeColor?: string;
  activeFont?: string;
}

export interface CanvasState {
  config: EnhancedTemplateConfig;
  selection: CanvasSelection;
  viewport: CanvasViewport;
  tools: CanvasTools;
  history: CanvasHistory;
  isDirty: boolean;
  isLoading: boolean;
  error?: string;
}