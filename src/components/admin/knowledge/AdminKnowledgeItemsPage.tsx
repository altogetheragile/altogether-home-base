import { useState } from 'react';
import { Plus, Search, X, LayoutGrid, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { KnowledgeItemsTable } from './KnowledgeItemsTable';
import { KnowledgeItemsCards } from './KnowledgeItemsCards';
import { KnowledgeItemsFilters } from './KnowledgeItemsFilters';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { KnowledgeItemEditorPage } from './KnowledgeItemEditorPage';
import type { KnowledgeItemsFiltersType } from './KnowledgeItemsDashboard';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useNavigate } from 'react-router-dom';

export const AdminKnowledgeItemsPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<KnowledgeItemsFiltersType>({
    search: '',
    categories: [],
    planningLayers: [],
    domains: [],
    status: 'all',
    hasUseCases: 'all',
    dateRange: {},
    sortBy: 'recent'
  });

  const handleEdit = (item: KnowledgeItem) => {
    navigate(`/admin/knowledge-items/${item.id}/edit`);
  };

  const handleBulkAction = (action: string, itemIds: string[]) => {
    console.log('Bulk action:', action, itemIds || selectedItems);
    // TODO: Implement bulk actions
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
              <p className="text-sm text-muted-foreground">Manage your knowledge items</p>
            </div>
            <Button onClick={() => navigate('/admin/knowledge-items/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge items..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, search: '' })}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <Select 
              value={filters.status} 
              onValueChange={(value: any) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select 
              value={filters.sortBy} 
              onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Updated</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>

            {/* View Switcher */}
            <Tabs value={view} onValueChange={(v: any) => setView(v)}>
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-1.5">
                  <Table2 className="h-3.5 w-3.5" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="cards" className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Cards
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Advanced Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Filters
                  {(filters.categories.length > 0 || 
                    filters.planningLayers.length > 0 || 
                    filters.domains.length > 0) && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {filters.categories.length + filters.planningLayers.length + filters.domains.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Knowledge Items</SheetTitle>
                </SheetHeader>
                <KnowledgeItemsFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Bulk Operations */}
        {selectedItems.length > 0 && (
          <div className="px-6 pb-4">
            <BulkOperationsPanel
              selectedCount={selectedItems.length}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedItems([])}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {view === 'table' ? (
          <KnowledgeItemsTable
            filters={filters}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
          />
        ) : (
          <KnowledgeItemsCards
            filters={filters}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};
