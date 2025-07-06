import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

interface PageSettingsProps {
  isVisible: boolean;
  pageForm: {
    title: string;
    description: string;
    slug: string;
    is_published: boolean;
  };
  onFormChange: (field: string, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PageSettings: React.FC<PageSettingsProps> = ({
  isVisible,
  pageForm,
  onFormChange,
  onSave,
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Page Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="page-title">Page Title</Label>
          <Input
            id="page-title"
            value={pageForm.title}
            onChange={(e) => onFormChange('title', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="page-slug">URL Slug</Label>
          <Input
            id="page-slug"
            value={pageForm.slug}
            onChange={(e) => onFormChange('slug', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="page-description">Description</Label>
          <Textarea
            id="page-description"
            value={pageForm.description}
            onChange={(e) => onFormChange('description', e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={pageForm.is_published}
            onCheckedChange={(checked) => onFormChange('is_published', checked)}
          />
          <Label htmlFor="published">Published</Label>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Page
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};