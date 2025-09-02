import React from 'react';
import { BookOpen, FileText, Image } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { MediaLibrary } from '@/components/ui/media-library';
import { useKnowledgeItemMedia, useKnowledgeItemMediaMutations } from '@/hooks/useMediaAssets';

interface KnowledgeItemContentProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemContent = ({
  formData,
  onFormChange
}: KnowledgeItemContentProps) => {
  const { data: knowledgeItemMedia = [] } = useKnowledgeItemMedia(formData?.id);
  const { updateKnowledgeItemMedia } = useKnowledgeItemMediaMutations();

  const selectedMediaIds = knowledgeItemMedia.map(media => media.id);

  const handleMediaSelectionChange = async (mediaIds: string[]) => {
    if (formData?.id) {
      try {
        await updateKnowledgeItemMedia.mutateAsync({
          knowledgeItemId: formData.id,
          mediaAssetIds: mediaIds
        });
      } catch (error) {
        console.error('Failed to update media:', error);
      }
    }
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
          <div className="space-y-2">
            <Label htmlFor="background">Background Information</Label>
            <RichTextEditor
              content={formData.background || ''}
              onChange={(content) => onFormChange('background', content)}
              placeholder="Provide detailed background information, context, and explanations..."
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rich text editor with formatting options</span>
              <span>{formData.background?.length || 0} characters</span>
            </div>
          </div>
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
            Click on media items below to associate or disassociate them with this knowledge item. 
            Selected items will show with a blue border and checkmark.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData?.id ? (
            <>
              {selectedMediaIds.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedMediaIds.length}</strong> media item{selectedMediaIds.length !== 1 ? 's' : ''} currently associated with this knowledge item
                  </p>
                </div>
              )}
              <MediaLibrary
                selectedMediaIds={selectedMediaIds}
                onSelectionChange={handleMediaSelectionChange}
                multiSelect={true}
                bucketName="knowledge-base"
              />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Save this knowledge item first to associate media</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};