import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSearchInput } from "@/components/search/SmartSearchInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useKnowledgeTags } from "@/hooks/useKnowledgeTags";

interface AdvancedSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange: (value?: string) => void;
  selectedTag?: string;
  onTagChange: (value?: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  resultsCount: number;
}

export const AdvancedSearch = ({ 
  searchQuery, 
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  resultsCount
}: AdvancedSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories = [] } = useKnowledgeCategories();
  const { data: tags = [] } = useKnowledgeTags();

  const handleClearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onTagChange("all");
    onSortChange("popularity");
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) +
    (selectedCategory ? 1 : 0) + 
    (selectedTag ? 1 : 0) + 
    (sortBy !== "popularity" ? 1 : 0);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Search
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} filters
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? "Hide" : "Show"}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Smart Search</label>
              <SmartSearchInput
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onSearch={() => {}}
                resultsCount={resultsCount}
                placeholder="Search techniques with AI suggestions..."
                showAISuggestions={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tag</label>
                <Select value={selectedTag} onValueChange={onTagChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any tag</SelectItem>
                    {tags.slice(0, 20).map((tag) => (
                      <SelectItem key={tag.id} value={tag.slug}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
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

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {resultsCount} {resultsCount === 1 ? 'result' : 'results'} found
              </div>
              
              <Button variant="outline" onClick={handleClearFilters} size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};