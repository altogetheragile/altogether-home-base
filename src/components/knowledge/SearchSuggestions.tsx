import { Search, Tag, FolderOpen, FileText } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  name: string;
  slug: string;
  type: 'technique' | 'category' | 'tag';
  usage_count?: number;
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  searchTerm: string;
}

export const SearchSuggestions = ({ suggestions, onSelect, searchTerm }: SearchSuggestionsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'technique': return FileText;
      case 'category': return FolderOpen;
      case 'tag': return Tag;
      default: return Search;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'technique': return 'Technique';
      case 'category': return 'Category';
      case 'tag': return 'Tag';
      default: return 'Result';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg">
      <Command>
        <CommandList>
          <CommandEmpty>No suggestions found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion, index) => {
              const Icon = getIcon(suggestion.type);
              return (
                <CommandItem
                  key={`${suggestion.type}-${suggestion.slug}-${index}`}
                  value={suggestion.name}
                  onSelect={() => onSelect(suggestion)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{suggestion.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(suggestion.type)}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
};