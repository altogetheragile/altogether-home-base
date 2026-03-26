import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Eye, Trash2, Settings, X, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminBlogPost, useBlogPostMutations } from '@/hooks/useAdminBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { ImagePicker } from '@/components/ui/image-picker';
import { HtmlEditor } from '@/components/ui/html-editor';

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

/* ─── Accordion Section ─── */
const AccordionSection = ({
  title, defaultOpen = false, children,
}: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) => (
  <Collapsible defaultOpen={defaultOpen} className="border-b border-border">
    <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold tracking-wide hover:bg-muted/50 transition-colors">
      {title}
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="px-4 pb-4 space-y-3">
        {children}
      </div>
    </CollapsibleContent>
  </Collapsible>
);

/* ─── Main Component ─── */
const AdminBlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';

  const { data: post, isLoading } = useAdminBlogPost(isEdit ? id : '');
  const { data: categories } = useBlogCategories();
  const { createPost, updatePost, deletePost } = useBlogPostMutations();

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const slugManuallyEdited = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
    // Show autosave indicator
    setSaveStatus('saving');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 800);
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true;
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleSave = async (publish: boolean) => {
    setSaveStatus('saving');
    const payload = {
      ...formData,
      category_id: formData.category_id || undefined,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : undefined,
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

  const isPublished = isEdit && post?.is_published;
  const isSaving = createPost.isPending || updatePost.isPending;

  // Word/reading stats
  const wordCount = useMemo(() => {
    const text = formData.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
    return words;
  }, [formData.content]);

  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const categoryName = useMemo(() => {
    if (!formData.category_id || !categories) return null;
    return categories.find((c) => c.id === formData.category_id)?.name;
  }, [formData.category_id, categories]);

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ── Top bar ── */}
      <div className="flex h-[52px] flex-shrink-0 items-center gap-3 border-b bg-background px-5">
        <Link
          to="/admin/blog"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Blog
        </Link>
        <div className="h-5 w-px bg-border" />
        <span className="text-sm text-muted-foreground truncate max-w-[280px]">
          {formData.title || <em className="text-muted-foreground/60">Untitled</em>}
        </span>

        <div className="flex-1" />

        {/* Autosave */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className={`h-1.5 w-1.5 rounded-full ${
            saveStatus === 'saving' ? 'bg-orange-400 animate-pulse' :
            saveStatus === 'saved' ? 'bg-green-500' : 'bg-muted-foreground/30'
          }`} />
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
        </div>

        {/* Status badge */}
        <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[11px]">
          {isPublished ? 'Published' : 'Draft'}
        </Badge>

        {/* Actions */}
        {formData.slug && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`/blog/${formData.slug}?preview=true`, '_blank')}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleSave(false)} disabled={isSaving || !formData.title || !formData.slug}>
          {isSaving ? 'Saving...' : 'Save draft'}
        </Button>
        <Button size="sm" className="h-8 text-xs bg-[#E8702A] hover:bg-[#d4651f] text-white" onClick={() => handleSave(true)} disabled={isSaving || !formData.title || !formData.slug}>
          {isSaving ? 'Publishing...' : 'Publish'}
        </Button>
        <Button
          variant="ghost" size="icon"
          className={`h-8 w-8 ${settingsOpen ? 'bg-[#FDF0E8] text-[#E8702A]' : 'text-muted-foreground'}`}
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="Post settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Canvas ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-6 py-12">
            {/* Title */}
            <textarea
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Post title..."
              rows={1}
              className="w-full resize-none border-none bg-transparent text-[32px] font-bold leading-tight tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              style={{ fontFamily: 'Georgia, serif' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
            />

            {/* Slug */}
            <div className="mt-2 mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>altogetheragile.com/blog/</span>
              <span className="text-[#0F6E56] cursor-pointer hover:underline" onClick={() => {
                if (!settingsOpen) setSettingsOpen(true);
              }}>
                {formData.slug || 'your-slug'}
              </span>
              <button
                onClick={() => {
                  const newSlug = prompt('Edit slug:', formData.slug);
                  if (newSlug !== null) handleSlugChange(newSlug);
                }}
                className="rounded border border-border bg-transparent px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
              >
                edit
              </button>
            </div>

            {/* Excerpt */}
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Add a short excerpt..."
              rows={2}
              className="w-full resize-none border-none bg-transparent text-[17px] italic leading-relaxed text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              style={{ fontFamily: 'Georgia, serif' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
            />

            {/* Divider */}
            <div className="my-6 h-px bg-border" />

            {/* Body editor */}
            <HtmlEditor
              value={formData.content}
              onChange={(val) => handleChange('content', val)}
              placeholder="Write your blog post content here..."
            />
          </div>
        </div>

        {/* ── Settings panel ── */}
        {settingsOpen && (
          <div className="w-[300px] min-w-[300px] flex-shrink-0 border-l bg-background overflow-y-auto flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
              <span className="text-sm font-medium">Post settings</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setSettingsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Post details */}
            <AccordionSection title="Post details" defaultOpen>
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</Label>
                <Select value={formData.category_id} onValueChange={(val) => handleChange('category_id', val)}>
                  <SelectTrigger className="mt-1 h-8 text-sm bg-muted/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Reading time (min)</Label>
                <Input
                  type="number" min={1}
                  value={formData.estimated_reading_time}
                  onChange={(e) => handleChange('estimated_reading_time', parseInt(e.target.value) || 1)}
                  className="mt-1 h-8 text-sm bg-muted/50"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Auto-calculated: ~{readingTime} min. Override if needed.</p>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Featured post</span>
                <Checkbox
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleChange('is_featured', checked === true)}
                />
              </div>
            </AccordionSection>

            {/* Featured image */}
            <AccordionSection title="Featured image" defaultOpen>
              <ImagePicker
                value={formData.featured_image_url}
                onChange={(url) => handleChange('featured_image_url', url)}
                bucket="assets"
                path="blog/"
                maxSize={10}
                aspect={16 / 9}
              />
              <p className="text-[11px] text-muted-foreground">Recommended 1200 x 628 px</p>
            </AccordionSection>

            {/* SEO */}
            <AccordionSection title="SEO">
              {/* Score bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((formData.seo_title ? 25 : 0) + (formData.seo_description ? 25 : 0) + (formData.excerpt ? 25 : 0) + (formData.featured_image_url ? 25 : 0)))}%`,
                      backgroundColor: (formData.seo_title && formData.seo_description) ? '#639922' : '#E8702A',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold" style={{ color: (formData.seo_title && formData.seo_description) ? '#3B6D11' : '#854F0B' }}>
                  {(formData.seo_title && formData.seo_description && formData.excerpt && formData.featured_image_url) ? 'Good' : 'Needs work'}
                </span>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">SEO title</Label>
                <Input
                  value={formData.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="SEO title"
                  className="mt-1 h-8 text-sm bg-muted/50"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {formData.seo_title.length} / 60
                </p>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Meta description</Label>
                <Textarea
                  value={formData.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder="Meta description"
                  rows={3}
                  className="mt-1 text-sm bg-muted/50 resize-vertical min-h-[72px]"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {formData.seo_description.length} / 155
                </p>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="mt-1 h-8 text-sm bg-muted/50"
                />
              </div>
            </AccordionSection>

            {/* Danger zone */}
            {isEdit && (
              <div className="mt-auto border-t p-4">
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Word count footer ── */}
      <div className="flex h-9 flex-shrink-0 items-center gap-5 border-t bg-background px-8 text-xs text-muted-foreground">
        <span>~{wordCount.toLocaleString()} words</span>
        <span>{readingTime} min read</span>
        {categoryName && <span>{categoryName}</span>}
        <div className="flex-1" />
        <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      {/* Delete dialog */}
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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogPost;
