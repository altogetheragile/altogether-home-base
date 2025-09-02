import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Trash2, Upload, Image, Video, FileText, ExternalLink, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { useMediaAssets, useMediaAssetMutations, MediaAsset, MediaAssetInsert } from '@/hooks/useMediaAssets';

interface MediaLibraryProps {
  selectedMediaIds: string[];
  onSelectionChange: (mediaIds: string[]) => void;
  multiSelect?: boolean;
  bucketName?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  selectedMediaIds = [],
  onSelectionChange,
  multiSelect = true,
  bucketName = 'knowledge-base'
}) => {
  const [uploadingItems, setUploadingItems] = useState<Set<number>>(new Set());
  const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'embed'>('image');
  const [uploadFormData, setUploadFormData] = useState<Partial<MediaAssetInsert>>({
    type: 'image',
    title: '',
    description: ''
  });

  const { data: mediaAssets = [], isLoading } = useMediaAssets();
  const { createMediaAsset, deleteMediaAsset } = useMediaAssetMutations();

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file size (10MB limit for media files)
      const maxSizeMB = 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to ${bucketName}/${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        console.error('Failed to get public URL for file:', filePath);
        throw new Error('Failed to get public URL for uploaded file');
      }

      // Create media asset in database
      await createMediaAsset.mutateAsync({
        type: uploadFormData.type || 'image',
        title: uploadFormData.title || file.name,
        description: uploadFormData.description,
        url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        original_filename: file.name
      });

      // Reset form
      setUploadFormData({
        type: 'image',
        title: '',
        description: ''
      });

      console.log(`Upload successful: ${publicUrl}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Media upload error:', error);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCreateFromUrl = async () => {
    if (!uploadFormData.url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }

    try {
      await createMediaAsset.mutateAsync({
        type: uploadFormData.type || 'embed',
        title: uploadFormData.title || 'Untitled',
        description: uploadFormData.description,
        url: uploadFormData.url
      });

      // Reset form
      setUploadFormData({
        type: 'image',
        title: '',
        description: '',
        url: ''
      });
    } catch (error) {
      console.error('Error creating media from URL:', error);
    }
  };

  const toggleSelection = (mediaId: string) => {
    if (multiSelect) {
      const newSelection = selectedMediaIds.includes(mediaId)
        ? selectedMediaIds.filter(id => id !== mediaId)
        : [...selectedMediaIds, mediaId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedMediaIds.includes(mediaId) ? [] : [mediaId]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'embed': return <ExternalLink className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading media library...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {selectedMediaIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4">
              <p className="text-sm text-primary-foreground/80">
                <strong>{selectedMediaIds.length}</strong> item{selectedMediaIds.length !== 1 ? 's' : ''} selected. 
                Click items below to select/deselect them.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {mediaAssets.map((asset) => (
              <Card 
                key={asset.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedMediaIds.includes(asset.id) 
                    ? 'ring-2 ring-primary bg-primary/10 shadow-md scale-[1.02]' 
                    : 'hover:bg-muted/50 hover:shadow-sm'
                }`}
                onClick={() => toggleSelection(asset.id)}
                title={selectedMediaIds.includes(asset.id) ? 'Click to deselect' : 'Click to select'}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(asset.type)}
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                    </div>
                    {selectedMediaIds.includes(asset.id) && (
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-primary font-bold" />
                        <span className="text-xs text-primary font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {asset.type === 'image' && asset.url && (
                    <img 
                      src={asset.url} 
                      alt={asset.title || 'Media'} 
                      className="w-full h-24 object-cover rounded mb-2" 
                    />
                  )}
                  <h4 className="font-medium text-sm truncate">
                    {asset.title || asset.original_filename || 'Untitled'}
                  </h4>
                  {asset.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {asset.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMediaAsset.mutate(asset.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {mediaAssets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No media assets yet. Upload some files to get started.
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="media-type">Type</Label>
              <Select 
                value={uploadFormData.type} 
                onValueChange={(value: 'image' | 'video' | 'embed') => 
                  setUploadFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="embed">Embed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="media-title">Title</Label>
              <Input
                id="media-title"
                value={uploadFormData.title || ''}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Media title"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="media-description">Description</Label>
            <Input
              id="media-description"
              value={uploadFormData.description || ''}
              onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Media description (optional)"
            />
          </div>

          {(uploadFormData.type === 'image' || uploadFormData.type === 'video') && (
            <div>
              <Label>Upload File</Label>
              <Input
                type="file"
                accept={uploadFormData.type === 'image' ? 'image/*' : 'video/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                disabled={createMediaAsset.isPending}
              />
            </div>
          )}

          {uploadFormData.type === 'embed' && (
            <div className="space-y-2">
              <Label htmlFor="embed-url">URL</Label>
              <Input
                id="embed-url"
                value={uploadFormData.url || ''}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
              <Button 
                onClick={handleCreateFromUrl}
                disabled={createMediaAsset.isPending || !uploadFormData.url}
              >
                Add Media
              </Button>
            </div>
          )}

          {createMediaAsset.isPending && (
            <div className="text-sm text-blue-600">Creating media asset...</div>
          )}
        </TabsContent>
      </Tabs>

      {selectedMediaIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedMediaIds.length} item{selectedMediaIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};