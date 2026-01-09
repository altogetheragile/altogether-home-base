import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Target, Users, Layers, Info, Filter } from 'lucide-react';
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

  // Get primary and secondary classifications
  const primaryCategory = (item.categories || []).find(c => c.is_primary) || item.categories?.[0];
  const secondaryCategories = (item.categories || []).filter(c => c.id !== primaryCategory?.id);
  
  const primaryDecisionLevel = (item.decision_levels || []).find(d => d.is_primary) || item.decision_levels?.[0];
  const secondaryDecisionLevels = (item.decision_levels || []).filter(d => d.id !== primaryDecisionLevel?.id);
  
  const primaryDomain = (item.domains || []).find(d => d.is_primary) || item.domains?.[0];
  const secondaryDomains = (item.domains || []).filter(d => d.id !== primaryDomain?.id);

  const handleNavigate = (type: 'category' | 'level' | 'domain', id: string) => {
    navigate(`/knowledge?${type}=${id}`);
  };

  const renderBadge = (
    classificationItem: ClassificationItem,
    isPrimary: boolean,
    type: 'category' | 'level' | 'domain'
  ) => (
    <Badge
      key={classificationItem.id}
      variant={isPrimary ? 'default' : 'outline'}
      className="cursor-pointer hover:scale-105 transition-all group whitespace-nowrap py-1.5 px-3"
      style={!isPrimary && classificationItem.color ? {
        backgroundColor: classificationItem.color + '15',
        borderColor: classificationItem.color + '40',
        color: classificationItem.color || undefined
      } : undefined}
      onClick={() => handleNavigate(type, classificationItem.id)}
    >
      <span>{classificationItem.name}</span>
      <Filter className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
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
        {/* Categories Section */}
        {hasCategories && (
          <div className="space-y-3">
            {/* Primary Use-case */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Primary use-case
              </div>
              <div className="flex items-center gap-2">
                {primaryCategory && renderBadge(primaryCategory, true, 'category')}
              </div>
            </div>
            
            {/* Secondary Categories */}
            {secondaryCategories.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground pl-5">
                  Also useful for
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pl-5">
                    {secondaryCategories.map(cat => renderBadge(cat, false, 'category'))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Decision Levels Section */}
        {hasDecisionLevels && (
          <div className="space-y-3">
            {/* Primary Decision Level */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Primary decision level
              </div>
              <div className="flex items-center gap-2">
                {primaryDecisionLevel && renderBadge(primaryDecisionLevel, true, 'level')}
              </div>
            </div>
            
            {/* Secondary Decision Levels */}
            {secondaryDecisionLevels.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground pl-5">
                  Also applies at
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pl-5">
                    {secondaryDecisionLevels.map(level => renderBadge(level, false, 'level'))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Domains Section */}
        {hasDomains && (
          <div className="space-y-3">
            {/* Primary Domain */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Primary domain
              </div>
              <div className="flex items-center gap-2">
                {primaryDomain && renderBadge(primaryDomain, true, 'domain')}
              </div>
            </div>
            
            {/* Secondary Domains */}
            {secondaryDomains.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground pl-5">
                  Also involves
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pl-5">
                    {secondaryDomains.map(domain => renderBadge(domain, false, 'domain'))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Framework note */}
        <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click any tag to filter the Knowledge Base.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
