import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAssetMutations } from '@/hooks/useUnifiedAssetManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, X } from 'lucide-react';

interface UnifiedTemplateAssetUploadProps {
  onSuccess?: () => void;
  knowledgeItemId?: string;
}

interface UploadFormData {
  title: string;
  description: string;
  templateCategory: string;
  templateVersion: string;
  tags: string[];
}

export const UnifiedTemplateAssetUpload: React.FC<UnifiedTemplateAssetUploadProps> = ({
  onSuccess,
  knowledgeItemId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    templateCategory: '',
    templateVersion: '1.0',
    tags: []
  });
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const { createAsset } = useUnifiedAssetMutations();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.includes('pdf')) {
        toast.error('Please select a PDF file');
        return;
      }

      // Validate file size (20MB limit)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }

      setFile(selectedFile);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: selectedFile.name.replace('.pdf', '')
        }));
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/templates/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      // Create asset record
      await createAsset.mutateAsync({
        type: 'document',
        title: formData.title,
        description: formData.description,
        url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        original_filename: file.name,
        is_template: true,
        template_category: formData.templateCategory,
        template_version: formData.templateVersion,
        is_public: true,
        usage_count: 0
      });

      // If associated with a knowledge item, create the relationship
      if (knowledgeItemId) {
        // This would need to be handled by the parent component
        // or we could add a separate mutation for template associations
      }

      // Reset form
      setFile(null);
      setFormData({
        title: '',
        description: '',
        templateCategory: '',
        templateVersion: '1.0',
        tags: []
      });

      toast.success('Template uploaded successfully');
      onSuccess?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Template
        </CardTitle>
        <CardDescription>
          Upload a PDF template that will be available for use across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="file">PDF File *</Label>
            <div className="mt-1">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {file && (
                <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {Math.round(file.size / 1024)} KB
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter template title"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Template Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.templateCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, templateCategory: e.target.value }))}
              placeholder="e.g., Business Model Canvas, Workshop Template"
              disabled={uploading}
            />
          </div>

          {/* Version */}
          <div>
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.templateVersion}
              onChange={(e) => setFormData(prev => ({ ...prev, templateVersion: e.target.value }))}
              placeholder="1.0"
              disabled={uploading}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim() || uploading}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || !formData.title.trim() || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Template
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};