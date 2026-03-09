import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface BackgroundImageControlProps {
  blockType: string;
  content: any;
  onContentChange: (key: string, value: any) => void;
}

export const BackgroundImageControl: React.FC<BackgroundImageControlProps> = ({
  blockType,
  content,
  onContentChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${blockType}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-backgrounds')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-backgrounds')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded background image');
      }

      onContentChange('backgroundImage', publicUrl);
      toast({
        title: "Upload Successful",
        description: `Background image "${file.name}" uploaded successfully`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorCode = error?.error || error?.code || 'UNKNOWN';

      let userFriendlyMessage = "Failed to upload background image.";

      if (errorMessage.includes('The resource already exists')) {
        userFriendlyMessage = "A file with this name already exists. Please rename your file and try again.";
      } else if (errorMessage.includes('exceeded') || errorMessage.includes('limit')) {
        userFriendlyMessage = "File size exceeds the allowed limit (5MB max).";
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        userFriendlyMessage = "Invalid file format or corrupted image file.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        userFriendlyMessage = "Permission denied. Please contact support.";
      } else if (errorCode === 'STORAGE_OBJECT_NOT_FOUND') {
        userFriendlyMessage = "Storage bucket not found. Please contact support.";
      }

      toast({
        title: "Upload Failed",
        description: `${userFriendlyMessage} Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeBackgroundImage = () => {
    onContentChange('backgroundImage', '');
  };

  return (
    <>
      <div className="space-y-3">
        <Label>Background Image</Label>
        {content?.backgroundImage ? (
          <div className="space-y-2">
            <div className="relative">
              <img
                src={content.backgroundImage}
                alt="Background"
                className="w-full h-32 object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeBackgroundImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the X to remove the current background image
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById(`${blockType}-bg-upload`)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <input
                id={`${blockType}-bg-upload`}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a background image (max 5MB)
            </p>
          </div>
        )}

        {/* Background Image Properties */}
        {content?.backgroundImage && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor={`${blockType}-bg-position`}>Background Position</Label>
              <Select
                value={content?.backgroundPosition || 'center'}
                onValueChange={(value) => onContentChange('backgroundPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="top left">Top Left</SelectItem>
                  <SelectItem value="top right">Top Right</SelectItem>
                  <SelectItem value="bottom left">Bottom Left</SelectItem>
                  <SelectItem value="bottom right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`${blockType}-bg-size`}>Background Size</Label>
              <Select
                value={content?.backgroundSize || 'cover'}
                onValueChange={(value) => onContentChange('backgroundSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (fill area)</SelectItem>
                  <SelectItem value="contain">Contain (fit area)</SelectItem>
                  <SelectItem value="auto">Auto (original size)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${blockType}-overlay-opacity`}>
                Overlay Opacity: {content?.overlayOpacity || 0}%
              </Label>
              <input
                id={`${blockType}-overlay-opacity`}
                type="range"
                min="0"
                max="100"
                value={content?.overlayOpacity || 0}
                onChange={(e) => onContentChange('overlayOpacity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {content?.overlayOpacity > 0 && (
              <div>
                <Label htmlFor={`${blockType}-overlay-color`}>Overlay Color</Label>
                <Input
                  id={`${blockType}-overlay-color`}
                  type="color"
                  value={content?.overlayColor || '#000000'}
                  onChange={(e) => onContentChange('overlayColor', e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          id={`${blockType}-parallax`}
          type="checkbox"
          checked={content?.parallax || false}
          onChange={(e) => onContentChange('parallax', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor={`${blockType}-parallax`}>Enable parallax effect (requires background image)</Label>
      </div>
    </>
  );
};
