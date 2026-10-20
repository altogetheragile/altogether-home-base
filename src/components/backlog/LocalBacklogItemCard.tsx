import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  GripVertical, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Plus,
  Scissors,
  ChevronRight,
} from 'lucide-react';
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { cn } from '@/lib/utils';
import { StoryTypeBadge } from './StoryTypeSelector';
import { canHaveChildren, getChildItemTypes } from '@/types/story';
import { useActiveScheme } from './SchemeContext';
import type { PrioritisationScheme } from '@/config/prioritisationSchemes';

interface LocalBacklogItemCardProps {
  item: LocalBacklogItem;
  index: number;
  onUpdate: (updates: Partial<LocalBacklogItem>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
  isEditable?: boolean;
  childrenCount?: number;
  onAddChild?: () => void;
  onSplitByCriteria?: () => void;
  indentLevel?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// The card follows the zoo game's PbiCard (docs/ZOO_PO_ROUTE.md, One Item, One Look): it shows
// where the item is in its journey, "?" until it is sized, and its priority in this backlog's
// own scheme.

/** Priority as this backlog's scheme says it. An item stored under another scheme ('medium'
 *  under MoSCoW) is shown at the same rank in this one, never in a word from the other. */
const priorityBadge = (scheme: PrioritisationScheme, item: LocalBacklogItem) => {
  // The order is the priority: the card's place says it, a badge would say it twice
  if (scheme.type === 'order') return null;
  if (scheme.type === 'scored') {
    const score = scheme.score?.(item.priority_data || {}) ?? null;
    return score === null
      ? { label: `${scheme.name} ?`, color: 'bg-amber-100 text-amber-900', title: `Not scored for ${scheme.name} yet` }
      : { label: `${scheme.name} ${score.toFixed(1)}`, color: 'bg-muted text-foreground', title: `${scheme.name} score` };
  }
  const options = scheme.options ?? [];
  const option = options.find((o) => o.value === (item.priority || '').toLowerCase())
    ?? options[Math.min(scheme.rank(item), options.length) - 1];
  return option ? { label: option.label, color: option.color, title: scheme.name } : null;
};

/** Where the item is in its journey, drawn the way the zoo draws it: plain while it waits, the
 *  accent while it is in hand, green on white when Done, and a green edge once it is Ready. */
const journeyShell: Record<string, string> = {
  ready: 'border-l-4 border-l-emerald-500',
  in_progress: 'border-primary bg-primary/5',
  done: 'border-emerald-300/80',
};

const statusColors: Record<string, string> = {
  idea: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  refined: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  ready: 'bg-green-500/20 text-green-700 dark:text-green-300',
  in_progress: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  done: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
};

const sourceLabels: Record<string, string> = {
  user_feedback: 'User Feedback',
  development: 'Development',
  bug_fix: 'Bug Fix',
  enhancement: 'Enhancement',
  ai_suggestion: 'AI Suggestion',
};

export const LocalBacklogItemCard: React.FC<LocalBacklogItemCardProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  isDragging,
  isEditable = true,
  childrenCount = 0,
  onAddChild,
  onSplitByCriteria,
  indentLevel = 0,
  isExpanded,
  onToggleExpand,
}) => {
  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  const canAddChildren = canHaveChildren(item.item_type);
  const childTypes = getChildItemTypes(item.item_type);
  const canSplit = (item.acceptance_criteria?.length || 0) >= 2;
  const priority = priorityBadge(useActiveScheme(), item);

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        journeyShell[item.status],
        isDragging && "shadow-lg ring-2 ring-primary",
        indentLevel > 0 && "ml-6 border-l-2 border-l-primary/30"
      )}
      onDoubleClick={onEdit}
      style={{ marginLeft: indentLevel * 24 }}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {isEditable && (
            <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          
          {/* Expand/collapse for items with children */}
          {childrenCount > 0 && onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">
                    #{index + 1}
                  </span>
                  <StoryTypeBadge type={item.item_type} />
                  {priority && (
                    <Badge variant="secondary" className={cn("text-xs", priority.color)} title={priority.title}>
                      {priority.label}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", statusColors[item.status])}
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                  {item.estimated_effort != null ? (
                    <Badge variant="secondary" className="text-xs" title="Size, in points">
                      {item.estimated_effort} pts
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-900" title="Not sized yet - the Developers size it in refinement">
                      ?
                    </Badge>
                  )}
                  {item.target_release && (
                    <Badge variant="outline" className="text-xs">
                      {item.target_release}
                    </Badge>
                  )}
                  {childrenCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {childrenCount} children
                    </Badge>
                  )}
                  {item.source && (
                    <Badge variant="outline" className="text-xs max-w-[220px] truncate" title={item.source}>
                      {sourceLabels[item.source] || item.source}
                    </Badge>
                  )}
                </div>
                
                <h4 className="font-medium text-sm">{item.title}</h4>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      {item.acceptance_criteria.length} acceptance criteria
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {item.estimated_value != null && (
                    <span>Value: {item.estimated_value}</span>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <span className="flex gap-1 flex-wrap">
                      {item.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              
              {isEditable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    
                    {/* Add Child - only for epics and features */}
                    {canAddChildren && onAddChild && (
                      <DropdownMenuItem onClick={onAddChild}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child {childTypes.length === 1 ? childTypes[0] : ''}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Split by Criteria - for items with 2+ ACs */}
                    {canSplit && onSplitByCriteria && (
                      <DropdownMenuItem onClick={onSplitByCriteria}>
                        <Scissors className="h-4 w-4 mr-2" />
                        Split by Criteria
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {onMoveUp && (
                      <DropdownMenuItem onClick={onMoveUp}>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                    )}
                    {onMoveDown && (
                      <DropdownMenuItem onClick={onMoveDown}>
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleStatusChange('idea')}>
                          Idea
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('refined')}>
                          Refined
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('ready')}>
                          Ready
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                          Done
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
