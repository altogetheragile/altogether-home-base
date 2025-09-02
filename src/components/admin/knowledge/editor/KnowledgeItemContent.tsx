import { BookOpen, FileText, Link as LinkIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
            <Textarea
              id="background"
              value={formData.background}
              onChange={(e) => onFormChange('background', e.target.value)}
              placeholder="Provide detailed background information, context, and explanations..."
              rows={8}
              className="min-h-[200px] resize-y"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Support for Markdown formatting</span>
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

      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <LinkIcon className="h-4 w-4" />
            Future Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-blue-700 font-medium text-sm">Coming Soon</span>
            <span className="text-blue-700 font-medium text-sm">Rich Text Editor</span>
            <span className="text-blue-700 font-medium text-sm">Media Upload</span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Advanced content editing features including WYSIWYG editor, image uploads, 
            embedded videos, and interactive elements will be available in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};