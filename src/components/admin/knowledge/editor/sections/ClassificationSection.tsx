import { useFormContext } from 'react-hook-form';
import { FolderOpen, Layers, Target, Sparkles, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useDecisionLevels } from '@/hooks/useDecisionLevels';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { useVisibleClassifications } from '@/hooks/useClassificationConfig';
import { MultiSelectClassification } from '../MultiSelectClassification';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

export const ClassificationSection: React.FC = () => {
  const form = useFormContext<KnowledgeItemFormData>();
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

  // Get selected items for summary
  const selectedDecisionLevels = decisionLevels?.filter(l => decisionLevelIds.includes(l.id)) || [];
  const selectedCategories = categories?.filter(c => categoryIds.includes(c.id)) || [];
  const selectedDomains = domains?.filter(d => domainIds.includes(d.id)) || [];
  const selectedTags = tags?.filter(t => tagIds.includes(t.id)) || [];

  const hasAnySelection = selectedDecisionLevels.length > 0 || selectedCategories.length > 0 || 
                          selectedDomains.length > 0 || selectedTags.length > 0;

  // Build tabs based on visibility
  const tabs = [];
  if (visibility.planningFocuses) {
    tabs.push({ id: 'decision-levels', label: visibility.getLabel('planning-focuses') || 'Decision Levels', icon: Layers, count: decisionLevelIds.length });
  }
  if (visibility.categories) {
    tabs.push({ id: 'categories', label: visibility.getLabel('categories') || 'Categories', icon: FolderOpen, count: categoryIds.length });
  }
  if (visibility.activityDomains) {
    tabs.push({ id: 'domains', label: visibility.getLabel('activity-domains') || 'Activity Domains', icon: Target, count: domainIds.length });
  }
  tabs.push({ id: 'tags', label: 'Tags', icon: Tag, count: tagIds.length });

  const defaultTab = tabs[0]?.id || 'categories';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Classification & Organization</h2>
            <p className="text-muted-foreground">
              Select multiple classifications across each dimension for better discoverability
            </p>
          </div>
        </div>
      </div>

      {/* Taxonomy Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Decision Levels Tab */}
        {visibility.planningFocuses && (
          <TabsContent value="decision-levels" className="mt-4">
            <MultiSelectClassification
              title={visibility.getLabel('planning-focuses') || 'Decision Level'}
              description="Select the decision levels where this knowledge applies"
              icon={<Layers className="h-4 w-4 text-primary" />}
              fieldName="decision_level_ids"
              items={decisionLevels || []}
              isLoading={levelsLoading}
            />
          </TabsContent>
        )}

        {/* Categories Tab */}
        {visibility.categories && (
          <TabsContent value="categories" className="mt-4">
            <MultiSelectClassification
              title={visibility.getLabel('categories') || 'Categories'}
              description="Choose categories that describe this knowledge item"
              icon={<FolderOpen className="h-4 w-4 text-primary" />}
              fieldName="category_ids"
              items={categories || []}
              isLoading={categoriesLoading}
            />
          </TabsContent>
        )}

        {/* Activity Domains Tab */}
        {visibility.activityDomains && (
          <TabsContent value="domains" className="mt-4">
            <MultiSelectClassification
              title={visibility.getLabel('activity-domains') || 'Activity Domains'}
              description="Select the domains where this knowledge is relevant"
              icon={<Target className="h-4 w-4 text-primary" />}
              fieldName="domain_ids"
              items={domains || []}
              isLoading={domainsLoading}
            />
          </TabsContent>
        )}

        {/* Tags Tab */}
        <TabsContent value="tags" className="mt-4">
          <MultiSelectClassification
            title="Tags"
            description="Add tags for additional categorization and search"
            icon={<Tag className="h-4 w-4 text-primary" />}
            fieldName="tag_ids"
            items={tags || []}
            isLoading={tagsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Classification Summary */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Classification Summary
          </CardTitle>
          <CardDescription className="text-xs">
            All selected classifications for this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasAnySelection ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
              <p className="text-sm">No classifications selected yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Decision Levels */}
              {selectedDecisionLevels.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    Decision Levels
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDecisionLevels.map((level) => (
                      <Badge
                        key={level.id}
                        variant="outline"
                        className="px-2 py-0.5 text-xs"
                        style={{
                          borderColor: level.color || undefined,
                          color: level.color || undefined,
                        }}
                      >
                        {level.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {selectedCategories.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: category.color ? `${category.color}15` : undefined,
                          color: category.color || undefined,
                          borderColor: category.color ? `${category.color}30` : undefined,
                        }}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Domains */}
              {selectedDomains.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Activity Domains
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDomains.map((domain) => (
                      <Badge
                        key={domain.id}
                        variant="outline"
                        className="px-2 py-0.5 text-xs"
                        style={{
                          borderColor: domain.color || undefined,
                          color: domain.color || undefined,
                        }}
                      >
                        {domain.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="px-2 py-0.5 text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
