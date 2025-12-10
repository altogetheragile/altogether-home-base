import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  FileText, 
  Layout, 
  Trash2,
  ExternalLink,
  MoreHorizontal,
  FolderInput,
  Pencil,
  GripVertical,
  Hexagon,
  ClipboardList
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ProjectArtifact } from '@/hooks/useProjectArtifacts';
import { MoveToProjectDialog } from './MoveToProjectDialog';
import { RenameArtifactDialog } from './RenameArtifactDialog';
import { cn } from '@/lib/utils';

interface ArtifactCardProps {
  artifact: ProjectArtifact;
  onDelete: (id: string) => void;
  onOpen: (artifact: ProjectArtifact) => void;
  onMove?: (artifactId: string, toProjectId: string) => void;
  onRename?: (artifactId: string, name: string, description?: string) => void;
  isMoving?: boolean;
  isRenaming?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const getArtifactIcon = (type: string) => {
  switch (type) {
    case 'bmc':
      return <Sparkles className="h-5 w-5 text-primary" />;
    case 'canvas':
      return <Layout className="h-5 w-5 text-blue-500" />;
    case 'user_story':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'project-model':
      return <Hexagon className="h-5 w-5 text-purple-500" />;
    case 'product-backlog':
      return <ClipboardList className="h-5 w-5 text-orange-500" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const getArtifactTypeName = (type: string) => {
  switch (type) {
    case 'bmc':
      return 'Business Model Canvas';
    case 'canvas':
      return 'Canvas';
    case 'user_story':
      return 'User Story';
    case 'project-model':
      return 'Project Model';
    case 'product-backlog':
      return 'Product Backlog';
    default:
      return type;
  }
};

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ 
  artifact, 
  onDelete, 
  onOpen, 
  onMove, 
  onRename, 
  isMoving, 
  isRenaming,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleMove = (artifactId: string, toProjectId: string) => {
    onMove?.(artifactId, toProjectId);
    setMoveDialogOpen(false);
  };

  const handleRename = (artifactId: string, name: string, description?: string) => {
    onRename?.(artifactId, name, description);
    setRenameDialogOpen(false);
  };

  return (
    <>
    <Card 
      className={cn(
        "hover:shadow-md transition-all group cursor-pointer relative",
        isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(artifact)}
    >
      {/* Drag Handle */}
      <div 
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <CardHeader className="pb-3 pl-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted flex-shrink-0">
              {getArtifactIcon(artifact.artifact_type)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight truncate mb-2">
                {artifact.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs mb-2">
                {getArtifactTypeName(artifact.artifact_type)}
              </Badge>
              {artifact.description && (
                <CardDescription className="line-clamp-2 text-sm">
                  {artifact.description}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(artifact);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {onRename && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {onMove && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveDialogOpen(true);
                  }}
                >
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to Project
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(artifact.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pl-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(artifact);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>

    {onRename && (
      <RenameArtifactDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        artifact={artifact}
        onRename={handleRename}
        isRenaming={isRenaming}
      />
    )}

    {onMove && (
      <MoveToProjectDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        artifact={artifact}
        currentProjectId={artifact.project_id}
        onMove={handleMove}
        isMoving={isMoving}
      />
    )}
    </>
  );
};
