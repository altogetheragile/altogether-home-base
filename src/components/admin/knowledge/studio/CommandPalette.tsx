import { useState, useEffect } from 'react';
import { 
  Search, Plus, FileText, Eye, Settings, Archive, 
  Trash2, Copy, Share, Filter, BarChart3, Command
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ContentFilters } from '../ContentStudioDashboard';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: () => void;
  onFiltersChange: (filters: Partial<ContentFilters>) => void;
}

export const CommandPalette = ({
  open,
  onOpenChange,
  onCreateNew,
  onFiltersChange
}: CommandPaletteProps) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const quickActions = [
    {
      id: 'create',
      title: 'Create New Content',
      description: 'Add a new knowledge item',
      icon: Plus,
      shortcut: 'Ctrl+N',
      action: () => {
        onCreateNew();
        onOpenChange(false);
      }
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Open content performance dashboard',
      icon: BarChart3,
      shortcut: 'Ctrl+A',
      action: () => {
        onFiltersChange({ view: 'analytics' });
        onOpenChange(false);
      }
    },
    {
      id: 'search-drafts',
      title: 'Show My Drafts',
      description: 'Filter to show draft content only',
      icon: FileText,
      action: () => {
        onFiltersChange({ workflow: 'drafts' });
        onOpenChange(false);
      }
    },
    {
      id: 'search-published',
      title: 'Show Published Content',
      description: 'Filter to show published content only',
      icon: Eye,
      action: () => {
        onFiltersChange({ workflow: 'published' });
        onOpenChange(false);
      }
    }
  ];

  const viewSwitchers = [
    {
      id: 'cards',
      title: 'Switch to Cards View',
      icon: FileText,
      action: () => {
        onFiltersChange({ view: 'cards' });
        onOpenChange(false);
      }
    },
    {
      id: 'table',
      title: 'Switch to Table View',
      icon: FileText,
      action: () => {
        onFiltersChange({ view: 'table' });
        onOpenChange(false);
      }
    },
    {
      id: 'kanban',
      title: 'Switch to Kanban View',
      icon: FileText,
      action: () => {
        onFiltersChange({ view: 'kanban' });
        onOpenChange(false);
      }
    }
  ];

  const workflows = [
    {
      id: 'all',
      title: 'Show All Items',
      description: 'View all content items',
      count: 156
    },
    {
      id: 'high-performing',
      title: 'High Performing Content',
      description: 'Items with high engagement',
      count: 23
    },
    {
      id: 'needs-attention',
      title: 'Needs Attention',
      description: 'Content that needs updates',
      count: 8
    },
    {
      id: 'archived',
      title: 'Archived Items',
      description: 'Previously archived content',
      count: 19
    }
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem 
              key={action.id}
              onSelect={action.action}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
              {action.shortcut && (
                <Badge variant="secondary" className="text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Views">
          {viewSwitchers.map((view) => (
            <CommandItem 
              key={view.id}
              onSelect={view.action}
            >
              <view.icon className="h-4 w-4 mr-2" />
              {view.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Workflows">
          {workflows.map((workflow) => (
            <CommandItem 
              key={workflow.id}
              onSelect={() => {
                onFiltersChange({ workflow: workflow.id as any });
                onOpenChange(false);
              }}
              className="flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{workflow.title}</p>
                <p className="text-xs text-muted-foreground">{workflow.description}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {workflow.count}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Settings">
          <CommandItem>
            <Settings className="h-4 w-4 mr-2" />
            Content Settings
          </CommandItem>
          <CommandItem>
            <Filter className="h-4 w-4 mr-2" />
            Manage Categories
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};