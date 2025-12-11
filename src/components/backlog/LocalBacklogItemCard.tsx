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
} from 'lucide-react';
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { cn } from '@/lib/utils';
import { InlineEditableText } from '@/components/ui/InlineEditableText';

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
}) => {
  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
      onDoubleClick={onEdit}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {isEditable && (
            <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                  {item.estimated_effort != null && (
                    <Badge variant="secondary" className="text-xs">
                      {item.estimated_effort} pts
                    </Badge>
                  )}
                  {item.target_release && (
                    <Badge variant="outline" className="text-xs">
                      {item.target_release}
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
                  {item.source && (
                    <span>{sourceLabels[item.source] || item.source}</span>
                  )}
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
