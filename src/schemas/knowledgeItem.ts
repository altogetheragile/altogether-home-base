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
  reference_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  publication_year: z.number().min(1900).max(2030).optional(),
  
  // Classification
  category_id: z.string().optional(),
  planning_layer_id: z.string().optional(),
  domain_id: z.string().optional(),
  
  // Enhanced Fields
  common_pitfalls: z.array(z.string()).optional().default([]),
  evidence_sources: z.array(z.string()).optional().default([]),
  related_techniques: z.array(z.string()).optional().default([]),
  learning_value_summary: z.string().optional(),
  key_terminology: z.record(z.string(), z.string()).optional().default({}),
  
  // Publication Settings
  is_published: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
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