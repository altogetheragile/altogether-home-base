import { Building2, ListTodo, Hexagon } from 'lucide-react';

export interface TechniqueConfig {
  type: string;
  label: string;
  icon: any;
  tabKey: string;
  description?: string;
  elementId?: string;
}

export const TECHNIQUE_HEXIS: Record<string, TechniqueConfig> = {
  bmc: {
    type: 'bmc',
    label: 'Business Model Canvas',
    icon: Building2,
    tabKey: 'bmc',
    description: 'Define your business model',
  },
  userStory: {
    type: 'userStory',
    label: 'Product Backlog',
    icon: ListTodo,
    tabKey: 'backlog',
    description: 'Manage epics, features, and user stories',
  },
};

// Map slugs to technique types
const SLUG_TO_TECHNIQUE: Record<string, string> = {
  'business-model-canvas': 'bmc',
  'product-backlog': 'userStory',
};

export const getTechniqueTypeFromSlug = (slug: string): string | null => {
  return SLUG_TO_TECHNIQUE[slug] || null;
};

export const getTabsFromElements = (elements?: any[]): TechniqueConfig[] => {
  if (!elements || elements.length === 0) return [];
  
  const foundTabs = new Map<string, TechniqueConfig>();
  
  elements.forEach((element) => {
    // Only show tabs for elements explicitly opened as tabs
    if (
      element.type === 'knowledgeItem' && 
      element.content?.openAsTab === true &&
      element.content?.techniqueType
    ) {
      const config = TECHNIQUE_HEXIS[element.content.techniqueType];
      if (config) {
        foundTabs.set(config.tabKey, { ...config, elementId: element.id });
      }
    }
  });
  
  return Array.from(foundTabs.values());
};

export const getBMCElementFromCanvas = (elements?: any[]) => {
  if (!elements) return null;
  // Check both legacy direct type and new knowledge item approach
  return elements.find((el) => 
    el.type === 'bmc' || 
    (el.type === 'knowledgeItem' && el.content?.techniqueType === 'bmc')
  );
};

export const getUserStoryElementFromCanvas = (elements?: any[]) => {
  if (!elements) return null;
  // Check both legacy direct type and new knowledge item approach
  return elements.find((el) => 
    el.type === 'userStory' || 
    (el.type === 'knowledgeItem' && el.content?.techniqueType === 'userStory')
  );
};
