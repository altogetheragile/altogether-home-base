import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Trash2, Upload, Image, Video, FileText, ExternalLink, Plus, File, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface AssetItem {
  id?: string;
  type: 'image' | 'video' | 'document' | 'embed' | 'template' | 'text' | 'archive';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  position: number;
  file_size?: number;
  file_type?: string;
  original_filename?: string;
}

interface AssetManagerProps {
  value: AssetItem[];
  onChange: (assets: AssetItem[]) => void;
  bucketName?: string;
  supportedTypes?: AssetItem['type'][];
  maxFileSize?: number; // in MB
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  value = [],
  onChange,
  bucketName = 'knowledge-base',
  supportedTypes = ['image', 'video', 'document', 'embed', 'template'],
  maxFileSize = 50
}) => {
  const [uploadingItems, setUploadingItems] = useState<Set<number>>(new Set());
  const [newAssetType, setNewAssetType] = useState<AssetItem['type']>(supportedTypes[0]);

  const handleFileUpload = async (file: File, index: number) => {
    try {
      setUploadingItems(prev => new Set([...prev, index]));

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxFileSize}MB limit`);
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;
      const assetType = value[index]?.type || 'document';

      console.log(`Starting ${assetType} upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to ${bucketName}/${filePath}`);

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

      const updatedAssets = [...value];
      updatedAssets[index] = {
        ...updatedAssets[index],
        url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        original_filename: file.name
      };

      console.log(`${assetType} upload successful: ${publicUrl}`);
      onChange(updatedAssets);
      toast({
        title: "Upload Successful",
        description: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} "${file.name}" uploaded successfully`
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      const assetType = value[index]?.type || 'file';
      
      console.error('Asset upload error details:', {
        message: errorMessage,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        assetType,
        bucketName,
        index,
        error
      });

      let userFriendlyMessage = `Failed to upload ${assetType}.`;
      
      if (errorMessage.includes('The resource already exists')) {
        userFriendlyMessage = "A file with this name already exists. Please rename your file and try again.";
      } else if (errorMessage.includes('exceeded') || errorMessage.includes('limit')) {
        userFriendlyMessage = `File size exceeds the allowed limit (${maxFileSize}MB max).`;
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        userFriendlyMessage = "Invalid file format or corrupted file.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        userFriendlyMessage = "Permission denied. Please contact support.";
      }

      toast({
        title: "Upload Failed",
        description: `${userFriendlyMessage} Error: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setUploadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const addAssetItem = () => {
    const newItem: AssetItem = {
      type: newAssetType,
      title: '',
      description: '',
      url: '',
      position: value.length
    };

    onChange([...value, newItem]);
  };

  const updateAssetItem = (index: number, updates: Partial<AssetItem>) => {
    const updatedAssets = [...value];
    updatedAssets[index] = { ...updatedAssets[index], ...updates };
    onChange(updatedAssets);
  };

  const removeAssetItem = (index: number) => {
    const updatedAssets = value.filter((_, i) => i !== index);
    // Update positions
    const reindexedAssets = updatedAssets.map((item, i) => ({ ...item, position: i }));
    onChange(reindexedAssets);
  };

  const moveAssetItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return;
    }

    const updatedAssets = [...value];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedAssets[index], updatedAssets[swapIndex]] = [updatedAssets[swapIndex], updatedAssets[index]];
    
    // Update positions
    updatedAssets[index].position = index;
    updatedAssets[swapIndex].position = swapIndex;
    
    onChange(updatedAssets);
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

  const getAcceptedFileTypes = (type: AssetItem['type']) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select 
          value={newAssetType} 
          onValueChange={(value: AssetItem['type']) => setNewAssetType(value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={addAssetItem} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {newAssetType}
        </Button>
      </div>

      {value.map((item, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {getTypeIcon(item.type)}
                <Badge variant="outline">{item.type}</Badge>
                <span>#{index + 1}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveAssetItem(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveAssetItem(index, 'down')}
                  disabled={index === value.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAssetItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`title-${index}`}>Title</Label>
                <Input
                  id={`title-${index}`}
                  value={item.title || ''}
                  onChange={(e) => updateAssetItem(index, { title: e.target.value })}
                  placeholder="Asset title"
                />
              </div>
              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description || ''}
                  onChange={(e) => updateAssetItem(index, { description: e.target.value })}
                  placeholder="Asset description"
                />
              </div>
            </div>

            {(item.type === 'image' || item.type === 'video' || item.type === 'document' || item.type === 'template' || item.type === 'text' || item.type === 'archive') && (
              <div>
                <Label>File Upload</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept={getAcceptedFileTypes(item.type)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, index);
                    }}
                    disabled={uploadingItems.has(index)}
                  />
                  {item.url && (
                    <div className="text-sm text-emerald-600">✓ Uploaded</div>
                  )}
                </div>
                {item.url && item.type === 'image' && (
                  <img src={item.url} alt="Preview" className="mt-2 max-w-xs h-32 object-cover rounded" />
                )}
                {item.original_filename && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.original_filename} 
                    {item.file_size && ` (${(item.file_size / 1024 / 1024).toFixed(2)} MB)`}
                  </div>
                )}
              </div>
            )}

            {item.type === 'embed' && (
              <div>
                <Label>Embed URL</Label>
                <Input
                  value={item.url}
                  onChange={(e) => updateAssetItem(index, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {uploadingItems.has(index) && (
              <div className="text-sm text-primary">Uploading...</div>
            )}
          </CardContent>
        </Card>
      ))}

      {value.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No assets yet. Click "Add {supportedTypes[0]}" to get started.
        </div>
      )}
    </div>
  );
};