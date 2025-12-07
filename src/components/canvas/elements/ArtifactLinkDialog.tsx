import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectArtifacts } from '@/hooks/useProjectArtifacts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Link2, 
  FileUp, 
  ExternalLink, 
  LayoutGrid, 
  ListTodo, 
  BookOpen, 
  User, 
  Heart, 
  Route, 
  Hexagon,
  FileText,
  Check,
  Upload,
  Loader2
} from 'lucide-react';
import type { ArtifactLinkData } from './ArtifactLinkHexiElement';

interface ArtifactLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ArtifactLinkData;
  projectId?: string;
  onSave: (data: ArtifactLinkData) => void;
}

const ARTIFACT_TYPES = [
  { value: 'bmc', label: 'Business Model Canvas', icon: LayoutGrid },
  { value: 'product-backlog', label: 'Product Backlog', icon: ListTodo },
  { value: 'user-story-canvas', label: 'User Story Canvas', icon: BookOpen },
  { value: 'user-persona', label: 'User Persona', icon: User },
  { value: 'empathy-map', label: 'Empathy Map', icon: Heart },
  { value: 'journey-map', label: 'Journey Map', icon: Route },
  { value: 'project-model', label: 'Project Model', icon: Hexagon },
];

export const ArtifactLinkDialog: React.FC<ArtifactLinkDialogProps> = ({
  isOpen,
  onClose,
  data,
  projectId,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<string>('artifact');
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(data.linkedArtifactId || null);
  const [externalUrl, setExternalUrl] = useState(data.externalUrl || '');
  const [externalLabel, setExternalLabel] = useState(data.label || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const { data: artifacts, isLoading: artifactsLoading } = useProjectArtifacts(projectId);

  useEffect(() => {
    if (isOpen) {
      setSelectedArtifact(data.linkedArtifactId || null);
      setExternalUrl(data.externalUrl || '');
      setExternalLabel(data.label !== 'Link...' ? data.label : '');
      setUploadedFile(data.fileUrl ? { url: data.fileUrl, name: data.fileName || 'File', type: data.fileType || '' } : null);
      
      // Set initial tab based on current link type
      if (data.linkType === 'file') setActiveTab('file');
      else if (data.linkType === 'external') setActiveTab('external');
      else setActiveTab('artifact');
    }
  }, [isOpen, data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = projectId ? `projects/${projectId}/${fileName}` : `general/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);

      setUploadedFile({
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 'artifact' && selectedArtifact) {
      const artifact = artifacts?.find(a => a.id === selectedArtifact);
      if (artifact) {
        onSave({
          ...data,
          linkType: 'artifact',
          linkedArtifactId: artifact.id,
          artifactType: artifact.artifact_type,
          artifactName: artifact.name,
          label: artifact.name,
          color: '#3B82F6',
        });
      }
    } else if (activeTab === 'file' && uploadedFile) {
      onSave({
        ...data,
        linkType: 'file',
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        label: externalLabel || uploadedFile.name,
        color: '#10B981',
      });
    } else if (activeTab === 'external' && externalUrl) {
      onSave({
        ...data,
        linkType: 'external',
        externalUrl: externalUrl,
        label: externalLabel || new URL(externalUrl).hostname,
        color: '#8B5CF6',
      });
    }
    onClose();
  };

  const isValid = () => {
    if (activeTab === 'artifact') return !!selectedArtifact;
    if (activeTab === 'file') return !!uploadedFile;
    if (activeTab === 'external') {
      try {
        new URL(externalUrl);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link to Resource</DialogTitle>
          <DialogDescription>
            Connect this hexi to an artifact, file, or external URL
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="artifact" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Artifact
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artifact" className="flex-1 mt-4">
            {!projectId ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Save this canvas to a project to link artifacts.</p>
              </div>
            ) : artifactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : artifacts && artifacts.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {artifacts.map((artifact) => {
                    const typeInfo = ARTIFACT_TYPES.find(t => t.value === artifact.artifact_type);
                    const Icon = typeInfo?.icon || FileText;
                    const isSelected = selectedArtifact === artifact.id;
                    
                    return (
                      <button
                        key={artifact.id}
                        onClick={() => setSelectedArtifact(artifact.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artifact.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {typeInfo?.label || artifact.artifact_type}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No artifacts found in this project.</p>
                <p className="text-sm mt-1">Create artifacts first, then link them here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Upload a file</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {uploadedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 mx-auto text-green-500" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, images, and more</p>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg"
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file-label">Display Label (optional)</Label>
              <Input
                id="file-label"
                value={externalLabel}
                onChange={(e) => setExternalLabel(e.target.value)}
                placeholder={uploadedFile?.name || 'Enter a label...'}
              />
            </div>
          </TabsContent>

          <TabsContent value="external" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">External URL</Label>
              <Input
                id="url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url-label">Display Label (optional)</Label>
              <Input
                id="url-label"
                value={externalLabel}
                onChange={(e) => setExternalLabel(e.target.value)}
                placeholder="Enter a label..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid()}>
            Link Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
