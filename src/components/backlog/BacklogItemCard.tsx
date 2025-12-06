import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Check,
  X
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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  
  const updateItem = useUpdateBacklogItem();
  const deleteItem = useDeleteBacklogItem();

  const handleSave = async () => {
    await updateItem.mutateAsync({
      id: item.id,
      updates: {
        title: editTitle,
        description: editDescription || null,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setIsEditing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateItem.mutateAsync({
      id: item.id,
      updates: { status: newStatus },
    });
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4 space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="font-medium"
            autoFocus
          />
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isDragging && "shadow-lg ring-2 ring-primary"
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
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
