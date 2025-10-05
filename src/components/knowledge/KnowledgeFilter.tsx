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
    <div className="flex flex-col lg:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1 lg:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search techniques..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full lg:w-[180px] h-9">
          <SelectValue placeholder="Category" />
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

      {/* Domain Filter */}
      <Select value={selectedDomain} onValueChange={onDomainChange}>
        <SelectTrigger className="w-full lg:w-[180px] h-9">
          <SelectValue placeholder="Domain" />
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

      {/* Planning Focus Filter */}
      <Select value={selectedFocus} onValueChange={onFocusChange}>
        <SelectTrigger className="w-full lg:w-[180px] h-9">
          <SelectValue placeholder="Focus" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Focuses</SelectItem>
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

      {/* Sort Filter */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full lg:w-[140px] h-9">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recent</SelectItem>
          <SelectItem value="alphabetical">A-Z</SelectItem>
          <SelectItem value="popularity">Popular</SelectItem>
          <SelectItem value="views">Most Viewed</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          onClick={clearFilters}
          size="sm"
          className="shrink-0 h-9"
        >
          <X className="h-4 w-4 lg:mr-1" />
          <span className="hidden lg:inline">Clear</span>
        </Button>
      )}
    </div>
  );
};

export default KnowledgeFilter;