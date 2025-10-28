import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeItems } from '@/hooks/useKnowledgeItems';
import { usePlanningFocuses } from '@/hooks/usePlanningFocuses';
import { Search, Plus, Check, Hexagon, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { inferIconForItem } from '@/utils/inferIconForItem';
import { getTechniqueTypeFromSlug } from '@/utils/techniqueMapping';

interface HexiSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKnowledgeItem: (itemId: string, itemData: any) => void;
  onAddPlanningFocus: (focusId: string, focusData: any) => void;
  onAddCustomHexi: () => void;
  existingItemIds: string[];
}

export const HexiSelector: React.FC<HexiSelectorProps> = ({
  isOpen,
  onClose,
  onAddKnowledgeItem,
  onAddPlanningFocus,
  onAddCustomHexi,
  existingItemIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('techniques');

  const { data: allKnowledgeItems, isLoading: isLoadingKnowledge } = useKnowledgeItems();
  const { data: planningFocuses, isLoading: isLoadingFocuses } = usePlanningFocuses();

  // Separate techniques from regular knowledge items
  const { techniques, knowledgeItems } = useMemo(() => {
    if (!allKnowledgeItems) return { techniques: [], knowledgeItems: [] };

    const techs: any[] = [];
    const items: any[] = [];

    allKnowledgeItems.forEach(item => {
      const techniqueType = getTechniqueTypeFromSlug(item.slug);
      if (techniqueType) {
        techs.push({ ...item, techniqueType });
      } else {
        items.push(item);
      }
    });

    return { techniques: techs, knowledgeItems: items };
  }, [allKnowledgeItems]);

  // Filter based on search
  const filteredTechniques = useMemo(() => {
    if (!searchQuery) return techniques;
    return techniques.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [techniques, searchQuery]);

  const filteredKnowledgeItems = useMemo(() => {
    if (!searchQuery) return knowledgeItems;
    return knowledgeItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [knowledgeItems, searchQuery]);

  const filteredFocuses = useMemo(() => {
    if (!planningFocuses || !searchQuery) return planningFocuses || [];
    return planningFocuses.filter(focus =>
      focus.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [planningFocuses, searchQuery]);

  const handleAddKnowledgeItem = (item: any) => {
    const icon = inferIconForItem(item.name, item.knowledge_categories?.name);
    
    onAddKnowledgeItem(item.id, {
      name: item.name,
      slug: item.slug,
      description: item.description,
      activity_domains: item.activity_domains,
      planning_focuses: item.planning_focuses,
      knowledge_categories: item.knowledge_categories,
      techniqueType: item.techniqueType, // Include technique type if present
      icon,
      emoji: undefined,
    });
  };

  const handleAddPlanningFocus = (focus: any) => {
    onAddPlanningFocus(focus.id, {
      name: focus.name,
      color: focus.color,
      description: focus.description,
    });
  };

  const renderItemGrid = (items: any[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const isAdded = existingItemIds.includes(item.id);
          const isTechnique = !!item.techniqueType;
          
          return (
            <div
              key={item.id}
              className="border rounded-lg p-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium line-clamp-2">
                      {item.name}
                    </h4>
                    {isTechnique && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Creates Tab
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? "secondary" : "default"}
                    onClick={() => !isAdded && handleAddKnowledgeItem(item)}
                    disabled={isAdded}
                    className="shrink-0"
                  >
                    {isAdded ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.activity_domains && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: item.activity_domains.color,
                        color: item.activity_domains.color,
                      }}
                    >
                      {item.activity_domains.name}
                    </Badge>
                  )}
                  {item.planning_focuses && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: item.planning_focuses.color,
                        color: item.planning_focuses.color,
                      }}
                    >
                      {item.planning_focuses.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Hexi to Canvas</DialogTitle>
          <DialogDescription>
            Choose a hexi type to add to your canvas. Technique hexis create dedicated workspace tabs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hexis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="techniques">Techniques</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="techniques" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto">
                {renderItemGrid(
                  filteredTechniques,
                  isLoadingKnowledge,
                  'No techniques found'
                )}
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto">
                {renderItemGrid(
                  filteredKnowledgeItems,
                  isLoadingKnowledge,
                  'No knowledge items found'
                )}
              </div>
            </TabsContent>

            <TabsContent value="planning" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto">
                {isLoadingFocuses ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : filteredFocuses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No planning focuses found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredFocuses.map(focus => (
                      <div
                        key={focus.id}
                        className="border rounded-lg p-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: focus.color }}
                            />
                            <h4 className="text-sm font-medium line-clamp-2">
                              {focus.name}
                            </h4>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddPlanningFocus(focus)}
                            className="shrink-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {focus.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {focus.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <div className="text-center py-12">
                <Hexagon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-sm font-medium mb-2">Create Custom Hexi</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a blank hexi to your canvas and customize it as needed
                </p>
                <Button onClick={() => { onAddCustomHexi(); onClose(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Hexi
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
