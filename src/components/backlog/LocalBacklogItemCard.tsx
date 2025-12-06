import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { cn } from '@/lib/utils';

interface LocalBacklogItemCardProps {
  item: LocalBacklogItem;
  index: number;
  onUpdate: (updates: Partial<LocalBacklogItem>) => void;
  onDelete: () => void;
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

const SOURCES = [
  { value: 'user_feedback', label: 'User Feedback' },
  { value: 'development', label: 'Development' },
  { value: 'bug_fix', label: 'Bug Fix' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'ai_suggestion', label: 'AI Suggestion' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUSES = [
  { value: 'idea', label: 'Idea' },
  { value: 'refined', label: 'Refined' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const LocalBacklogItemCard: React.FC<LocalBacklogItemCardProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragging,
  isEditable = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [editPriority, setEditPriority] = useState(item.priority);
  const [editStatus, setEditStatus] = useState(item.status);
  const [editSource, setEditSource] = useState(item.source || 'enhancement');
  const [editValue, setEditValue] = useState(item.estimated_value?.toString() || '');
  const [editEffort, setEditEffort] = useState(item.estimated_effort?.toString() || '');
  const [editTargetRelease, setEditTargetRelease] = useState(item.target_release || '');
  const [editTags, setEditTags] = useState(item.tags?.join(', ') || '');

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPriority(item.priority);
    setEditStatus(item.status);
    setEditSource(item.source || 'enhancement');
    setEditValue(item.estimated_value?.toString() || '');
    setEditEffort(item.estimated_effort?.toString() || '');
    setEditTargetRelease(item.target_release || '');
    setEditTags(item.tags?.join(', ') || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      description: editDescription || null,
      priority: editPriority,
      status: editStatus,
      source: editSource,
      estimated_value: editValue ? Number(editValue) : null,
      estimated_effort: editEffort ? Number(editEffort) : null,
      target_release: editTargetRelease || null,
      tags: editTags.trim() ? editTags.split(',').map(t => t.trim()).filter(Boolean) : null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editTitle">Title *</Label>
            <Input
              id="editTitle"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editDescription">Description</Label>
            <Textarea
              id="editDescription"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={editSource} onValueChange={setEditSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="editValue">Estimated Value</Label>
              <Input
                id="editValue"
                type="number"
                placeholder="Business value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editEffort">Estimated Effort</Label>
              <Input
                id="editEffort"
                type="number"
                placeholder="Story points"
                value={editEffort}
                onChange={(e) => setEditEffort(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTargetRelease">Target Release</Label>
              <Input
                id="editTargetRelease"
                placeholder="e.g., v1.0"
                value={editTargetRelease}
                onChange={(e) => setEditTargetRelease(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTags">Tags</Label>
            <Input
              id="editTags"
              placeholder="Comma-separated tags"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!editTitle.trim()}>
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
                  {item.target_release && (
                    <Badge variant="outline" className="text-xs">
                      {item.target_release}
                    </Badge>
                  )}
                </div>
                
                <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {item.source && (
                    <span>{sourceLabels[item.source] || item.source}</span>
                  )}
                  {item.estimated_value != null && (
                    <span>Value: {item.estimated_value}</span>
                  )}
                  {item.estimated_effort != null && (
                    <span>Effort: {item.estimated_effort}</span>
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
                    <DropdownMenuItem onClick={handleStartEdit}>
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
