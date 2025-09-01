import { useState } from 'react';
import { Plus, Grid, Table2, Kanban, Filter, Download, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { KnowledgeItemsTable } from './KnowledgeItemsTable';
import { KnowledgeItemsCards } from './KnowledgeItemsCards';
import { KnowledgeItemsBoard } from './KnowledgeItemsBoard';
import { KnowledgeItemsFilters } from './KnowledgeItemsFilters';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { KnowledgeItemEditor } from './KnowledgeItemEditor';

export interface KnowledgeItemsFiltersType {
  search: string;
  categories: string[];
  planningLayers: string[];
  domains: string[];
  status: 'all' | 'published' | 'draft';
  hasUseCases: 'all' | 'yes' | 'no';
  dateRange: { from?: Date; to?: Date };
  sortBy: 'recent' | 'alphabetical' | 'popularity' | 'views';
}

export const KnowledgeItemsDashboard = () => {
  const [activeView, setActiveView] = useState<'table' | 'cards' | 'board'>('table');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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

  const handleCreateNew = () => {
    setEditingItem(null);
    setShowEditor(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowEditor(true);
  };

  const handleBulkAction = (action: string, itemIds: string[]) => {
    console.log('Bulk action:', action, itemIds);
    // Handle bulk operations
  };

  const handleExport = () => {
    console.log('Export selected items:', selectedItems);
  };

  const activeFiltersCount = [
    ...filters.categories,
    ...filters.planningLayers,
    ...filters.domains,
    filters.status !== 'all' ? 1 : 0,
    filters.hasUseCases !== 'all' ? 1 : 0,
    filters.search ? 1 : 0,
    filters.dateRange.from || filters.dateRange.to ? 1 : 0
  ].filter(Boolean).length;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage your knowledge items, organize content, and track performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={selectedItems.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedItems.length})
          </Button>
          <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Item
          </Button>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge items..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-10 bg-background"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Knowledge Items</SheetTitle>
              </SheetHeader>
              <KnowledgeItemsFilters filters={filters} onFiltersChange={setFilters} />
            </SheetContent>
          </Sheet>

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Bulk Operations */}
      {selectedItems.length > 0 && (
        <BulkOperationsPanel
          selectedCount={selectedItems.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedItems([])}
        />
      )}

      {/* Content Views */}
      <div className="min-h-[600px]">
        <Tabs value={activeView} className="w-full">
          <TabsContent value="table" className="mt-0">
            <KnowledgeItemsTable
              filters={filters}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onEdit={handleEdit}
            />
          </TabsContent>
          
          <TabsContent value="cards" className="mt-0">
            <KnowledgeItemsCards
              filters={filters}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onEdit={handleEdit}
            />
          </TabsContent>
          
          <TabsContent value="board" className="mt-0">
            <KnowledgeItemsBoard
              filters={filters}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onEdit={handleEdit}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Editor Dialog */}
      <KnowledgeItemEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        editingItem={editingItem}
        onSuccess={() => {
          setShowEditor(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
};