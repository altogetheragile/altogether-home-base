import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";

interface KnowledgeFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange: (value?: string) => void;
  selectedTag?: string;
  onTagChange: (value?: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export interface KnowledgeFilterState {
  searchQuery: string;
  category: string;
  tag: string;
  sortBy: string;
}

const KnowledgeFilter = ({ 
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange
}: KnowledgeFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: categories = [] } = useKnowledgeCategories();
  const { data: tags = [] } = useKnowledgeTags();

  const clearAllFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onTagChange("all");
    onSortChange("popularity");
  };

  const hasActiveFilters = 
    searchQuery ||
    (selectedCategory && selectedCategory !== "all") || 
    (selectedTag && selectedTag !== "all") || 
    sortBy !== "popularity";

  const activeFilterCount = 
    (searchQuery ? 1 : 0) +
    (selectedCategory && selectedCategory !== "all" ? 1 : 0) + 
    (selectedTag && selectedTag !== "all" ? 1 : 0) + 
    (sortBy !== "popularity" ? 1 : 0);

  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-muted cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter Techniques</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5">{activeFilterCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 p-4 bg-background/50 rounded-lg border border-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search techniques..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tag</label>
              <Select value={selectedTag} onValueChange={onTagChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {tags.slice(0, 20).map((tag) => (
                    <SelectItem key={tag.id} value={tag.slug}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeFilter;