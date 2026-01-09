import { z } from 'zod';

// Item types for the type badge
export const ITEM_TYPES = [
  'technique',
  'framework',
  'template',
  'concept',
  'practice',
  'pattern',
  'tool',
] as const;

export type ItemType = typeof ITEM_TYPES[number];

// Enhanced junction table item with primary/rationale
export const classificationWithPrimarySchema = z.object({
  id: z.string().uuid(),
  is_primary: z.boolean().default(false),
  rationale: z.string().optional().nullable(),
});

export type ClassificationWithPrimary = z.infer<typeof classificationWithPrimarySchema>;

export const knowledgeItemSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug is too long'),
  description: z.string().optional(),
  
  // Item Type (Technique, Framework, Template, etc.)
  item_type: z.enum(ITEM_TYPES).default('technique'),
  
  // Content
  background: z.string().optional(),
  source: z.string().optional(),
  
  // NEW: Governance & Intent Fields
  why_it_exists: z.string().optional(),
  typical_output: z.string().optional(),
  
  // NEW: Array fields for Read View sections
  what_good_looks_like: z.array(z.string()).default([]),
  decisions_supported: z.array(z.string()).default([]),
  decision_boundaries: z.string().optional(),
  governance_value: z.string().optional(),
  use_this_when: z.array(z.string()).default([]),
  avoid_when: z.array(z.string()).default([]),
  
  // NEW: Learning & Improvement
  inspect_adapt_signals: z.array(z.string()).default([]),
  maturity_indicators: z.array(z.string()).default([]),
  
  // Publication Reference (normalized)
  primary_publication_id: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().uuid().optional().nullable()
  ),
  
  // Multi-select taxonomy arrays (IDs only for form state)
  decision_level_ids: z.array(z.string().uuid()).default([]),
  category_ids: z.array(z.string().uuid()).default([]),
  domain_ids: z.array(z.string().uuid()).default([]),
  tag_ids: z.array(z.string().uuid()).default([]),
  
  // NEW: Primary selections and rationales for each classification type
  primary_decision_level_id: z.string().uuid().optional().nullable(),
  primary_category_id: z.string().uuid().optional().nullable(),
  primary_domain_id: z.string().uuid().optional().nullable(),
  decision_level_rationale: z.string().optional(),
  category_rationale: z.string().optional(),
  domain_rationale: z.string().optional(),
  
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
  item_type: 'technique',
  background: '',
  source: '',
  // Governance & Intent
  why_it_exists: '',
  typical_output: '',
  // Array fields for Read View
  what_good_looks_like: [],
  decisions_supported: [],
  decision_boundaries: '',
  governance_value: '',
  use_this_when: [],
  avoid_when: [],
  // Learning & Improvement
  inspect_adapt_signals: [],
  maturity_indicators: [],
  // Publication
  primary_publication_id: null,
  // Multi-select arrays
  decision_level_ids: [],
  category_ids: [],
  domain_ids: [],
  tag_ids: [],
  // Primary selections
  primary_decision_level_id: null,
  primary_category_id: null,
  primary_domain_id: null,
  decision_level_rationale: '',
  category_rationale: '',
  domain_rationale: '',
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
