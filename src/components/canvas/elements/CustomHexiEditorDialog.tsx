import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Copy } from 'lucide-react';
import { HexiColorPalette } from './HexiColorPalette';
import { getLightTint } from '../hex-utils';
import { HexiIconSelector } from './HexiIconSelector';
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

interface CustomHexiEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    label: string;
    color: string;
    borderColor?: string;
    fillColor?: string;
    domain_id?: string;
    domain_name?: string;
    icon?: string;
    emoji?: string;
    notes?: string;
  };
  onSave: (data: any) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export const CustomHexiEditorDialog: React.FC<CustomHexiEditorDialogProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [formData, setFormData] = useState(data);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
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
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Custom Hexagon</DialogTitle>
            <DialogDescription>
              Customize your hexagon's appearance and content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
                onColorChange={(color) => setFormData({ ...formData, borderColor: color })}
                allowCustom
              />
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <Label>Fill Color</Label>
              <HexiColorPalette
                selectedColor={formData.fillColor ?? getLightTint(formData.color ?? "#8B5CF6", 0.2)}
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hexagon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this hexagon from your canvas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
