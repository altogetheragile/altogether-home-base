import React, { useState } from 'react';
import { X, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface KnowledgeItem {
  id: string;
  name: string;
  is_published: boolean;
}

interface KnowledgeItemSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export const KnowledgeItemSelector = ({
  selectedIds,
  onToggle,
  onRemove,
}: KnowledgeItemSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: knowledgeItems = [] } = useQuery<KnowledgeItem[]>({
    queryKey: ['knowledge-items-for-template-upload', search],
    queryFn: async () => {
      let q = supabase
        .from('knowledge_items')
        .select('id, name, is_published')
        .order('name', { ascending: true })
        .limit(5000);

      if (search && search.length >= 2) {
        q = q.or(`name.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) {
        throw error;
      }

      return (data as KnowledgeItem[]) || [];
    },
  });

  const handleClearAll = () => {
    selectedIds.forEach((id) => onRemove(id));
  };

  return (
    <div className="space-y-3">
      <Label>Knowledge Items * ({selectedIds.length} selected)</Label>

      {/* Selected Items Display */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
          {selectedIds.map((id) => {
            const item = knowledgeItems.find((ki) => ki.id === id);
            return (
              <Badge key={id} variant="secondary" className="flex items-center gap-1">
                {item?.name || 'Unknown'}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => onRemove(id)}
                />
              </Badge>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear All
          </Button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length === 0
              ? 'Select knowledge items to link template to'
              : `${selectedIds.length} knowledge item${selectedIds.length === 1 ? '' : 's'} selected`}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[70] w-[var(--radix-popover-trigger-width)] p-0 bg-popover border shadow-lg max-h-[60vh] overflow-visible pointer-events-auto"
          side="bottom"
          align="start"
        >
          <Command className="max-h-[50vh]">
            <CommandInput
              placeholder="Search knowledge items..."
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <CommandList className="max-h-[40vh] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              <CommandEmpty>No knowledge item found.</CommandEmpty>
              <CommandGroup>
                {knowledgeItems
                  ?.filter((item) =>
                    item.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  ?.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => {
                          onToggle(item.id);
                          // Don't close dropdown for multi-select
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="flex-1">{item.name}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
