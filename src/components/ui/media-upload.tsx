import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Trash2, Upload, Image, Video, FileText, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface MediaItem {
  id?: string;
  type: 'image' | 'video' | 'document' | 'embed';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  position: number;
}

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  bucketName?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  value = [],
  onChange,
  bucketName = 'knowledge-base'
}) => {
  const [uploadingItems, setUploadingItems] = useState<Set<number>>(new Set());
  const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'embed'>('image');

  const handleFileUpload = async (file: File, index: number) => {
    try {
      setUploadingItems(prev => new Set([...prev, index]));

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const updatedMedia = [...value];
      updatedMedia[index] = {
        ...updatedMedia[index],
        url: publicUrl
      };

      onChange(updatedMedia);
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
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

  const addMediaItem = () => {
    const newItem: MediaItem = {
      type: newMediaType,
      title: '',
      description: '',
      url: '',
      position: value.length
    };

    onChange([...value, newItem]);
  };

  const updateMediaItem = (index: number, updates: Partial<MediaItem>) => {
    const updatedMedia = [...value];
    updatedMedia[index] = { ...updatedMedia[index], ...updates };
    onChange(updatedMedia);
  };

  const removeMediaItem = (index: number) => {
    const updatedMedia = value.filter((_, i) => i !== index);
    // Update positions
    const reindexedMedia = updatedMedia.map((item, i) => ({ ...item, position: i }));
    onChange(reindexedMedia);
  };

  const moveMediaItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return;
    }

    const updatedMedia = [...value];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedMedia[index], updatedMedia[swapIndex]] = [updatedMedia[swapIndex], updatedMedia[index]];
    
    // Update positions
    updatedMedia[index].position = index;
    updatedMedia[swapIndex].position = swapIndex;
    
    onChange(updatedMedia);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'embed': return <ExternalLink className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={newMediaType} onValueChange={(value: 'image' | 'video' | 'embed') => setNewMediaType(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="embed">Embed</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={addMediaItem} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {newMediaType}
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
                  onClick={() => moveMediaItem(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveMediaItem(index, 'down')}
                  disabled={index === value.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMediaItem(index)}
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
                  onChange={(e) => updateMediaItem(index, { title: e.target.value })}
                  placeholder="Media title"
                />
              </div>
              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description || ''}
                  onChange={(e) => updateMediaItem(index, { description: e.target.value })}
                  placeholder="Media description"
                />
              </div>
            </div>

            {item.type === 'image' && (
              <div>
                <Label>Image Upload</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, index);
                    }}
                    disabled={uploadingItems.has(index)}
                  />
                  {item.url && (
                    <div className="text-sm text-green-600">✓ Uploaded</div>
                  )}
                </div>
                {item.url && (
                  <img src={item.url} alt="Preview" className="mt-2 max-w-xs h-32 object-cover rounded" />
                )}
              </div>
            )}

            {item.type === 'video' && (
              <div>
                <Label>Video</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, index);
                    }}
                    disabled={uploadingItems.has(index)}
                    placeholder="Upload video file"
                  />
                  <Input
                    value={item.url}
                    onChange={(e) => updateMediaItem(index, { url: e.target.value })}
                    placeholder="Or paste YouTube/video URL"
                  />
                  {item.url && item.url.includes('youtube') && (
                    <div className="text-sm text-green-600">✓ YouTube URL detected</div>
                  )}
                </div>
              </div>
            )}

            {item.type === 'embed' && (
              <div>
                <Label>Embed URL</Label>
                <Input
                  value={item.url}
                  onChange={(e) => updateMediaItem(index, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {uploadingItems.has(index) && (
              <div className="text-sm text-blue-600">Uploading...</div>
            )}
          </CardContent>
        </Card>
      ))}

      {value.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No media items yet. Click "Add image/video/embed" to get started.
        </div>
      )}
    </div>
  );
};