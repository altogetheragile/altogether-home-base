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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X, Filter, Target, Users, Layers, Tag, Folder, Info } from "lucide-react";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";
import { usePlanningLayers } from "@/hooks/usePlanningLayers";
import { useActivityDomains } from "@/hooks/useActivityDomains";
interface KnowledgeItemsFilterProps {
  selectedDomain?: string;
  selectedCategory?: string;
  selectedPlanningLayer?: string;
  selectedTag?: string;
  sortBy?: string;
  onDomainChange: (domain?: string) => void;
  onCategoryChange: (category?: string) => void;
  onPlanningLayerChange: (layer?: string) => void;
  onTagChange: (tag?: string) => void;
  onSortByChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

export const KnowledgeItemsFilter = ({
  selectedDomain,
  selectedCategory,
  selectedPlanningLayer,
  selectedTag,
  sortBy = 'popularity',
  onDomainChange,
  onCategoryChange,
  onPlanningLayerChange,
  onTagChange,
  onSortByChange,
  onClearFilters,
}: KnowledgeItemsFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: categories = [] } = useKnowledgeCategories();
  const { data: tags = [] } = useKnowledgeTags();
  const { data: planningLayers = [] } = usePlanningLayers();
  const { data: domains = [] } = useActivityDomains();

  const activeFiltersCount = [
    selectedDomain,
    selectedCategory,
    selectedPlanningLayer,
    selectedTag,
  ].filter(value => value && value !== "all").length;

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
          {/* Activity Category - Primary Tag */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Category</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Category information"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-50">
                  <p>What type of activity or technique this is</p>
                </TooltipContent>
              </Tooltip>
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

            {/* Activity Domain - Primary Tag */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                <label className="text-sm font-medium">Domain of Interest</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Domain of Interest information"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-50">
                    <p>The primary role or area of expertise that typically uses this knowledge item</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={selectedDomain || "all"} 
                onValueChange={(value) => onDomainChange(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains of Interest</SelectItem>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Planning Layer information"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-50">
                    <p>At what organizational level this is typically applied</p>
                  </TooltipContent>
                </Tooltip>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
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
            {selectedCategory && selectedCategory !== "all" && (
              <Badge variant="outline" className="gap-1">
                Category: {categories.find(c => c.id === selectedCategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onCategoryChange(undefined)}
                />
              </Badge>
            )}
            {selectedDomain && selectedDomain !== "all" && (
              <Badge variant="outline" className="gap-1">
                Domain of Interest: {domains.find(d => d.id === selectedDomain)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onDomainChange(undefined)}
                />
              </Badge>
            )}
            {selectedPlanningLayer && selectedPlanningLayer !== "all" && (
              <Badge variant="outline" className="gap-1">
                Layer: {planningLayers.find(l => l.id === selectedPlanningLayer)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onPlanningLayerChange(undefined)}
                />
              </Badge>
            )}
            {selectedTag && selectedTag !== "all" && (
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