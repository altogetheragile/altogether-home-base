import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Eye, Star } from 'lucide-react';

interface KnowledgeItemBasicInfoProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  onNameChange: (name: string) => void;
}

export const KnowledgeItemBasicInfo = ({
  formData,
  onFormChange,
  onNameChange
}: KnowledgeItemBasicInfoProps) => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-5 w-5" />
          Basic Information
        </h3>
        <p className="text-sm text-muted-foreground">
          Set the core details for this knowledge item
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Details</CardTitle>
          <CardDescription>
            The name and slug will be used for navigation and SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter the knowledge item name"
            />
            <p className="text-xs text-muted-foreground">
              A clear, descriptive name for this knowledge item
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/knowledge/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onFormChange('slug', e.target.value)}
                placeholder="url-friendly-slug"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated from name, but you can customize it
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              placeholder="Brief description of this knowledge item"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              A short summary that appears in search results and listings
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Details</CardTitle>
          <CardDescription>
            Optional information about the source and background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => onFormChange('source', e.target.value)}
              placeholder="Book, website, author, etc."
            />
            <p className="text-xs text-muted-foreground">
              Where this knowledge comes from (optional)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publication Settings</CardTitle>
          <CardDescription>
            Control visibility and promotion of this item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="published">Published</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Make this item visible to the public
              </p>
            </div>
            <Switch
              id="published"
              checked={formData.is_published}
              onCheckedChange={(checked) => onFormChange('is_published', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Highlight this item in featured sections
              </p>
            </div>
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => onFormChange('is_featured', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};