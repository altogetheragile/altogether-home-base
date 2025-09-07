import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { usePlanningFocuses } from "@/hooks/usePlanningFocuses";
import { useActivityDomains } from "@/hooks/useActivityDomains";

interface KnowledgeFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedDomain: string;
  onDomainChange: (value: string) => void;
  selectedFocus: string;
  onFocusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const KnowledgeFilter = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDomain,
  onDomainChange,
  selectedFocus,
  onFocusChange,
  sortBy,
  onSortChange,
}: KnowledgeFilterProps) => {
  const { data: categories } = useKnowledgeCategories();
  const { data: domains } = useActivityDomains();
  const { data: focuses } = usePlanningFocuses();

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onDomainChange("all");
    onFocusChange("all");
    onSortChange("recent");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || 
                          selectedDomain !== "all" || selectedFocus !== "all" || 
                          sortBy !== "recent";

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Domain Filter */}
        <div className="flex-1">
          <Select value={selectedDomain} onValueChange={onDomainChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    {domain.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Planning Focus Filter */}
        <div className="flex-1">
          <Select value={selectedFocus} onValueChange={onFocusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Planning Focuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Planning Focuses</SelectItem>
              {focuses?.map((focus) => (
                <SelectItem key={focus.id} value={focus.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: focus.color }}
                    />
                    {focus.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="flex-1">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button onClick={() => onSearchChange("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories?.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedDomain !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Domain: {domains?.find(d => d.id === selectedDomain)?.name}
              <button onClick={() => onDomainChange("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedFocus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Focus: {focuses?.find(f => f.id === selectedFocus)?.name}
              <button onClick={() => onFocusChange("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {sortBy !== "recent" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sortBy === "alphabetical" ? "A-Z" : sortBy === "popularity" ? "Popular" : "Most Viewed"}
              <button onClick={() => onSortChange("recent")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeFilter;