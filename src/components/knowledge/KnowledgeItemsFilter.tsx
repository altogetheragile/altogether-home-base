import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X, Filter, Target, Users, Layers, Tag, Folder } from "lucide-react";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";
import { useActivityFocus } from "@/hooks/useActivityFocus";
import { usePlanningLayers } from "@/hooks/usePlanningLayers";
import { useActivityDomains } from "@/hooks/useActivityDomains";
import { useActivityCategories } from "@/hooks/useActivityCategories";

interface KnowledgeItemsFilterProps {
  selectedCategory?: string;
  selectedFocus?: string;
  selectedDomain?: string;
  selectedActivityCategory?: string;
  selectedPlanningLayer?: string;
  selectedTag?: string;
  sortBy?: string;
  onCategoryChange: (category?: string) => void;
  onFocusChange: (focus?: string) => void;
  onDomainChange: (domain?: string) => void;
  onActivityCategoryChange: (category?: string) => void;
  onPlanningLayerChange: (layer?: string) => void;
  onTagChange: (tag?: string) => void;
  onSortByChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

export const KnowledgeItemsFilter = ({
  selectedCategory,
  selectedFocus,
  selectedDomain,
  selectedActivityCategory,
  selectedPlanningLayer,
  selectedTag,
  sortBy = 'popularity',
  onCategoryChange,
  onFocusChange,
  onDomainChange,
  onActivityCategoryChange,
  onPlanningLayerChange,
  onTagChange,
  onSortByChange,
  onClearFilters,
}: KnowledgeItemsFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: categories = [] } = useKnowledgeCategories();
  const { data: tags = [] } = useKnowledgeTags();
  const { data: focusOptions = [] } = useActivityFocus();
  const { data: planningLayers = [] } = usePlanningLayers();
  const { data: domains = [] } = useActivityDomains();
  const { data: activityCategories = [] } = useActivityCategories();

  const activeFiltersCount = [
    selectedCategory,
    selectedFocus,
    selectedDomain,
    selectedActivityCategory,
    selectedPlanningLayer,
    selectedTag,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'} Filters
            </Button>
          </div>
        </div>

        {/* Primary Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Activity Category (What) - Primary Tag */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">What (Category)</label>
            </div>
            <Select 
              value={selectedActivityCategory || "all"} 
              onValueChange={(value) => onActivityCategoryChange(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {activityCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Domain (Who) - Primary Tag */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              <label className="text-sm font-medium">Who (Domain)</label>
            </div>
            <Select 
              value={selectedDomain || "all"} 
              onValueChange={(value) => onDomainChange(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select domain..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: domain.color }}
                      />
                      {domain.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Planning Layer - Visual Range Indicator */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <label className="text-sm font-medium">Planning Layer</label>
            </div>
            <Select 
              value={selectedPlanningLayer || "all"} 
              onValueChange={(value) => onPlanningLayerChange(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Layers</SelectItem>
                {planningLayers.map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: layer.color }}
                      />
                      {layer.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filters - Expandable */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            {/* Activity Focus */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Focus</label>
              </div>
              <Select 
                value={selectedFocus || "all"} 
                onValueChange={(value) => onFocusChange(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select focus..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Focus</SelectItem>
                  {focusOptions.map((focus) => (
                    <SelectItem key={focus.id} value={focus.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: focus.color }}
                        />
                        {focus.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Legacy Category */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Legacy Category</label>
              </div>
              <Select 
                value={selectedCategory || "all"} 
                onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Tag</label>
              </div>
              <Select 
                value={selectedTag || "all"} 
                onValueChange={(value) => onTagChange(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.slug}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {selectedActivityCategory && (
              <Badge variant="outline" className="gap-1">
                What: {activityCategories.find(c => c.id === selectedActivityCategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onActivityCategoryChange(undefined)}
                />
              </Badge>
            )}
            {selectedDomain && (
              <Badge variant="outline" className="gap-1">
                Who: {domains.find(d => d.id === selectedDomain)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onDomainChange(undefined)}
                />
              </Badge>
            )}
            {selectedPlanningLayer && (
              <Badge variant="outline" className="gap-1">
                Layer: {planningLayers.find(l => l.id === selectedPlanningLayer)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onPlanningLayerChange(undefined)}
                />
              </Badge>
            )}
            {selectedFocus && (
              <Badge variant="outline" className="gap-1">
                Focus: {focusOptions.find(f => f.id === selectedFocus)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onFocusChange(undefined)}
                />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="outline" className="gap-1">
                Category: {categories.find(c => c.id === selectedCategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onCategoryChange(undefined)}
                />
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="outline" className="gap-1">
                Tag: {tags.find(t => t.slug === selectedTag)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onTagChange(undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};