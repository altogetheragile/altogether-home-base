import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KnowledgeItemsTable } from './KnowledgeItemsTable';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import type { KnowledgeItemsFiltersType } from './KnowledgeItemsDashboard';
import type { KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';

export const AdminKnowledgeItemsPage = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { data: categories } = useKnowledgeCategories();
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
    navigate(`/admin/knowledge/items/${item.id}/edit`);
  };

  const handleBulkAction = (action: string, itemIds: string[]) => {
    console.log('Bulk action:', action, itemIds || selectedItems);
    // TODO: Implement bulk actions
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-foreground">Knowledge Items</h1>
            
            {/* Inline Controls */}
            <div className="flex items-center gap-2 flex-1 max-w-3xl">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8 h-7 text-sm"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, search: '' })}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <Select 
                value={filters.categories.length > 0 ? filters.categories[0] : 'all'} 
                onValueChange={(value: any) => setFilters({ ...filters, categories: value === 'all' ? [] : [value] })}
              >
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select 
                value={filters.status} 
                onValueChange={(value: any) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[90px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => navigate('/admin/knowledge/items/new')} size="sm" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New
            </Button>
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
      <div className="px-4 py-2">
        <KnowledgeItemsTable
          filters={filters}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
};
