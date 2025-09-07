
export interface EventTemplate {
  id: string;
  title: string;
  description?: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  event_type_id?: string;
  category_id?: string;
  level_id?: string;
  format_id?: string;
  created_at: string;
  // Enhanced metadata for template branding
  brand_color?: string;
  icon_name?: string;
  hero_image_url?: string;
  banner_template?: string;
  learning_outcomes?: string[];
  prerequisites?: string[];
  target_audience?: string;
  key_benefits?: string[];
  template_tags?: string[];
  difficulty_rating?: 'beginner' | 'intermediate' | 'advanced';
  popularity_score?: number;
}

// Knowledge Template Types
export type TemplateType = 'canvas' | 'matrix' | 'worksheet' | 'process' | 'form';

export type TemplateFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'date' | 'slider';

export interface TemplateField {
  id: string;
  type: TemplateFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select, radio
  min?: number; // For number, slider
  max?: number; // For number, slider
  defaultValue?: any;
  validation?: {
    pattern?: string;
    message?: string;
  };
  // Position and styling
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  fields: TemplateField[];
}

export interface TemplateCalculation {
  id: string;
  formula: string; // e.g., "reach * impact * confidence / effort"
  dependsOn: string[]; // field IDs
  displayName: string;
}

export interface TemplateConfig {
  layout: 'grid' | 'canvas' | 'form';
  dimensions: {
    width: number;
    height: number;
    grid?: string; // e.g., "3x3"
  };
  sections: TemplateSection[];
  calculations?: TemplateCalculation[];
  styling: {
    backgroundColor?: string;
    fontFamily?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface KnowledgeTemplate {
  id: string;
  title: string;
  description?: string;
  template_type: TemplateType;
  config: TemplateConfig;
  category?: string;
  version: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface KnowledgeItemTemplate {
  id: string;
  knowledge_item_id: string;
  template_id: string;
  custom_config?: Partial<TemplateConfig>;
  display_order: number;
  created_at: string;
  // Joined data
  template?: KnowledgeTemplate;
}

export interface TemplateUsage {
  id: string;
  template_id: string;
  user_id?: string;
  session_data: Record<string, any>;
  exported_format?: 'pdf' | 'png' | 'excel';
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  virtual_url?: string;
}

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
}

export interface EventTemplateFormData {
  title: string;
  description: string;
  duration_days: number;
  default_location_id: string;
  default_instructor_id: string;
  event_type_id: string;
  category_id: string;
  level_id: string;
  format_id: string;
}

export interface KnowledgeTemplateFormData {
  title: string;
  description?: string;
  template_type: TemplateType;
  category?: string;
  is_public: boolean;
}
