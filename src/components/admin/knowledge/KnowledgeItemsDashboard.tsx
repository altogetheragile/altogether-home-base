import { ContentStudioDashboard } from './ContentStudioDashboard';

// Legacy filters type for backward compatibility
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

export const KnowledgeItemsDashboard = () => {
  return <ContentStudioDashboard />;
};