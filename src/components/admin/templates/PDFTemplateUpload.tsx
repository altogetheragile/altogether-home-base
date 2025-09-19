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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useKnowledgeTemplateMutations } from '@/hooks/useKnowledgeTemplateMutations';
import { useAssociateTemplate } from '@/hooks/useKnowledgeItemTemplates';
import { useQuery } from '@tanstack/react-query';
import { useCheckExistingTemplate, useGetNextVersion } from '@/hooks/useTemplateVersioning';
import { VersionConflictDialog } from './VersionConflictDialog';

interface PDFTemplateUploadProps {
  onSuccess?: () => void;
}

export const PDFTemplateUpload = ({ onSuccess }: PDFTemplateUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    queryKey: ['knowledge-items-for-upload', knowledgeItemSearch],
    queryFn: async () => {
      console.log('🔍 Fetching Knowledge Items for upload dialog...');
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
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File size must be less than 50MB');
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
      toast.error('Please select a PDF file');
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

    // Check for existing template with same title
    if (existingTemplate) {
      // Set suggested version and show conflict dialog
      setCustomVersion(suggestedVersion || '1.1');
      
      // Store upload details for later
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pdf-templates')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('pdf-templates')
          .getPublicUrl(uploadData.path);

        setPendingUpload({
          file,
          uploadedUrl: uploadData.path,
          publicUrl
        });
        
        setVersionConflictOpen(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload file");
      } finally {
        setUploading(false);
      }
      return;
    }

    // No conflict, proceed with normal upload
    await performUpload('1.0', false);
  };

  const performUpload = async (version: string, replaceExisting: boolean) => {
    setUploading(true);

    try {
      console.log('🚀 Starting PDF template upload process...');
      
      let publicUrl: string;
      let uploadedPath: string;
      
      if (pendingUpload) {
        // Use already uploaded file
        publicUrl = pendingUpload.publicUrl;
        uploadedPath = pendingUpload.uploadedUrl;
      } else {
        // Upload new file
        const fileExt = file!.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        console.log(`📁 Uploading file to: ${filePath}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pdf-templates')
          .upload(filePath, file!, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('pdf-templates')
          .getPublicUrl(uploadData.path);
          
        publicUrl = newPublicUrl;
        uploadedPath = uploadData.path;
      }

      console.log('✅ File ready:', publicUrl);

      // Create template record
      const templateData = {
        title: formData.title,
        description: formData.description,
        template_type: 'pdf' as const,
        is_public: true,
        pdf_url: publicUrl,
        pdf_filename: file!.name,
        pdf_file_size: file!.size,
        tags: formData.tags,
        version,
        replaceExisting,
        existingId: replaceExisting ? existingTemplate?.id : undefined,
      };

      console.log('📝 Creating template record with data:', templateData);

      const template = await createTemplate.mutateAsync(templateData);
      console.log('✅ Template created successfully:', template);
      
      // Associate with knowledge item (only for new templates)
      if (!replaceExisting) {
        console.log(`🔗 Associating template ${template.id} with knowledge item ${formData.knowledgeItemId}`);
        
        await associateTemplate.mutateAsync({
          knowledgeItemId: formData.knowledgeItemId,
          templateId: template.id,
          displayOrder: 0
        });
        
        console.log('✅ Template associated with knowledge item successfully');
      }

      completeUpload();

    } catch (error) {
      console.error('❌ Upload process error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload PDF template");
    } finally {
      setUploading(false);
    }
  };

  const completeUpload = () => {
    toast.success("PDF template uploaded successfully!");
    
    // Reset form
    setFile(null);
    setFormData({
      title: '',
      description: '',
      tags: [],
      knowledgeItemId: '',
    });
    setTagInput('');
    setKnowledgeItemSearch('');
    setPendingUpload(null);
    setVersionConflictOpen(false);
    onSuccess?.();
  };

  const handleVersionConflictReplace = () => {
    performUpload(customVersion, true);
  };

  const handleVersionConflictNewVersion = () => {
    performUpload(customVersion, false);
  };

  const handleVersionConflictCancel = () => {
    // Clean up uploaded file if exists
    if (pendingUpload) {
      supabase.storage
        .from('pdf-templates')
        .remove([pendingUpload.uploadedUrl])
        .catch(console.error);
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
          Upload PDF Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file">PDF File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {file ? (
                <div className="flex items-center justify-between bg-muted p-3 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-red-500" />
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
                    Drag and drop your PDF file here, or click to select
                  </p>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
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
                  <CommandList
                    className="max-h-64 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <CommandEmpty>No knowledge item found.</CommandEmpty>
                    <CommandGroup>
                      {(() => {
                        const filteredItems = knowledgeItems
                          ?.filter((item) => 
                            item.name.toLowerCase().includes(knowledgeItemSearch.toLowerCase())
                          );
                        console.log(`📋 Displaying ${filteredItems?.length || 0} filtered Knowledge Items in dropdown`);
                        return filteredItems?.map((item) => (
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
                        ));
                      })()}
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