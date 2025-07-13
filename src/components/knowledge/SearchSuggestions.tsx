import { Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchSuggestions, usePopularSearches } from "@/hooks/useSearchAnalytics";

interface SearchSuggestionsProps {
  searchTerm: string;
  onSuggestionClick: (suggestion: string) => void;
}

export const SearchSuggestions = ({ searchTerm, onSuggestionClick }: SearchSuggestionsProps) => {
  const { data: suggestions = [] } = useSearchSuggestions(searchTerm);
  const { data: popularSearches = [] } = usePopularSearches();

  if (!searchTerm && popularSearches.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg">
      {searchTerm && suggestions.length > 0 && (
        <div className="border-b border-border p-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Suggestions
          </h4>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => onSuggestionClick(suggestion.name)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{suggestion.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {suggestion.type}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {!searchTerm && popularSearches.length > 0 && (
        <div className="p-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Searches
          </h4>
          <div className="space-y-1">
            {popularSearches.map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-2"
                onClick={() => onSuggestionClick(search.query)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{search.query}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {search.count}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};