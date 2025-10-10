import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKnowledgeItems } from '@/hooks/useKnowledgeItems';
import { Search, Plus, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { inferIconForItem } from '@/utils/inferIconForItem';

interface KnowledgeItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itemId: string, itemData: any) => void;
  existingItemIds: string[];
}

export const KnowledgeItemSelector: React.FC<KnowledgeItemSelectorProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingItemIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState('all');

  const { data: items, isLoading } = useKnowledgeItems();

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter(item => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.knowledge_categories?.name !== categoryFilter) {
        return false;
      }

      // Domain filter
      if (domainFilter !== 'all' && item.activity_domains?.name !== domainFilter) {
        return false;
      }

      // Focus filter
      if (focusFilter !== 'all' && item.planning_focuses?.name !== focusFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, categoryFilter, domainFilter, focusFilter]);

  const categories = useMemo(() => {
    if (!items) return [];
    const unique = new Set(items.map(item => item.knowledge_categories?.name).filter(Boolean));
    return Array.from(unique);
  }, [items]);

  const domains = useMemo(() => {
    if (!items) return [];
    const unique = new Set(items.map(item => item.activity_domains?.name).filter(Boolean));
    return Array.from(unique);
  }, [items]);

  const focuses = useMemo(() => {
    if (!items) return [];
    const unique = new Set(items.map(item => item.planning_focuses?.name).filter(Boolean));
    return Array.from(unique);
  }, [items]);

  const handleAdd = (item: any) => {
    const icon = inferIconForItem(item.name, item.knowledge_categories?.name);
    
    onAdd(item.id, {
      name: item.name,
      slug: item.slug,
      description: item.description,
      activity_domains: item.activity_domains,
      planning_focuses: item.planning_focuses,
      knowledge_categories: item.knowledge_categories,
      icon,
      emoji: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Knowledge Technique</DialogTitle>
          <DialogDescription>
            Select techniques from the knowledge base to add to your canvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search techniques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map(domain => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={focusFilter} onValueChange={setFocusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Focuses</SelectItem>
                {focuses.map(focus => (
                  <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Grid */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No techniques found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const isAdded = existingItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1">
                            {item.name}
                          </h4>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "default"}
                            onClick={() => !isAdded && handleAdd(item)}
                            disabled={isAdded}
                            className="shrink-0"
                          >
                            {isAdded ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.activity_domains && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: item.activity_domains.color,
                                color: item.activity_domains.color,
                              }}
                            >
                              {item.activity_domains.name}
                            </Badge>
                          )}
                          {item.planning_focuses && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: item.planning_focuses.color,
                                color: item.planning_focuses.color,
                              }}
                            >
                              {item.planning_focuses.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
