// Shared types for knowledge item components

export interface KnowledgeItemsFiltersType {
  search: string;
  categories: string[];
  planningLayers: string[];
  domains: string[];
  status: 'all' | 'published' | 'draft';
  hasUseCases: 'all' | 'yes' | 'no';
  dateRange: { from?: Date; to?: Date };
  sortBy: 'recent' | 'alphabetical' | 'popularity' | 'views';
}
