import { 
  Search, X, Filter, Grid, Table2, Kanban, BarChart3,
  Download, Archive, Trash2, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ContentFilters } from '../ContentStudioDashboard';

interface ContentStudioHeaderProps {
  filters: ContentFilters;
  onFiltersChange: (filters: Partial<ContentFilters>) => void;
  selectedItems: string[];
  onClearSelection: () => void;
}

export const ContentStudioHeader = ({
  filters,
  onFiltersChange,
  selectedItems,
  onClearSelection
}: ContentStudioHeaderProps) => {
  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, selectedItems);
    onClearSelection();
  };

  return (
    <div className="border-b bg-background">
      <div className="px-6 py-4 space-y-4">
        {/* Search and View Controls */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 pr-10"
              data-testid="search-input"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ search: '' })}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sort */}
          <Select 
            value={filters.sortBy} 
            onValueChange={(value: any) => onFiltersChange({ sortBy: value })}
          >
            <SelectTrigger className="w-40" data-testid="sort-dropdown">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="planning_focus">Planning Focus</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="engagement">High Engagement</SelectItem>
            </SelectContent>
          </Select>

          {/* View Switcher */}
          <Tabs 
            value={filters.view} 
            onValueChange={(value: any) => onFiltersChange({ view: value })}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="cards" className="flex items-center gap-1.5" data-testid="view-cards">
                <Grid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-1.5" data-testid="view-table">
                <Table2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-1.5" data-testid="view-kanban">
                <Kanban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5" data-testid="view-analytics">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Advanced Filters */}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {selectedItems.length} selected
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearSelection}
                className="h-auto p-1"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('publish')}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Publish
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('unpublish')}
              >
                <EyeOff className="h-4 w-4 mr-1.5" />
                Unpublish
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.workflow !== 'all' || filters.search) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.workflow !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Workflow: {filters.workflow}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-auto p-0.5 hover:bg-transparent"
                  onClick={() => onFiltersChange({ workflow: 'all' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto w-auto p-0.5 hover:bg-transparent"
                  onClick={() => onFiltersChange({ search: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};