import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAdminBlogPost, useBlogPostMutations } from '@/hooks/useAdminBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { ImageUpload } from '@/components/ui/image-upload';

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface FormData {
  title: string;
  slug: string;
  category_id: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  is_featured: boolean;
  estimated_reading_time: number;
  seo_title: string;
  seo_description: string;
}

const defaultFormData: FormData = {
  title: '',
  slug: '',
  category_id: '',
  excerpt: '',
  content: '',
  featured_image_url: '',
  is_featured: false,
  estimated_reading_time: 5,
  seo_title: '',
  seo_description: '',
};

const AdminBlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';

  const { data: post, isLoading } = useAdminBlogPost(isEdit ? id : '');
  const { data: categories } = useBlogCategories();
  const { createPost, updatePost, deletePost } = useBlogPostMutations();

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const slugManuallyEdited = useRef(false);

  useEffect(() => {
    if (post && isEdit) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        category_id: post.category_id || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image_url: post.featured_image_url || '',
        is_featured: post.is_featured || false,
        estimated_reading_time: post.estimated_reading_time || 5,
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
      });
      slugManuallyEdited.current = true;
    }
  }, [post, isEdit]);

  const handleChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'title' && !slugManuallyEdited.current) {
        updated.slug = generateSlug(value as string);
      }

      return updated;
    });
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true;
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleSave = async (publish: boolean) => {
    const payload = {
      ...formData,
      category_id: formData.category_id || null,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    };

    if (isEdit) {
      await updatePost.mutateAsync({ id, data: payload });
    } else {
      await createPost.mutateAsync(payload);
    }
    navigate('/admin/blog');
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    await deletePost.mutateAsync(id);
    navigate('/admin/blog');
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading post...</div>
      </div>
    );
  }

  const isSaving = createPost.isPending || updatePost.isPending;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {formData.slug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || !formData.title || !formData.slug}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || !formData.title || !formData.slug}
          >
            {isSaving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Post title"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="post-slug"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  /blog/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Write your blog post content here..."
                  rows={20}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(val) => handleChange('category_id', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Featured Image</Label>
                <ImageUpload
                  value={formData.featured_image_url}
                  onChange={(url) => handleChange('featured_image_url', url)}
                  bucket="assets"
                  path="blog/"
                  maxSize={5}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    handleChange('is_featured', checked === true)
                  }
                />
                <Label htmlFor="is_featured">Featured Post</Label>
              </div>

              <div>
                <Label htmlFor="reading_time">Estimated Reading Time (min)</Label>
                <Input
                  id="reading_time"
                  type="number"
                  min={1}
                  value={formData.estimated_reading_time}
                  onChange={(e) =>
                    handleChange('estimated_reading_time', parseInt(e.target.value) || 1)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="SEO title"
                />
              </div>

              <div>
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder="SEO description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogPost;
