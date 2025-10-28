import { Building2, ListTodo, Hexagon } from 'lucide-react';

export interface TechniqueConfig {
  type: string;
  label: string;
  icon: any;
  tabKey: string;
  description?: string;
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

export const getTabsFromElements = (elements?: any[]): TechniqueConfig[] => {
  if (!elements || elements.length === 0) return [];
  
  const foundTabs = new Map<string, TechniqueConfig>();
  
  elements.forEach((element) => {
    if (element.type && TECHNIQUE_HEXIS[element.type]) {
      const config = TECHNIQUE_HEXIS[element.type];
      foundTabs.set(config.tabKey, config);
    }
  });
  
  return Array.from(foundTabs.values());
};

export const getBMCElementFromCanvas = (elements?: any[]) => {
  if (!elements) return null;
  return elements.find((el) => el.type === 'bmc');
};

export const getUserStoryElementFromCanvas = (elements?: any[]) => {
  if (!elements) return null;
  return elements.find((el) => el.type === 'userStory');
};
