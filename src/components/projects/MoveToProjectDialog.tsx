import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProjects } from '@/hooks/useProjects';
import { ProjectArtifact } from '@/hooks/useProjectArtifacts';
import { Loader2, FolderOpen } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MoveToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: ProjectArtifact;
  currentProjectId: string;
  onMove: (artifactId: string, toProjectId: string) => void;
  isMoving?: boolean;
}

export const MoveToProjectDialog: React.FC<MoveToProjectDialogProps> = ({
  open,
  onOpenChange,
  artifact,
  currentProjectId,
  onMove,
  isMoving = false,
}) => {
  const { data: projects, isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Filter out current project
  const availableProjects = projects?.filter(p => p.id !== currentProjectId) || [];

  const handleMove = () => {
    if (selectedProjectId) {
      onMove(artifact.id, selectedProjectId);
      setSelectedProjectId('');
    }
  };

  const handleCancel = () => {
    setSelectedProjectId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Project</DialogTitle>
          <DialogDescription>
            Select a project to move "{artifact.name}" to
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No other projects available. Create a new project first.
              </p>
            </div>
          ) : (
            <RadioGroup value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {availableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={project.id} id={project.id} />
                    <Label
                      htmlFor={project.id}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color_theme }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isMoving}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedProjectId || isMoving || availableProjects.length === 0}
          >
            {isMoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
