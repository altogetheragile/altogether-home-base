import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  GripVertical, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Scissors,
  GitBranch,
} from 'lucide-react';
import { BacklogItem, useUpdateBacklogItem, useDeleteBacklogItem } from '@/hooks/useBacklogItems';
import { cn } from '@/lib/utils';

interface BacklogItemCardProps {
  item: BacklogItem;
  index: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onEdit?: () => void;
  onSplit?: () => void;
  parentTitle?: string;
  childCount?: number;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-primary text-primary-foreground',
  low: 'bg-muted text-muted-foreground',
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

export const BacklogItemCard: React.FC<BacklogItemCardProps> = ({
  item,
  index,
  onMoveUp,
  onMoveDown,
  isDragging,
  dragHandleProps,
  onEdit,
  onSplit,
  parentTitle,
  childCount,
}) => {
  const updateItem = useUpdateBacklogItem();
  const deleteItem = useDeleteBacklogItem();

  const handleStatusChange = async (newStatus: string) => {
    await updateItem.mutateAsync({
      id: item.id,
      updates: { status: newStatus },
    });
  };

  const hasAcceptanceCriteria = item.acceptance_criteria && item.acceptance_criteria.length > 1;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isDragging && "shadow-lg ring-2 ring-primary",
      parentTitle && "border-l-4 border-l-purple-400"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div 
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {/* Parent/Child indicators */}
                {parentTitle && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-1">
                    <GitBranch className="h-3 w-3" />
                    <span>Child of: {parentTitle.substring(0, 25)}{parentTitle.length > 25 ? '...' : ''}</span>
                  </div>
                )}
                {childCount && childCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary mb-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{childCount} child {childCount === 1 ? 'item' : 'items'}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    #{index + 1}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", priorityColors[item.priority])}
                  >
                    {item.priority}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", statusColors[item.status])}
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {item.source && (
                    <span>{sourceLabels[item.source] || item.source}</span>
                  )}
                  {item.estimated_value && (
                    <span>Value: {item.estimated_value}</span>
                  )}
                  {item.estimated_effort && (
                    <span>Effort: {item.estimated_effort}</span>
                  )}
                </div>
              </div>
              
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
                  {hasAcceptanceCriteria && (
                    <DropdownMenuItem onClick={onSplit}>
                      <Scissors className="h-4 w-4 mr-2" />
                      Split by Criteria
                    </DropdownMenuItem>
                  )}
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
                  <DropdownMenuItem onClick={() => handleStatusChange('idea')}>
                    Mark as Idea
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('refined')}>
                    Mark as Refined
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('ready')}>
                    Mark as Ready
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                    Mark as Done
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteItem.mutate(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
