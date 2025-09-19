import React from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VersionConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTemplate: {
    title: string;
    version: string;
  } | null;
  suggestedVersion: string;
  customVersion: string;
  onCustomVersionChange: (version: string) => void;
  onReplace: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export const VersionConflictDialog: React.FC<VersionConflictDialogProps> = ({
  open,
  onOpenChange,
  existingTemplate,
  suggestedVersion,
  customVersion,
  onCustomVersionChange,
  onReplace,
  onCreateNew,
  onCancel,
}) => {
  if (!existingTemplate) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Template Already Exists</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              A template with the title "{existingTemplate.title}" already exists (version {existingTemplate.version}).
            </p>
            <p>What would you like to do?</p>
            
            <div className="space-y-2">
              <Label htmlFor="version">New Version Number:</Label>
              <Input
                id="version"
                value={customVersion}
                onChange={(e) => onCustomVersionChange(e.target.value)}
                placeholder="e.g., 1.1, 2.0"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={onCreateNew}>
            Create New Version
          </Button>
          <AlertDialogAction onClick={onReplace}>
            Replace Existing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};