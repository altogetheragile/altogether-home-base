import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Trash2, Image, Video, FileText, ExternalLink, File, Archive, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { useMediaAssets, useMediaAssetMutations, MediaAsset, MediaAssetInsert } from '@/hooks/useMediaAssets';

interface AssetLibraryProps {
  selectedAssetIds: string[];
  onSelectionChange: (assetIds: string[]) => void;
  multiSelect?: boolean;
  bucketName?: string;
  supportedTypes?: ('image' | 'video' | 'document' | 'embed' | 'template' | 'text' | 'archive')[];
  maxFileSize?: number; // in MB
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  selectedAssetIds = [],
  onSelectionChange,
  multiSelect = true,
  bucketName = 'knowledge-base',
  supportedTypes = ['image', 'video', 'document', 'embed', 'template'],
  maxFileSize = 50
}) => {
  const [newAssetType, setNewAssetType] = useState<'image' | 'video' | 'document' | 'embed' | 'template'>('image');
  const [uploadFormData, setUploadFormData] = useState<Partial<MediaAssetInsert>>({
    type: 'image',
    title: '',
    description: ''
  });

  const { data: mediaAssets = [], isLoading } = useMediaAssets();
  const { createMediaAsset, deleteMediaAsset } = useMediaAssetMutations();

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxFileSize}MB limit`);
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
        type: uploadFormData.type || 'document',
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
      console.error('Asset upload error:', error);
      
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
      console.error('Error creating asset from URL:', error);
    }
  };

  const toggleSelection = (assetId: string) => {
    if (multiSelect) {
      const newSelection = selectedAssetIds.includes(assetId)
        ? selectedAssetIds.filter(id => id !== assetId)
        : [...selectedAssetIds, assetId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedAssetIds.includes(assetId) ? [] : [assetId]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'embed': return <ExternalLink className="h-4 w-4" />;
      case 'template': return <FileText className="h-4 w-4" />;
      case 'document': return <File className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAcceptedFileTypes = (type: string) => {
    switch (type) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'document': return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx';
      case 'template': return '.pdf,.png,.pptx,.xlsx,.docx';
      case 'text': return '.txt,.md';
      case 'archive': return '.zip,.rar,.7z';
      default: return '*/*';
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading asset library...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
            💡 <strong>How to select assets:</strong> Click on any asset to select/deselect it. Selected items will show a checkmark and blue border.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {mediaAssets.map((asset) => (
              <Card 
                key={asset.id}
                className={`cursor-pointer transition-colors ${
                  selectedAssetIds.includes(asset.id) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleSelection(asset.id)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(asset.type)}
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                    </div>
                    {selectedAssetIds.includes(asset.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {asset.type === 'image' && asset.url && (
                    <img 
                      src={asset.url} 
                      alt={asset.title || 'Asset'} 
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
                  {asset.file_size && (
                    <p className="text-xs text-muted-foreground">
                      {(asset.file_size / 1024 / 1024).toFixed(2)} MB
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
              No assets yet. Upload some files to get started.
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset-type">Type</Label>
              <Select 
                value={uploadFormData.type} 
                onValueChange={(value: 'image' | 'video' | 'document' | 'embed' | 'template') => 
                  setUploadFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedTypes.includes('image') && <SelectItem value="image">Image</SelectItem>}
                  {supportedTypes.includes('video') && <SelectItem value="video">Video</SelectItem>}
                  {supportedTypes.includes('document') && <SelectItem value="document">Document</SelectItem>}
                  {supportedTypes.includes('template') && <SelectItem value="template">Template</SelectItem>}
                  {supportedTypes.includes('embed') && <SelectItem value="embed">Embed</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="asset-title">Title</Label>
              <Input
                id="asset-title"
                value={uploadFormData.title || ''}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Asset title"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="asset-description">Description</Label>
            <Input
              id="asset-description"
              value={uploadFormData.description || ''}
              onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Asset description (optional)"
            />
          </div>

          {(uploadFormData.type !== 'embed') && (
            <div>
              <Label>Upload File</Label>
              <Input
                type="file"
                accept={getAcceptedFileTypes(uploadFormData.type || 'document')}
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
                Add Asset
              </Button>
            </div>
          )}

          {createMediaAsset.isPending && (
            <div className="text-sm text-primary">Creating asset...</div>
          )}
        </TabsContent>
      </Tabs>

      {selectedAssetIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedAssetIds.length} item{selectedAssetIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};