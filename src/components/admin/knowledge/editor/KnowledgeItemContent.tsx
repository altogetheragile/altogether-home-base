import { BookOpen, FileText, Image } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { MediaUpload } from '@/components/ui/media-upload';

interface KnowledgeItemContentProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export const KnowledgeItemContent = ({
  formData,
  onFormChange
}: KnowledgeItemContentProps) => {
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
            Media Gallery
          </CardTitle>
          <CardDescription>
            Upload and manage images, videos, documents, and embedded content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaUpload
            value={formData.mediaItems || []}
            onChange={(mediaItems) => onFormChange('mediaItems', mediaItems)}
            bucketName="knowledge-base"
          />
        </CardContent>
      </Card>
    </div>
  );
};