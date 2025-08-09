import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { useBlogTags } from '@/hooks/useBlogTags';

interface BlogAdvancedSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange: (value: string) => void;
  selectedTag?: string;
  onTagChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  resultsCount: number;
}

export const BlogAdvancedSearch: React.FC<BlogAdvancedSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  resultsCount,
}) => {
  const { data: categories } = useBlogCategories();
  const { data: popularTags } = useBlogTags(10);

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onTagChange('all');
    onSortChange('newest');
  };

  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'all') || (selectedTag && selectedTag !== 'all');

  return (
    <div className="border-b pb-4 mb-6">
      {/* Inline Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Compact Filters */}
        <div className="flex gap-2 items-center">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories?.map((category) => (
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

          <Select value={selectedTag} onValueChange={onTagChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {popularTags?.map((tag) => (
                <SelectItem key={tag.id} value={tag.slug}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="popularity">Popular</SelectItem>
              <SelectItem value="title">A-Z</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {hasActiveFilters ? `${resultsCount} posts found` : `${resultsCount} total posts`}
      </div>
    </div>
  );
};