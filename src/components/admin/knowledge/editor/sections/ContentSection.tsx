import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { BookOpen, FileText, Image, GripVertical, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { MediaLibrary } from '@/components/ui/media-library';
import { useKnowledgeItemMedia, useKnowledgeItemMediaMutations } from '@/hooks/useMediaAssets';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ContentSectionProps {
  knowledgeItemId?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ knowledgeItemId }) => {
  const form = useFormContext<KnowledgeItemFormData>();
  const { data: knowledgeItemMedia = [], refetch } = useKnowledgeItemMedia(knowledgeItemId);
  const { updateKnowledgeItemMedia } = useKnowledgeItemMediaMutations();
  const [orderedMedia, setOrderedMedia] = useState(knowledgeItemMedia);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    setOrderedMedia(knowledgeItemMedia);
  }, [knowledgeItemMedia]);

  const selectedMediaIds = orderedMedia.map(media => media.id);

  const handleMediaSelectionChange = async (mediaIds: string[]) => {
    if (!knowledgeItemId) {
      return;
    }

    try {
      await updateKnowledgeItemMedia.mutateAsync({
        knowledgeItemId,
        mediaAssetIds: mediaIds
      });
      refetch();
    } catch (error) {
      console.error('Failed to update media:', error);
    }
  };

  const handleMediaUploaded = async (mediaAssetId: string) => {
    if (!knowledgeItemId) return;
    
    const newMediaIds = [...selectedMediaIds, mediaAssetId];
    await handleMediaSelectionChange(newMediaIds);
    
    toast({
      title: "Success",
      description: "Media uploaded and linked to this Knowledge Item",
    });
  };

  const handleRemoveMedia = async (mediaId: string) => {
    const newMediaIds = orderedMedia.filter(m => m.id !== mediaId).map(m => m.id);
    await handleMediaSelectionChange(newMediaIds);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedMedia];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    setOrderedMedia(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    const newMediaIds = orderedMedia.map(m => m.id);
    await handleMediaSelectionChange(newMediaIds);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Rich Content
        </h3>
        <p className="text-sm text-muted-foreground">
          Add detailed content, background information, and context
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Background & Context
          </CardTitle>
          <CardDescription>
            Provide detailed background information and context for this knowledge item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="background"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background Information</FormLabel>
                <FormControl>
                  <RichTextEditor
                    content={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Provide detailed background information, context, and explanations..."
                  />
                </FormControl>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Rich text editor with formatting options</span>
                  <span>{field.value?.length || 0} characters</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Guidelines</CardTitle>
          <CardDescription>
            Best practices for creating effective knowledge content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Structure</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use clear headings and sections</li>
                <li>• Keep paragraphs concise</li>
                <li>• Include practical examples</li>
                <li>• Add relevant context</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Quality</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Cite credible sources</li>
                <li>• Keep information up-to-date</li>
                <li>• Use clear, simple language</li>
                <li>• Include actionable insights</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media Library
          </CardTitle>
          <CardDescription>
            Browse and select media from the shared library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!knowledgeItemId && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Please save this Knowledge Item first before selecting media to associate with it.
            </div>
          )}

          {knowledgeItemId && orderedMedia.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Media (Drag to reorder)</h4>
              <div className="space-y-2">
                {orderedMedia.map((media, index) => (
                  <div
                    key={media.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 p-2 border rounded-lg bg-card hover:bg-accent/50 cursor-move"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {media.thumbnail_url || media.type === 'image' ? (
                      <img 
                        src={media.thumbnail_url || media.url} 
                        alt={media.title || 'Media'}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {media.title || media.original_filename || 'Untitled'}
                      </p>
                      {media.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {media.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMedia(media.id)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MediaLibrary
            selectedMediaIds={selectedMediaIds}
            onSelectionChange={handleMediaSelectionChange}
            multiSelect={true}
            bucketName="knowledge-base"
            knowledgeItemId={knowledgeItemId}
            onMediaUploaded={handleMediaUploaded}
          />
        </CardContent>
      </Card>
    </div>
  );
};