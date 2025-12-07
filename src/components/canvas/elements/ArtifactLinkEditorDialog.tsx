import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Copy, Unlink } from 'lucide-react';
import { HexiColorPalette } from './HexiColorPalette';
import { HexiIconSelector } from './HexiIconSelector';
import { getLightTint } from '../hex-utils';
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
import type { ArtifactLinkData } from './ArtifactLinkHexiElement';

interface ArtifactLinkEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ArtifactLinkData;
  onSave: (data: ArtifactLinkData) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUnlink?: () => void;
}

export const ArtifactLinkEditorDialog: React.FC<ArtifactLinkEditorDialogProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onDelete,
  onDuplicate,
  onUnlink,
}) => {
  const [formData, setFormData] = useState<ArtifactLinkData>(data);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(data);
    }
  }, [isOpen, data]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleUnlink = () => {
    setShowUnlinkConfirm(true);
  };

  const confirmUnlink = () => {
    onUnlink?.();
    setShowUnlinkConfirm(false);
    onClose();
  };

  const getLinkTypeLabel = () => {
    switch (formData.linkType) {
      case 'artifact':
        return `Linked to: ${formData.artifactName || 'Artifact'}`;
      case 'file':
        return `Linked to: ${formData.fileName || 'File'}`;
      case 'external':
        return `Linked to: ${formData.externalUrl || 'URL'}`;
      default:
        return 'Not linked';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Artifact Link</DialogTitle>
            <DialogDescription>
              Customize the appearance of this linked hexi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Link Status */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{getLinkTypeLabel()}</p>
              {formData.linkType !== 'placeholder' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={handleUnlink}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink
                </Button>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                maxLength={30}
                placeholder="Enter label..."
              />
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label>Border Color</Label>
              <HexiColorPalette
                selectedColor={formData.borderColor ?? formData.color}
                onColorChange={(color) => setFormData({ ...formData, borderColor: color, color })}
                allowCustom
              />
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <HexiColorPalette
                selectedColor={formData.fillColor ?? getLightTint(formData.color ?? '#3B82F6', 0.2)}
                onColorChange={(color) => setFormData({ ...formData, fillColor: color })}
                allowCustom
              />
            </div>

            {/* Icon/Emoji */}
            <div className="space-y-2">
              <Label>Icon or Emoji</Label>
              <HexiIconSelector
                selectedIcon={formData.icon}
                selectedEmoji={formData.emoji}
                onIconChange={(icon) => setFormData({ ...formData, icon, emoji: undefined })}
                onEmojiChange={(emoji) => setFormData({ ...formData, emoji, icon: undefined })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {onDuplicate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onDuplicate();
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this linked hexi from your canvas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Confirmation */}
      <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link to the resource but keep the hexi on your canvas as a placeholder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlink}>
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
