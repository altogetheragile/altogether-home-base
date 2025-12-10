import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Sparkles } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';
import { ProjectArtifact, useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface ArtifactsListProps {
  artifacts: ProjectArtifact[];
  projectId: string;
}

export const ArtifactsList: React.FC<ArtifactsListProps> = ({ artifacts, projectId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { deleteArtifact, moveArtifact, updateArtifact, reorderArtifacts } = useProjectArtifactMutations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<ProjectArtifact | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDeleteArtifact = (artifactId: string) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    if (artifact) {
      setArtifactToDelete(artifact);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteArtifact = () => {
    if (artifactToDelete) {
      deleteArtifact.mutate(
        { id: artifactToDelete.id, projectId },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setArtifactToDelete(null);
          },
        }
      );
    }
  };

  const handleOpenArtifact = (artifact: ProjectArtifact) => {
    navigate(`/projects/${projectId}/artifacts/${artifact.id}`);
  };

  const handleMoveArtifact = (artifactId: string, toProjectId: string) => {
    moveArtifact.mutate({ id: artifactId, fromProjectId: projectId, toProjectId });
  };

  const handleRenameArtifact = (artifactId: string, name: string, description?: string) => {
    updateArtifact.mutate({ id: artifactId, updates: { name, description } });
  };

  const handleDragStart = (e: React.DragEvent, artifact: ProjectArtifact) => {
    setDraggedId(artifact.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetArtifact: ProjectArtifact) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetArtifact.id) {
      setDraggedId(null);
      return;
    }

    // Sort all artifacts by display_order for global reordering
    const sortedArtifacts = [...artifacts].sort((a, b) => a.display_order - b.display_order);
    
    const draggedIndex = sortedArtifacts.findIndex(a => a.id === draggedId);
    const targetIndex = sortedArtifacts.findIndex(a => a.id === targetArtifact.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder all artifacts
    const newArtifacts = [...sortedArtifacts];
    const [draggedItem] = newArtifacts.splice(draggedIndex, 1);
    newArtifacts.splice(targetIndex, 0, draggedItem);

    // Create updates with new display_order for ALL artifacts
    const updates = newArtifacts.map((artifact, index) => ({
      id: artifact.id,
      display_order: index + 1,
    }));

    // Optimistically update the cache
    queryClient.setQueryData(
      ['project-artifacts', projectId],
      (oldData: ProjectArtifact[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(artifact => {
          const update = updates.find(u => u.id === artifact.id);
          return update ? { ...artifact, display_order: update.display_order } : artifact;
        }).sort((a, b) => a.display_order - b.display_order);
      }
    );

    // Persist to database
    reorderArtifacts.mutate(updates, {
      onError: () => {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: ['project-artifacts', projectId] });
      },
    });

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Sort artifacts by display_order
  const sortedArtifacts = [...artifacts].sort((a, b) => a.display_order - b.display_order);

  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No artifacts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save outputs from AI tools like the BMC Generator or User Story Canvas to this project.
          </p>
          <Button onClick={() => navigate('/ai-tools')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Go to AI Tools
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedArtifacts.map((artifact) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            onDelete={handleDeleteArtifact}
            onOpen={handleOpenArtifact}
            onMove={handleMoveArtifact}
            onRename={handleRenameArtifact}
            isMoving={moveArtifact.isPending}
            isRenaming={updateArtifact.isPending}
            isDragging={draggedId === artifact.id}
            onDragStart={(e) => handleDragStart(e, artifact)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, artifact)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{artifactToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteArtifact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Artifact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};