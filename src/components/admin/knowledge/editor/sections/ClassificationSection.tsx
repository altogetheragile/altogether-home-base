import { useFormContext } from 'react-hook-form';
import { FolderOpen, Layers, Target, Sparkles, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // Count visible classifications for grid layout
  const visibleCount = [visibility.categories, visibility.planningFocuses, visibility.activityDomains, true].filter(Boolean).length;
  const gridCols = visibleCount <= 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-4';

  return (
    <div className="space-y-8">
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

      {/* Classification Cards - Multi-Select */}
      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {/* Decision Levels (replaces Planning Focus) */}
        {visibility.planningFocuses && (
          <MultiSelectClassification
            title={visibility.getLabel('planning-focuses') || 'Decision Level'}
            description="Select the decision levels where this knowledge applies"
            icon={<Layers className="h-4 w-4 text-primary" />}
            fieldName="decision_level_ids"
            items={decisionLevels || []}
            isLoading={levelsLoading}
          />
        )}

        {/* Categories */}
        {visibility.categories && (
          <MultiSelectClassification
            title={visibility.getLabel('categories') || 'Categories'}
            description="Choose categories that describe this knowledge item"
            icon={<FolderOpen className="h-4 w-4 text-primary" />}
            fieldName="category_ids"
            items={categories || []}
            isLoading={categoriesLoading}
          />
        )}

        {/* Activity Domains */}
        {visibility.activityDomains && (
          <MultiSelectClassification
            title={visibility.getLabel('activity-domains') || 'Activity Domains'}
            description="Select the domains where this knowledge is relevant"
            icon={<Target className="h-4 w-4 text-primary" />}
            fieldName="domain_ids"
            items={domains || []}
            isLoading={domainsLoading}
          />
        )}

        {/* Tags */}
        <MultiSelectClassification
          title="Tags"
          description="Add tags for additional categorization and search"
          icon={<Tag className="h-4 w-4 text-primary" />}
          fieldName="tag_ids"
          items={tags || []}
          isLoading={tagsLoading}
        />
      </div>

      {/* Classification Summary */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Classification Summary
          </CardTitle>
          <CardDescription>
            Review all selected classifications for this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAnySelection ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
              <p className="text-sm">No classifications selected yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Decision Levels */}
              {selectedDecisionLevels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    Decision Levels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDecisionLevels.map((level) => (
                      <Badge
                        key={level.id}
                        variant="outline"
                        className="px-3 py-1.5 font-medium text-sm"
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="px-3 py-1.5 font-medium text-sm"
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Activity Domains
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDomains.map((domain) => (
                      <Badge
                        key={domain.id}
                        variant="outline"
                        className="px-3 py-1.5 font-medium text-sm"
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasAnySelection && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-primary/80 leading-relaxed">
                These classifications help users discover your content through search and filtering.
                Multiple selections enable more flexible categorization and improved recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
