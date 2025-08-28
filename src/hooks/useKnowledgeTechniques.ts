// Legacy support - redirect to new KnowledgeItems hook
import { useKnowledgeItems, useKnowledgeItemBySlug, type KnowledgeItem } from './useKnowledgeItems';

// Alias for backward compatibility
export interface KnowledgeTechnique extends KnowledgeItem {}

// Legacy hook exports that redirect to new ones
export { useKnowledgeItems as useKnowledgeTechniques };
export { useKnowledgeItemBySlug as useKnowledgeTechniqueBySlug };