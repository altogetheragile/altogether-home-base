import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useActivityDomains } from "@/hooks/useActivityDomains";
import { usePlanningFocuses } from "@/hooks/usePlanningFocuses";
import { useVisibleClassifications } from "@/hooks/useClassificationConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const visibility = useVisibleClassifications();

  const clearFilters = () => {
    onSearchChange("");
    if (visibility.categories) onCategoryChange("all");
    if (visibility.activityDomains) onDomainChange("all");
    if (visibility.planningFocuses) onFocusChange("all");
    onSortChange("recent");
  };

  const hasActiveFilters = searchQuery || 
    (visibility.categories && selectedCategory !== "all") || 
    (visibility.activityDomains && selectedDomain !== "all") || 
    (visibility.planningFocuses && selectedFocus !== "all");

  return (
    <div className="space-y-3 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Category Pills */}
      {visibility.categories && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange("all")}
            className="rounded-full"
          >
            All
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="rounded-full"
              style={
                selectedCategory === category.id
                  ? {
                      backgroundColor: category.color,
                      borderColor: category.color,
                      color: "white",
                    }
                  : {
                      borderColor: `${category.color}50`,
                      color: category.color,
                    }
              }
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Secondary Filters Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {visibility.activityDomains && (
          <Select value={selectedDomain} onValueChange={onDomainChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={visibility.getLabel('activity-domains')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {visibility.getLabel('activity-domains')}</SelectItem>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {visibility.planningFocuses && (
          <Select value={selectedFocus} onValueChange={onFocusChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={visibility.getLabel('planning-focuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {visibility.getLabel('planning-focuses')}</SelectItem>
              {focuses?.map((focus) => (
                <SelectItem key={focus.id} value={focus.id}>
                  {focus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeFilter;