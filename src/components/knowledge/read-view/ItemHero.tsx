import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { ITEM_TYPES } from '@/schemas/knowledgeItem';

interface ItemHeroProps {
  item: KnowledgeItem;
}

// Get display label for item type
const getItemTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    technique: 'Technique',
    framework: 'Framework',
    template: 'Template',
    concept: 'Concept',
    practice: 'Practice',
    pattern: 'Pattern',
    tool: 'Tool',
  };
  return labels[type || 'technique'] || 'Technique';
};

// Get color for item type badge
const getItemTypeColor = (type?: string): string => {
  const colors: Record<string, string> = {
    technique: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    framework: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    template: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    concept: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    practice: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    pattern: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    tool: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  };
  return colors[type || 'technique'] || colors.technique;
};

// Extract first sentence from text
const getFirstSentence = (text?: string): string => {
  if (!text) return '';
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.length > 150 ? text.substring(0, 150) + '...' : text;
};

export const ItemHero: React.FC<ItemHeroProps> = ({ item }) => {
  const itemType = (item as any).item_type || 'technique';

  return (
    <div className="space-y-3">
      {/* Type Badge */}
      <Badge 
        variant="outline" 
        className={`text-xs font-medium border ${getItemTypeColor(itemType)}`}
      >
        {getItemTypeLabel(itemType)}
      </Badge>
      
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        {item.name}
      </h1>
      
      {/* Short Summary - first sentence only */}
      {item.description && (
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {getFirstSentence(item.description)}
        </p>
      )}
    </div>
  );
};
