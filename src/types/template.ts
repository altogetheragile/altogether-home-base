
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

export interface TemplateFormData {
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
