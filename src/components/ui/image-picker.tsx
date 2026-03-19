import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageCropper } from './image-cropper';
import { useUnifiedAssets, useUnifiedAssetMutations } from '@/hooks/useUnifiedAssetManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image as ImageIcon, Upload, X, Search, Check, Crop } from 'lucide-react';

interface ImagePickerProps {
  /** Current image URL */
  value?: string;
  /** Called with the new image URL (or empty string on remove) */
  onChange: (url: string) => void;
  /** Storage bucket name */
  bucket?: string;
  /** Path prefix inside the bucket */
  path?: string;
  /** Max file size in MB */
  maxSize?: number;
  /** Crop aspect ratio (default 16/9) */
  aspect?: number;
  /** Label shown above the component */
  label?: string;
  className?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  bucket = 'assets',
  path = '',
  maxSize = 10,
  aspect = 16 / 9,
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<'upload' | 'existing'>('upload');
  const [pendingFile, setPendingFile] = useState<{ name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets } = useUnifiedAssets({ mediaOnly: true });
  const { createAsset } = useUnifiedAssetMutations();

  // Filter to images only, with search
  const imageAssets = (assets || []).filter(a => {
    if (a.type !== 'image') return false;
    if (!searchQuery) return true;
    return (
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSelectExisting = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  const handleCropExisting = (url: string) => {
    setCropSrc(url);
    setCropSource('existing');
    setPendingFile({ name: 'cropped-image' });
  };

  const handleCropCurrentImage = () => {
    if (!value) return;
    setCropSrc(value);
    setCropSource('existing');
    setPendingFile({ name: 'cropped-image' });
    setIsOpen(true);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxSize}MB`);
      return;
    }

    // Show crop UI with a local object URL
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCropSource('upload');
    setPendingFile({ name: file.name });

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null);
    setIsUploading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const ext = 'webp'; // ImageCropper outputs webp
      const fileName = `${path}${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Register in unified asset library
      await createAsset.mutateAsync({
        type: 'image',
        title: pendingFile?.name?.replace(/\.[^.]+$/, '') || 'Uploaded image',
        url: publicUrl,
        file_size: blob.size,
        file_type: 'image/webp',
        original_filename: pendingFile?.name || 'image.webp',
        is_template: false,
      });

      onChange(publicUrl);
      setIsOpen(false);
      toast.success(cropSource === 'existing' ? 'Cropped image saved' : 'Image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setPendingFile(null);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc && cropSource === 'upload') URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      {/* Preview */}
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Selected image"
            className="w-full h-48 object-contain rounded-lg border bg-muted/30"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCropCurrentImage}
            >
              <Crop className="h-4 w-4 mr-1" />
              Crop
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              Change
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
        >
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <span className="text-sm text-muted-foreground">Click to select or upload an image</span>
        </button>
      )}

      {/* Picker Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleCropCancel();
        setIsOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {cropSrc ? 'Crop & Zoom' : 'Select Image'}
            </DialogTitle>
          </DialogHeader>

          {cropSrc ? (
            <ImageCropper
              imageSrc={cropSrc}
              aspect={aspect}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          ) : (
            <Tabs defaultValue="library">
              <TabsList>
                <TabsTrigger value="library">Asset Library</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {imageAssets.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                    {imageAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`relative rounded-lg border overflow-hidden transition-all ${
                          value === asset.url ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                        }`}
                      >
                        <img
                          src={asset.url}
                          alt={asset.title || 'Asset'}
                          className="w-full h-24 object-contain bg-muted/30 cursor-pointer"
                          onClick={() => handleSelectExisting(asset.url)}
                        />
                        {value === asset.url && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCropExisting(asset.url)}
                          className="absolute top-1 right-1 bg-white/90 hover:bg-white text-gray-700 rounded p-1 shadow-sm transition-colors"
                          title="Crop & zoom this image"
                        >
                          <Crop className="h-3 w-3" />
                        </button>
                        <div className="px-2 py-1 text-xs truncate text-muted-foreground">
                          {asset.title || asset.original_filename || 'Untitled'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery ? 'No images match your search' : 'No images in the library yet'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to select an image</p>
                  <p className="text-xs text-muted-foreground mt-1">Max {maxSize}MB. Will be cropped before upload.</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />

                {isUploading && (
                  <div className="text-center text-sm text-muted-foreground">Uploading cropped image...</div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
