import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Target, Users, Layers, Info } from 'lucide-react';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';

interface ClassificationItem {
  id: string;
  name: string;
  color?: string | null;
  is_primary?: boolean;
  rationale?: string | null;
}

interface DecisionSummaryCardProps {
  item: KnowledgeItem;
  className?: string;
}

export const DecisionSummaryCard: React.FC<DecisionSummaryCardProps> = ({ item, className }) => {
  const navigate = useNavigate();

  // Get primary classifications
  const primaryCategory = (item.categories || []).find(c => c.is_primary) || item.categories?.[0];
  const primaryDecisionLevel = (item.decision_levels || []).find(d => d.is_primary) || item.decision_levels?.[0];
  const primaryDomain = (item.domains || []).find(d => d.is_primary) || item.domains?.[0];

  const handleNavigate = (type: 'category' | 'level' | 'domain', id: string) => {
    navigate(`/knowledge?${type}=${id}`);
  };

  const renderBadge = (
    item: ClassificationItem,
    isPrimary: boolean,
    type: 'category' | 'level' | 'domain'
  ) => (
    <Badge
      key={item.id}
      variant={isPrimary ? 'default' : 'outline'}
      className="cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap py-1.5 px-3"
      style={!isPrimary && item.color ? {
        backgroundColor: item.color + '15',
        borderColor: item.color + '40',
        color: item.color || undefined
      } : undefined}
      onClick={() => handleNavigate(type, item.id)}
    >
      {item.name}
      {isPrimary && <span className="ml-1 opacity-60 text-xs">(primary)</span>}
    </Badge>
  );

  const hasDecisionLevels = (item.decision_levels?.length ?? 0) > 0;
  const hasCategories = (item.categories?.length ?? 0) > 0;
  const hasDomains = (item.domains?.length ?? 0) > 0;

  if (!hasDecisionLevels && !hasCategories && !hasDomains) {
    return null;
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className || ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Decision Summary
        </CardTitle>
        <CardDescription className="text-xs">
          Use-case, decision context, and stakeholder perspective
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Use-case (Category) */}
        {hasCategories && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Primary use-case
            </div>
            <div className="flex items-center gap-2">
              {primaryCategory && renderBadge(primaryCategory, true, 'category')}
            </div>
            {item.categories && item.categories.length > 1 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pt-1">
                  {item.categories
                    .filter(c => c.id !== primaryCategory?.id)
                    .map(cat => renderBadge(cat, false, 'category'))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        )}

        {/* Decision Levels */}
        {hasDecisionLevels && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Decision levels
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {item.decision_levels?.map(level => 
                  renderBadge(level, level.id === primaryDecisionLevel?.id, 'level')
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Domains of Interest */}
        {hasDomains && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Domains of interest
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {item.domains?.map(domain => 
                  renderBadge(domain, domain.id === primaryDomain?.id, 'domain')
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Framework note */}
        <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Categories are situational use-cases. Decision Levels indicate where decisions are made. 
            Click any tag to filter the Knowledge Base.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
