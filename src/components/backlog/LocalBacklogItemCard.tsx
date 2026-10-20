import React from 'react';
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
  Check,
  Layers,
  Puzzle,
  FileText,
} from 'lucide-react';
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { cn } from '@/lib/utils';
import { canHaveChildren, getChildItemTypes, ITEM_TYPES } from '@/types/story';
import { PbiCardShell, type PbiState } from '@/components/pbi/PbiCardShell';
import { Chip } from '@/components/zooGame/ui/Chip';
import { TONE } from '@/components/zooGame/ui/tokens';
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
      ? { label: `${scheme.name} ?`, tone: 'attention' as const, title: `Not scored for ${scheme.name} yet` }
      : { label: `${scheme.name} ${score.toFixed(1)}`, tone: 'quiet' as const, title: `${scheme.name} score` };
  }
  const options = scheme.options ?? [];
  const option = options.find((o) => o.value === (item.priority || '').toLowerCase())
    ?? options[Math.min(scheme.rank(item), options.length) - 1];
  // In the zoo's tones, not the scheme's solid colours: the accent belongs to the work in hand, so
  // only a Must or a Should asks to be looked at
  const tone = ({ 1: 'danger', 2: 'attention' } as const)[scheme.rank(item) as 1 | 2] ?? 'quiet';
  return option ? { label: option.label, tone, title: scheme.name } : null;
};

/** Where the item is in its journey, as the zoo draws it: plain while it waits, a green edge and
 *  "Ready" once it meets the Definition of Ready, the accent while in hand, green on white when Done. */
const JOURNEY: Record<string, { state: PbiState; className?: string; chip: React.ReactNode }> = {
  idea: { state: 'backlog', chip: <Chip>Idea</Chip> },
  refined: { state: 'backlog', chip: <Chip>Refined</Chip> },
  ready: {
    state: 'backlog',
    className: 'border-2 border-emerald-400 bg-emerald-500/[0.04]',
    chip: <span className={cn(TONE.done.text, 'flex shrink-0 items-center gap-1 text-[11px] font-medium')}><Check className="h-3.5 w-3.5" /> Ready</span>,
  },
  in_progress: { state: 'doing', chip: <Chip tone="action">In Progress</Chip> },
  done: { state: 'live', chip: <Chip tone="done" icon={<Check className="h-2.5 w-2.5" />}>Done</Chip> },
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  epic: Layers,
  feature: Puzzle,
  story: FileText,
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

  const TypeIcon = TYPE_ICONS[item.item_type] ?? FileText;
  const journey = JOURNEY[item.status] ?? JOURNEY.idea;
  const typeLabel = ITEM_TYPES.find((t) => t.value === item.item_type)?.label ?? item.item_type;

  return (
    // The zoo's card, from the shared shell: icon, name, then its facts as chips and its size
    <div
      onDoubleClick={onEdit}
      style={{ marginLeft: indentLevel * 24 }}
      className={cn(indentLevel > 0 && 'border-l-2 border-l-primary/30 pl-2')}
    >
      <PbiCardShell
        icon={TypeIcon}
        name={item.title}
        points={item.estimated_effort ?? null}
        state={journey.state}
        className={cn('cursor-pointer hover:shadow-md', journey.className, isDragging && 'shadow-lg ring-2 ring-primary')}
        lead={<>
          {isEditable && (
            <span className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          {childrenCount > 0 && onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              aria-label={isExpanded ? 'Hide children' : 'Show children'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </Button>
          )}
          <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
        </>}
        badges={<>
          <Chip tone={item.item_type === 'epic' ? 'teach' : 'quiet'}>{typeLabel}</Chip>
          {priority && (
            <Chip title={priority.title} tone={priority.tone}>{priority.label}</Chip>
          )}
          {journey.chip}
          {item.target_release && <Chip>{item.target_release}</Chip>}
          {childrenCount > 0 && <Chip>{childrenCount} children</Chip>}
          {item.source && (
            <Chip title={item.source} className="max-w-[220px] truncate">{sourceLabels[item.source] || item.source}</Chip>
          )}
        </>}
        trailing={isEditable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Item actions">
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
        ) : undefined}
        detail={(item.description || item.acceptance_criteria?.length || item.estimated_value != null || item.tags?.length) ? (
          <div className="mt-1 pl-6">
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
                <span>{item.acceptance_criteria.length} acceptance criteria</span>
              )}
              {item.estimated_value != null && <span>Value: {item.estimated_value}</span>}
              {item.tags && item.tags.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {item.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-1 py-0">{tag}</Badge>
                  ))}
                </span>
              )}
            </div>
          </div>
        ) : undefined}
      />
    </div>
  );
};
