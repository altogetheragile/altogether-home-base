import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSearchSuggestions, useLogSearch } from '@/hooks/useSearchAnalytics';
import { useDebounce } from '@/hooks/useDebounce';

interface SmartSearchInputProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  resultsCount?: number;
  placeholder?: string;
  showAISuggestions?: boolean;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  resultsCount = 0,
  placeholder = "Search with AI suggestions...",
  showAISuggestions = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSearchSuggestions(
    debouncedQuery, 
    showAISuggestions && debouncedQuery.length >= 2
  );
  
  const logSearch = useLogSearch();

  useEffect(() => {
    setIsOpen(false); // Never auto-open the dropdown
    setSelectedIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (query?: string) => {
    const finalQuery = query || searchQuery;
    if (finalQuery.trim()) {
      logSearch.mutate({
        query: finalQuery,
        results_count: resultsCount,
      });
      onSearchChange(finalQuery);
      onSearch();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (totalItems + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? totalItems : prev - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === -1) {
        handleSubmit();
      } else if (selectedIndex < suggestions.length) {
        const suggestion = suggestions[selectedIndex];
        handleSubmit(suggestion.name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSubmit(text);
  };

  const renderSuggestionIcon = (type: string) => {
    switch (type) {
      case 'technique':
        return <Sparkles className="h-4 w-4 text-primary" />;
      case 'category':
        return <Zap className="h-4 w-4 text-secondary" />;
      case 'tag':
        return <Badge className="h-4 w-4 text-accent" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const showDropdown = isOpen && searchQuery.length >= 2 && suggestions.length > 0;

  return (
    <div className="relative w-full max-w-2xl" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-12 h-12 text-base border-2 focus:border-primary transition-all duration-200"
        />
        <Button
          onClick={() => handleSubmit()}
          size="sm"
          className="absolute right-1 top-1 h-10 px-3 bg-primary hover:bg-primary/90"
          disabled={!searchQuery.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg border-2">
          <CardContent className="p-0">
            {searchQuery.length >= 2 && suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.slug}`}
                    onClick={() => handleSuggestionClick(suggestion.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-md transition-colors ${
                      selectedIndex === index ? 'bg-accent' : ''
                    }`}
                  >
                    {renderSuggestionIcon(suggestion.type)}
                    <span className="font-medium">{suggestion.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            
            {suggestionsLoading && searchQuery.length >= 2 && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Finding suggestions...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};