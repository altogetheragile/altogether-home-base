
export interface EventTemplate {
  id: string;
  title: string;
  description?: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
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

export interface TemplateFormData {
  title: string;
  description: string;
  duration_days: number;
  default_location_id: string;
  default_instructor_id: string;
}
