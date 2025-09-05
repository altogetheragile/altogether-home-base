import { z } from 'zod';

export const knowledgeItemSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug is too long'),
  description: z.string().optional(),
  
  // Content
  background: z.string().optional(),
  source: z.string().optional(),
  
  // Author Information
  author: z.string().optional(),
  reference_url: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().url('Invalid URL').optional().nullable()
  ),
  publication_year: z.preprocess(
    (val) => val === '' || val === 0 ? null : val,
    z.number().min(1900).max(2030).optional().nullable()
  ),
  
  // Classification - preprocess empty strings to undefined for UUID fields
  category_id: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().uuid().optional()
  ),
  planning_layer_id: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().uuid().optional()
  ),
  domain_id: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().uuid().optional()
  ),
  
  // Enhanced Fields - these are now required with defaults
  common_pitfalls: z.array(z.string()).default([]),
  evidence_sources: z.array(z.string()).default([]),
  related_techniques: z.array(z.string()).default([]),
  learning_value_summary: z.string().optional(),
  key_terminology: z.record(z.string(), z.string()).default({}),
  
  // Publication Settings
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
});

export type KnowledgeItemFormData = z.infer<typeof knowledgeItemSchema>;

export const knowledgeItemDefaults = {
  name: '',
  slug: '',
  description: '',
  background: '',
  source: '',
  author: '',
  reference_url: '',
  publication_year: undefined,
  category_id: '',
  planning_layer_id: '',
  domain_id: '',
  common_pitfalls: [],
  evidence_sources: [],
  related_techniques: [],
  learning_value_summary: '',
  key_terminology: {},
  is_published: false,
  is_featured: false,
};