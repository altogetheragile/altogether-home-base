import { useState, useRef, useEffect } from "react";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSuggestions } from "./SearchSuggestions";
import { useSearchSuggestions, useLogSearch, usePopularSearches } from "@/hooks/useSearchAnalytics";
import { useKnowledgeCategories } from "@/hooks/useKnowledgeCategories";
import { useDebounce } from "@/hooks/useDebounce";

interface AdvancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange: (category: string | undefined) => void;
  selectedTag?: string;
  onTagChange: (tag: string | undefined) => void;
  sortBy?: string;
  onSortChange: (sort: string) => void;
  resultsCount?: number;
}

export const AdvancedSearch = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy = "popularity",
  onSortChange,
  resultsCount = 0,
}: AdvancedSearchProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(inputValue, 300);
  const { data: suggestions = [] } = useSearchSuggestions(debouncedSearch, showSuggestions);
  const { data: popularSearches = [] } = usePopularSearches();
  const { data: categories = [] } = useKnowledgeCategories();
  const logSearch = useLogSearch();

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch);
      
      // Log search analytics
      if (debouncedSearch.length >= 2) {
        logSearch.mutate({
          query: debouncedSearch,
          results_count: resultsCount,
          search_filters: {
            category: selectedCategory,
            tag: selectedTag,
            sort: sortBy,
          },
        });
      }
    }
  }, [debouncedSearch, onSearchChange, searchQuery, resultsCount, selectedCategory, selectedTag, sortBy, logSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'technique') {
      setInputValue(suggestion.name);
      onSearchChange(suggestion.name);
    } else if (suggestion.type === 'category') {
      onCategoryChange(suggestion.id);
      setInputValue("");
      onSearchChange("");
    } else if (suggestion.type === 'tag') {
      onTagChange(suggestion.slug);
      setInputValue("");
      onSearchChange("");
    }
    setShowSuggestions(false);
  };

  const handlePopularSearchClick = (query: string) => {
    setInputValue(query);
    onSearchChange(query);
    setShowSuggestions(false);
  };

  const clearAll = () => {
    setInputValue("");
    onSearchChange("");
    onCategoryChange(undefined);
    onTagChange(undefined);
    onSortChange("popularity");
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTag || sortBy !== "popularity";

  return (
    <div className="space-y-4">
      {/* Main Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search techniques, methods, or concepts..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-12 h-12 text-lg"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInputValue("");
                onSearchChange("");
              }}
              className="absolute right-2 top-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (inputValue.length >= 2 ? suggestions.length > 0 : popularSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg">
            {inputValue.length >= 2 ? (
              <SearchSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                searchTerm={inputValue}
              />
            ) : (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Popular Searches
                </div>
                <div className="space-y-1">
                  {popularSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handlePopularSearchClick(search.query)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-sm transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span>{search.query}</span>
                        <Badge variant="outline" className="text-xs">
                          {search.count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category Filter */}
        <Select value={selectedCategory || "all"} onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
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

        {/* Sort Options */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular
              </div>
            </SelectItem>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </div>
            </SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <X className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-2">
              Search: "{searchQuery}"
              <button onClick={() => {
                setInputValue("");
                onSearchChange("");
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-2">
              Category: {categories.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange(undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTag && (
            <Badge variant="secondary" className="gap-2">
              Tag: {selectedTag}
              <button onClick={() => onTagChange(undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};