import { useState } from 'react';
import { CalendarIcon, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { KnowledgeItemsFiltersType } from './KnowledgeItemsDashboard';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useDecisionLevels } from '@/hooks/useDecisionLevels';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useVisibleClassifications } from '@/hooks/useClassificationConfig';
import { format } from 'date-fns';

interface KnowledgeItemsFiltersProps {
  filters: KnowledgeItemsFiltersType;
  onFiltersChange: (filters: KnowledgeItemsFiltersType) => void;
}

export const KnowledgeItemsFilters = ({ 
  filters, 
  onFiltersChange 
}: KnowledgeItemsFiltersProps) => {
  const { data: categories } = useKnowledgeCategories();
  const { data: decisionLevels } = useDecisionLevels();
  const { data: domains } = useActivityDomains();
  const visibility = useVisibleClassifications();

  const updateFilters = (updates: Partial<KnowledgeItemsFiltersType>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      planningLayers: [],
      domains: [],
      status: 'all',
      hasUseCases: 'all',
      dateRange: {},
      sortBy: 'recent'
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilters({ categories: newCategories });
  };

  const toggleDecisionLevel = (levelId: string) => {
    const newLayers = filters.planningLayers.includes(levelId)
      ? filters.planningLayers.filter(id => id !== levelId)
      : [...filters.planningLayers, levelId];
    updateFilters({ planningLayers: newLayers });
  };

  const toggleDomain = (domainId: string) => {
    const newDomains = filters.domains.includes(domainId)
      ? filters.domains.filter(id => id !== domainId)
      : [...filters.domains, domainId];
    updateFilters({ domains: newDomains });
  };

  return (
    <div className="space-y-6 py-4">
      {/* Clear all button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Active Filters</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAllFilters}
          className="h-8 px-2"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => updateFilters({ sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Updated</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Publication Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value: any) => updateFilters({ status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published Only</SelectItem>
            <SelectItem value="draft">Draft Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Use Cases Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Use Cases</Label>
        <Select
          value={filters.hasUseCases}
          onValueChange={(value: any) => updateFilters({ hasUseCases: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="yes">Has Use Cases</SelectItem>
            <SelectItem value="no">Missing Use Cases</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      {visibility.categories && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{visibility.getLabel('categories')}</Label>
            {filters.categories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ categories: [] })}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.categories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Selected categories */}
          {filters.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {filters.categories.map((categoryId) => {
                const category = categories?.find(c => c.id === categoryId);
                if (!category) return null;
                return (
                  <Badge key={categoryId} variant="secondary" className="text-xs">
                    {category.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(categoryId)}
                      className="h-auto p-0 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}

      {visibility.categories && <Separator />}

      {/* Decision Levels (was Planning Layers) */}
      {visibility.decisionLevels && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{visibility.getLabel('decision-levels')}</Label>
            {filters.planningLayers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ planningLayers: [] })}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {decisionLevels?.map((level) => (
              <div key={level.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`level-${level.id}`}
                  checked={filters.planningLayers.includes(level.id)}
                  onCheckedChange={() => toggleDecisionLevel(level.id)}
                />
                <label
                  htmlFor={`level-${level.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    {level.name}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibility.decisionLevels && <Separator />}

      {/* Domains */}
      {visibility.activityDomains && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{visibility.getLabel('activity-domains')}</Label>
            {filters.domains.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ domains: [] })}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {domains?.map((domain) => (
              <div key={domain.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`domain-${domain.id}`}
                  checked={filters.domains.includes(domain.id)}
                  onCheckedChange={() => toggleDomain(domain.id)}
                />
                <label
                  htmlFor={`domain-${domain.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    {domain.name}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibility.activityDomains && <Separator />}

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Last Updated</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.from}
                onSelect={(date) => 
                  updateFilters({ 
                    dateRange: { ...filters.dateRange, from: date } 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.to}
                onSelect={(date) => 
                  updateFilters({ 
                    dateRange: { ...filters.dateRange, to: date } 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {(filters.dateRange.from || filters.dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFilters({ dateRange: {} })}
            className="h-8 px-2 text-xs w-full"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Date Range
          </Button>
        )}
      </div>
    </div>
  );
};
