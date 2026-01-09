import { useFormContext } from 'react-hook-form';
import { FolderOpen, Layers, Target, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useDecisionLevels } from '@/hooks/useDecisionLevels';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { useVisibleClassifications } from '@/hooks/useClassificationConfig';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface ClassificationItem {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}

interface ClassificationChecklistProps {
  items: ClassificationItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isLoading?: boolean;
}

const ClassificationChecklist = ({ items, selectedIds, onToggle, isLoading }: ClassificationChecklistProps) => {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading...</div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No items available</div>;
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2 p-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={selectedIds.includes(item.id)}
              onCheckedChange={() => onToggle(item.id)}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.color && (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm truncate">{item.name}</span>
            </div>
          </label>
        ))}
      </div>
    </ScrollArea>
  );
};

export const InlineClassificationEditor: React.FC = () => {
  const form = useFormContext();
  const { data: categories, isLoading: categoriesLoading } = useKnowledgeCategories();
  const { data: decisionLevels, isLoading: levelsLoading } = useDecisionLevels();
  const { data: domains, isLoading: domainsLoading } = useActivityDomains();
  const { data: tags, isLoading: tagsLoading } = useKnowledgeTags();
  const visibility = useVisibleClassifications();

  // Watch the array fields
  const decisionLevelIds = form.watch('decision_level_ids') || [];
  const categoryIds = form.watch('category_ids') || [];
  const domainIds = form.watch('domain_ids') || [];
  const tagIds = form.watch('tag_ids') || [];

  const toggleItem = (fieldName: string, currentIds: string[], id: string) => {
    if (currentIds.includes(id)) {
      form.setValue(fieldName, currentIds.filter(i => i !== id));
    } else {
      form.setValue(fieldName, [...currentIds, id]);
    }
  };

  // Build tabs based on visibility
  const tabs = [];
  if (visibility.planningFocuses) {
    tabs.push({ id: 'decision-levels', label: 'Decision Levels', icon: Layers, count: decisionLevelIds.length });
  }
  if (visibility.categories) {
    tabs.push({ id: 'categories', label: 'Categories', icon: FolderOpen, count: categoryIds.length });
  }
  if (visibility.activityDomains) {
    tabs.push({ id: 'domains', label: 'Domains', icon: Target, count: domainIds.length });
  }
  tabs.push({ id: 'tags', label: 'Tags', icon: Tag, count: tagIds.length });

  const defaultTab = tabs[0]?.id || 'categories';

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Decision Levels Tab */}
          {visibility.planningFocuses && (
            <TabsContent value="decision-levels" className="mt-3">
              <ClassificationChecklist
                items={decisionLevels || []}
                selectedIds={decisionLevelIds}
                onToggle={(id) => toggleItem('decision_level_ids', decisionLevelIds, id)}
                isLoading={levelsLoading}
              />
            </TabsContent>
          )}

          {/* Categories Tab */}
          {visibility.categories && (
            <TabsContent value="categories" className="mt-3">
              <ClassificationChecklist
                items={categories || []}
                selectedIds={categoryIds}
                onToggle={(id) => toggleItem('category_ids', categoryIds, id)}
                isLoading={categoriesLoading}
              />
            </TabsContent>
          )}

          {/* Activity Domains Tab */}
          {visibility.activityDomains && (
            <TabsContent value="domains" className="mt-3">
              <ClassificationChecklist
                items={domains || []}
                selectedIds={domainIds}
                onToggle={(id) => toggleItem('domain_ids', domainIds, id)}
                isLoading={domainsLoading}
              />
            </TabsContent>
          )}

          {/* Tags Tab */}
          <TabsContent value="tags" className="mt-3">
            <ClassificationChecklist
              items={tags || []}
              selectedIds={tagIds}
              onToggle={(id) => toggleItem('tag_ids', tagIds, id)}
              isLoading={tagsLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
