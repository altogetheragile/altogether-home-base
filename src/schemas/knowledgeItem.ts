import { z } from 'zod';

export const knowledgeItemSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug is too long'),
  description: z.string().optional(),
  
  // Content
  background: z.string().optional(),
  source: z.string().optional(),
  
  // Publication Reference (normalized)
  primary_publication_id: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().optional().nullable()
  ),
  
  // NEW: Multi-select taxonomy arrays (primary)
  decision_level_ids: z.array(z.string().uuid()).default([]),
  category_ids: z.array(z.string().uuid()).default([]),
  domain_ids: z.array(z.string().uuid()).default([]),
  tag_ids: z.array(z.string().uuid()).default([]),
  
  // Legacy single FK fields (deprecated - kept for backwards compatibility)
  category_id: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().optional().nullable()
  ),
  planning_focus_id: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().optional().nullable()
  ),
  domain_id: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().optional().nullable()
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

export const knowledgeItemDefaults: KnowledgeItemFormData = {
  name: '',
  slug: '',
  description: '',
  background: '',
  source: '',
  primary_publication_id: null,
  // NEW: Multi-select arrays
  decision_level_ids: [],
  category_ids: [],
  domain_ids: [],
  tag_ids: [],
  // Legacy single FK fields
  category_id: null,
  planning_focus_id: null,
  domain_id: null,
  // Enhanced fields
  common_pitfalls: [],
  evidence_sources: [],
  related_techniques: [],
  learning_value_summary: '',
  key_terminology: {},
  is_published: false,
  is_featured: false,
};
