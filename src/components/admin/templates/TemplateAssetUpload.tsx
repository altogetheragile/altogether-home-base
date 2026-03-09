import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useKnowledgeTemplateMutations } from '@/hooks/useKnowledgeTemplateMutations';
import { useAssociateTemplate } from '@/hooks/useKnowledgeItemTemplates';
import { useCheckExistingTemplate, useGetNextVersion } from '@/hooks/useTemplateVersioning';
import { VersionConflictDialog } from './VersionConflictDialog';
import { KnowledgeItemSelector } from './KnowledgeItemSelector';
import {
  type UploadFileType,
  getAcceptedFileTypes,
  getMaxFileSize,
  detectUploadFileType,
  toTemplateType,
  toFileFormat,
} from './templateUploadUtils';
import type { KnowledgeTemplateFormData } from '@/types/template';

/** Fields that the upload form appends on top of KnowledgeTemplateFormData. */
interface CreateTemplatePayload extends KnowledgeTemplateFormData {
  version: string;
  replaceExisting: boolean;
  existingId?: string;
}

interface TemplateAssetUploadProps {
  onSuccess?: () => void;
}

export const TemplateAssetUpload = ({ onSuccess }: TemplateAssetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [templateType, setTemplateType] = useState<UploadFileType>('pdf');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    knowledgeItemIds: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [versionConflictOpen, setVersionConflictOpen] = useState(false);
  const [customVersion, setCustomVersion] = useState('');
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    uploadedUrl: string;
    publicUrl: string;
  } | null>(null);

  const { createTemplate } = useKnowledgeTemplateMutations();
  const associateTemplate = useAssociateTemplate();

  // Version checking hooks
  const { data: existingTemplate } = useCheckExistingTemplate(formData.title);
  const { data: suggestedVersion } = useGetNextVersion(formData.title);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Auto-detect template type based on file extension
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
      const detected = detectUploadFileType(fileExt);
      if (detected) {
        setTemplateType(detected);
      }

      // Validate file size based on type
      const maxSize = getMaxFileSize(templateType);
      if (selectedFile.size > maxSize * 1024 * 1024) {
        toast.error(`File size must be less than ${maxSize}MB for ${templateType} files`);
        return;
      }

      setFile(selectedFile);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: selectedFile.name.replace(/\.[^/.]+$/, '') // Remove extension
        }));
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // --- Knowledge item selector callbacks ---
  const handleKnowledgeItemToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      knowledgeItemIds: prev.knowledgeItemIds.includes(id)
        ? prev.knowledgeItemIds.filter(kiId => kiId !== id)
        : [...prev.knowledgeItemIds, id]
    }));
  };

  const handleKnowledgeItemRemove = (id: string) => {
    setFormData(prev => ({
      ...prev,
      knowledgeItemIds: prev.knowledgeItemIds.filter(kiId => kiId !== id)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    if (formData.knowledgeItemIds.length === 0) {
      toast.error('Please select at least one knowledge item');
      return;
    }

    // Check for existing template with same title BEFORE uploading
    if (existingTemplate) {
      setCustomVersion(suggestedVersion || '1.1');
      setVersionConflictOpen(true);
      return;
    }

    // No conflict, proceed with normal upload
    await performUpload('1.0', false);
  };

  const performUpload = async (version: string, replaceExisting: boolean) => {
    setUploading(true);

    try {
      let publicUrl: string;

      if (pendingUpload) {
        // Use already uploaded file
        publicUrl = pendingUpload.publicUrl;
      } else {
        // Upload new file
        const fileExt = file!.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        // Use knowledge-base bucket for all template types
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, file!, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(uploadData.path);

        publicUrl = newPublicUrl;
      }

      // Build the base payload with properly typed fields
      const baseTemplateData: CreateTemplatePayload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        template_type: toTemplateType(templateType),
        file_format: toFileFormat(templateType),
        is_public: true,
        tags: formData.tags.length > 0 ? formData.tags : [],
        version: version.trim(),
        replaceExisting,
        existingId: replaceExisting ? existingTemplate?.id : undefined,
      };

      // Add type-specific file fields
      let templateData: CreateTemplatePayload;
      if (templateType === 'pdf') {
        templateData = {
          ...baseTemplateData,
          pdf_url: publicUrl,
          pdf_filename: file!.name,
          pdf_file_size: Math.round(file!.size),
        };
      } else {
        templateData = {
          ...baseTemplateData,
          file_url: publicUrl,
          file_filename: file!.name,
          file_size: Math.round(file!.size),
        };
      }

      const template = await createTemplate.mutateAsync(templateData);

      // Associate with knowledge items (only for new templates)
      if (!replaceExisting && formData.knowledgeItemIds.length > 0) {
        try {
          const associationPromises = formData.knowledgeItemIds.map((knowledgeItemId, index) =>
            associateTemplate.mutateAsync({
              knowledgeItemId,
              templateId: template.id,
              displayOrder: index
            })
          );

          await Promise.all(associationPromises);
        } catch (_associationError) {
          // Don't fail the entire upload for association errors
        }
      }

      completeUpload();

    } catch (error) {
      // Clean up uploaded file if template creation failed
      if (pendingUpload) {
        supabase.storage
          .from('knowledge-base')
          .remove([pendingUpload.uploadedUrl])
          .catch(() => {});
      }

      const errorMessage = error instanceof Error ? error.message : "Failed to upload template";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const completeUpload = () => {
    toast.success("Template uploaded successfully!");
    // Reset form
    setFile(null);
    setTemplateType('pdf');
    setFormData({
      title: '',
      description: '',
      tags: [],
      knowledgeItemIds: [],
    });
    setTagInput('');
    setCustomVersion('');
    setPendingUpload(null);
    setVersionConflictOpen(false);
    onSuccess?.();
  };

  const handleVersionConflictReplace = async () => {
    if (!customVersion.trim()) {
      toast.error('Please enter a version number');
      return;
    }
    await performUpload(customVersion.trim(), true);
  };

  const handleVersionConflictNewVersion = async () => {
    if (!customVersion.trim()) {
      toast.error('Please enter a version number');
      return;
    }
    await performUpload(customVersion.trim(), false);
  };

  const handleVersionConflictCancel = () => {
    // Clean up uploaded file if exists
    if (pendingUpload) {
      supabase.storage
        .from('knowledge-base')
        .remove([pendingUpload.uploadedUrl])
        .catch(() => {});
    }

    setPendingUpload(null);
    setVersionConflictOpen(false);
    setUploading(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Template
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Type Selection */}
          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select value={templateType} onValueChange={(value: UploadFileType) => setTemplateType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="document">Office Document (DOCX, PPTX, XLSX)</SelectItem>
                <SelectItem value="image">Image (PNG, JPG, SVG)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Max file size: {getMaxFileSize(templateType)}MB
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Template File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {file ? (
                <div className="flex items-center justify-between bg-muted p-3 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your {templateType} file here, or click to select
                  </p>
                  <Input
                    id="file"
                    type="file"
                    accept={getAcceptedFileTypes(templateType)}
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Knowledge Item Selection */}
          <KnowledgeItemSelector
            selectedIds={formData.knowledgeItemIds}
            onToggle={handleKnowledgeItemToggle}
            onRemove={handleKnowledgeItemRemove}
          />

          {/* Template Details */}
          <div className="space-y-2">
            <Label htmlFor="title">Template Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter template title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for and how to use it"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
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

          <Button
            type="submit"
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Upload Template
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <VersionConflictDialog
        open={versionConflictOpen}
        onOpenChange={setVersionConflictOpen}
        existingTemplate={existingTemplate ? { title: existingTemplate.title, version: existingTemplate.version ?? '' } : null}
        suggestedVersion={suggestedVersion || '1.1'}
        customVersion={customVersion}
        onCustomVersionChange={setCustomVersion}
        onReplace={handleVersionConflictReplace}
        onCreateNew={handleVersionConflictNewVersion}
        onCancel={handleVersionConflictCancel}
      />
    </Card>
  );
};
