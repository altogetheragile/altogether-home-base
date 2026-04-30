export type TaxonomyType = 'decision-levels' | 'categories' | 'domains' | 'tags';

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  display_order?: number;
  full_description?: string;
  usage_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface TaxonomyFormData {
  name: string;
  slug: string;
  description: string;
  full_description: string;
  color: string;
  display_order: number;
}

export interface TabConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  addLabel: string;
  hasOrder: boolean;
  hasColor: boolean;
}
