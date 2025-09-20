import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useKnowledgeTemplateMutations } from '@/hooks/useKnowledgeTemplateMutations';
import { useAssociateTemplate } from '@/hooks/useKnowledgeItemTemplates';
import { useQuery } from '@tanstack/react-query';
import { useCheckExistingTemplate, useGetNextVersion } from '@/hooks/useTemplateVersioning';
import { VersionConflictDialog } from './VersionConflictDialog';

interface TemplateAssetUploadProps {
  onSuccess?: () => void;
}

export const TemplateAssetUpload = ({ onSuccess }: TemplateAssetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [templateType, setTemplateType] = useState<'pdf' | 'document' | 'image'>('pdf');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    knowledgeItemId: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [knowledgeItemOpen, setKnowledgeItemOpen] = useState(false);
  const [knowledgeItemSearch, setKnowledgeItemSearch] = useState('');
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

  const { data: knowledgeItems = [] } = useQuery({
    queryKey: ['knowledge-items-for-template-upload', knowledgeItemSearch],
    queryFn: async () => {
      console.log('🔍 Fetching Knowledge Items for template upload dialog...');
      let q = supabase
        .from('knowledge_items')
        .select('id, name, is_published')
        .order('name', { ascending: true })
        .limit(5000);

      if (knowledgeItemSearch && knowledgeItemSearch.length >= 2) {
        q = q.or(`name.ilike.%${knowledgeItemSearch}%`);
      }

      const { data, error } = await q;
      if (error) {
        console.error('❌ Error fetching Knowledge Items:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} Knowledge Items for dropdown`);
      return data || [];
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Auto-detect template type based on file extension
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExt === 'pdf') {
        setTemplateType('pdf');
      } else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fileExt || '')) {
        setTemplateType('image');
      } else if (['docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls'].includes(fileExt || '')) {
        setTemplateType('document');
      }

      // Validate file size based on type
      const maxSize = templateType === 'pdf' ? 50 : templateType === 'document' ? 25 : 10;
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

    if (!formData.knowledgeItemId) {
      toast.error('Please select a knowledge item');
      return;
    }

    // Check for existing template with same title BEFORE uploading
    if (existingTemplate) {
      console.log('⚠️ Version conflict detected:', existingTemplate);
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
      console.log('🚀 Starting template upload process...');
      console.log('📋 Upload parameters:', { version, replaceExisting, title: formData.title, type: templateType });
      
      let publicUrl: string;
      let uploadedPath: string;
      
      if (pendingUpload) {
        // Use already uploaded file
        publicUrl = pendingUpload.publicUrl;
        uploadedPath = pendingUpload.uploadedUrl;
        console.log('📁 Using pre-uploaded file:', uploadedPath);
      } else {
        // Upload new file
        const fileExt = file!.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        console.log(`📁 Uploading file to: ${filePath}`);
        
        // Use knowledge-base bucket for all template types
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, file!, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ File upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(uploadData.path);
          
        publicUrl = newPublicUrl;
        uploadedPath = uploadData.path;
      }

      console.log('✅ File ready:', publicUrl);

      // Prepare template data based on type
      const baseTemplateData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        template_type: templateType,
        is_public: true,
        tags: formData.tags.length > 0 ? formData.tags : [],
        version: version.trim(),
        replaceExisting,
        existingId: replaceExisting ? existingTemplate?.id : undefined,
      };

      // Add type-specific fields
      let templateData;
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
          // Add generic file fields for non-PDF templates
          file_url: publicUrl,
          file_filename: file!.name,
          file_size: Math.round(file!.size),
          file_type: file!.type,
        };
      }

      console.log('📝 Creating template record with data:', {
        ...templateData,
        file_size: `${file!.size} bytes`,
        tags_count: templateData.tags.length
      });

      const template = await createTemplate.mutateAsync(templateData);
      console.log('✅ Template created successfully:', template);
      
      // Associate with knowledge item (only for new templates)
      if (!replaceExisting && formData.knowledgeItemId) {
        console.log(`🔗 Associating template ${template.id} with knowledge item ${formData.knowledgeItemId}`);
        
        try {
          await associateTemplate.mutateAsync({
            knowledgeItemId: formData.knowledgeItemId,
            templateId: template.id,
            displayOrder: 0
          });
          
          console.log('✅ Template associated with knowledge item successfully');
        } catch (associationError) {
          console.warn('⚠️ Failed to associate template with knowledge item:', associationError);
          // Don't fail the entire upload for association errors
        }
      }

      completeUpload();

    } catch (error) {
      console.error('❌ Upload process error:', error);
      
      // Clean up uploaded file if template creation failed
      if (pendingUpload) {
        console.log('🗑️ Cleaning up uploaded file due to error...');
        supabase.storage
          .from('knowledge-base')
          .remove([pendingUpload.uploadedUrl])
          .catch(console.error);
      }
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Failed to upload template";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const completeUpload = () => {
    toast.success("Template uploaded successfully!");
    console.log('🎉 Upload process completed successfully');
    
    // Reset form
    setFile(null);
    setTemplateType('pdf');
    setFormData({
      title: '',
      description: '',
      tags: [],
      knowledgeItemId: '',
    });
    setTagInput('');
    setKnowledgeItemSearch('');
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
        .catch(console.error);
    }
    
    setPendingUpload(null);
    setVersionConflictOpen(false);
    setUploading(false);
  };

  const getAcceptedFileTypes = () => {
    switch (templateType) {
      case 'pdf': return '.pdf';
      case 'image': return '.png,.jpg,.jpeg,.webp,.svg';
      case 'document': return '.docx,.pptx,.xlsx,.doc,.ppt,.xls';
      default: return '*/*';
    }
  };

  const getMaxFileSize = () => {
    switch (templateType) {
      case 'pdf': return 50;
      case 'document': return 25;
      case 'image': return 10;
      default: return 50;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Type Selection */}
          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select value={templateType} onValueChange={(value: 'pdf' | 'document' | 'image') => setTemplateType(value)}>
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
              Max file size: {getMaxFileSize()}MB
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
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Knowledge Item Selection */}
          <div className="space-y-2">
            <Label>Knowledge Item *</Label>
            <Popover open={knowledgeItemOpen} onOpenChange={setKnowledgeItemOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={knowledgeItemOpen}
                  className="w-full justify-between"
                >
                  {formData.knowledgeItemId
                    ? knowledgeItems.find((item) => item.id === formData.knowledgeItemId)?.name
                    : "Select knowledge item to link template to"}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-50 w-[var(--radix-popover-trigger-width)] p-0 bg-popover border shadow-lg">
                <Command className="max-h-80">
                  <CommandInput
                    placeholder="Search knowledge items..."
                    value={knowledgeItemSearch}
                    onValueChange={setKnowledgeItemSearch}
                    autoFocus
                  />
                  <CommandList className="max-h-64 overflow-y-auto">
                    <CommandEmpty>No knowledge item found.</CommandEmpty>
                    <CommandGroup>
                      {knowledgeItems
                        ?.filter((item) => 
                          item.name.toLowerCase().includes(knowledgeItemSearch.toLowerCase())
                        )
                        ?.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, knowledgeItemId: item.id }));
                              setKnowledgeItemOpen(false);
                              setKnowledgeItemSearch('');
                            }}
                          >
                            {item.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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
        existingTemplate={existingTemplate}
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