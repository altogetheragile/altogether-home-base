import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUnifiedAssets, useUnifiedAssetMutations } from '@/hooks/useUnifiedAssetManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Link, 
  Archive,
  Search,
  Filter,
  Grid,
  List,
  Trash2,
  Edit,
  Download,
  Eye,
  X,
  Plus
} from 'lucide-react';

export interface UnifiedAssetLibraryProps {
  selectedAssetIds?: string[];
  onSelectionChange?: (assetIds: string[]) => void;
  multiSelect?: boolean;
  bucketName?: string;
  supportedTypes?: ('image' | 'video' | 'document' | 'embed' | 'archive')[];
  maxFileSize?: number;
  showTemplatesOnly?: boolean;
  showFilters?: boolean;
  viewMode?: 'grid' | 'list';
}

interface UploadFormData {
  title: string;
  description: string;
  url: string;
  templateCategory?: string;
  templateVersion?: string;
  isTemplate?: boolean;
}

export const UnifiedAssetLibrary: React.FC<UnifiedAssetLibraryProps> = ({
  selectedAssetIds = [],
  onSelectionChange,
  multiSelect = true,
  bucketName = 'assets',
  supportedTypes = ['image', 'video', 'document', 'embed', 'archive'],
  maxFileSize = 20 * 1024 * 1024, // 20MB
  showTemplatesOnly = false,
  showFilters = true,
  viewMode: initialViewMode = 'grid'
}) => {
  const [newAssetType, setNewAssetType] = useState<string>('image');
  const [uploadFormData, setUploadFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    url: '',
    templateCategory: '',
    templateVersion: '1.0',
    isTemplate: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [isUploading, setIsUploading] = useState(false);

  const { data: mediaAssets, isLoading } = useUnifiedAssets({ 
    templatesOnly: showTemplatesOnly 
  });
  const { createAsset, deleteAsset } = useUnifiedAssetMutations();

  // Filter assets based on search, type, and template status
  const filteredAssets = mediaAssets?.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    
    const matchesTemplate = templateFilter === 'all' || 
      (templateFilter === 'templates' && asset.is_template) ||
      (templateFilter === 'media' && !asset.is_template);
    
    const matchesShowTemplatesOnly = !showTemplatesOnly || asset.is_template;
    
    return matchesSearch && matchesType && matchesTemplate && matchesShowTemplatesOnly;
  }) || [];

  const toggleSelection = (assetId: string) => {
    if (!onSelectionChange) return;
    
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
      case 'document': return <FileText className="h-4 w-4" />;
      case 'embed': return <Link className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAcceptedFileTypes = (type: string) => {
    switch (type) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'document': return '.pdf,.doc,.docx,.txt,.rtf';
      case 'archive': return '.zip,.rar,.7z,.tar,.gz';
      default: return '*/*';
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > maxFileSize) {
      toast.error(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      await createAsset.mutateAsync({
        type: newAssetType as any,
        title: uploadFormData.title || file.name,
        description: uploadFormData.description,
        url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        original_filename: file.name,
        is_template: uploadFormData.isTemplate || false,
        template_category: uploadFormData.templateCategory,
        template_version: uploadFormData.templateVersion || '1.0'
      });

      // Reset form
      setUploadFormData({
        title: '',
        description: '',
        url: '',
        templateCategory: '',
        templateVersion: '1.0',
        isTemplate: false
      });
      
      toast.success("Asset uploaded successfully");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFromUrl = async () => {
    if (!uploadFormData.url || !uploadFormData.title) {
      toast.error("Please provide both URL and title");
      return;
    }

    try {
      await createAsset.mutateAsync({
        type: newAssetType as any,
        title: uploadFormData.title,
        description: uploadFormData.description,
        url: uploadFormData.url,
        is_template: uploadFormData.isTemplate || false,
        template_category: uploadFormData.templateCategory,
        template_version: uploadFormData.templateVersion || '1.0'
      });

      // Reset form
      setUploadFormData({
        title: '',
        description: '',
        url: '',
        templateCategory: '',
        templateVersion: '1.0',
        isTemplate: false
      });
      
      toast.success("Asset created successfully");
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error instanceof Error ? error.message : "Creation failed");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAsset.mutateAsync(assetId);
      toast.success("Asset deleted successfully");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading assets...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Asset Library</CardTitle>
            <CardDescription>
              Manage all your assets including images, documents, templates, and more
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="w-full">
          <TabsList>
            <TabsTrigger value="browse">Browse Assets</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {showFilters && (
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="embed">Embeds</SelectItem>
                    <SelectItem value="archive">Archives</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    <SelectItem value="templates">Templates Only</SelectItem>
                    <SelectItem value="media">Media Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-2"
            }>
              {filteredAssets.map((asset) => (
                <Card 
                  key={asset.id} 
                  className={`cursor-pointer transition-all ${
                    selectedAssetIds.includes(asset.id) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => toggleSelection(asset.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{asset.title || 'Untitled'}</h4>
                            {asset.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {asset.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {asset.is_template && (
                              <Badge variant="secondary" className="text-xs">
                                Template
                              </Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{asset.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAsset(asset.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {asset.type}
                            </Badge>
                            {asset.is_template && asset.template_version && (
                              <Badge variant="outline" className="text-xs">
                                v{asset.template_version}
                              </Badge>
                            )}
                          </div>
                          {asset.file_size && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(asset.file_size / 1024)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assets found matching your criteria
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select value={newAssetType} onValueChange={setNewAssetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter asset title"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter asset description"
                  rows={3}
                />
              </div>

              {/* Template-specific fields */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTemplate"
                  checked={uploadFormData.isTemplate}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
                />
                <Label htmlFor="isTemplate">This is a template</Label>
              </div>

              {uploadFormData.isTemplate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateCategory">Template Category</Label>
                    <Input
                      id="templateCategory"
                      value={uploadFormData.templateCategory}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, templateCategory: e.target.value }))}
                      placeholder="e.g., Business Model Canvas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateVersion">Version</Label>
                    <Input
                      id="templateVersion"
                      value={uploadFormData.templateVersion}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, templateVersion: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>
                </div>
              )}

              {newAssetType === 'embed' ? (
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={uploadFormData.url}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/embed"
                  />
                  <Button 
                    onClick={handleCreateFromUrl} 
                    disabled={isUploading || !uploadFormData.url || !uploadFormData.title}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Asset from URL
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="file-upload">Upload File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept={getAcceptedFileTypes(newAssetType)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {onSelectionChange && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedAssetIds.length} asset{selectedAssetIds.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};