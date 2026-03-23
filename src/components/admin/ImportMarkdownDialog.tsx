import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogPostMutations } from '@/hooks/useAdminBlogPosts';
import { toast } from 'sonner';
import matter from 'gray-matter';
import { marked } from 'marked';

// ─── Post styles (same as import script) ─────────────────────────────────────

const POST_STYLES = `<style>
.post-body { max-width: 680px; font-size: 18px; line-height: 1.7; }
.post-body p { margin: 0 0 1.4rem; }
.post-body h2 { font-size: 24px; font-weight: 600; margin: 2.5rem 0 1rem; line-height: 1.3; }
.post-body h3 { font-size: 19px; font-weight: 600; margin: 2rem 0 .75rem; line-height: 1.35; }
.post-body a { color: inherit; text-decoration: underline; text-decoration-color: rgba(0,0,0,0.3); }
.post-body a:hover { text-decoration-color: inherit; }
.post-body em { font-style: italic; }
.post-body strong { font-weight: 600; }
.post-body hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 2.5rem 0; }
.post-body .byline { font-size: 15px; opacity: 0.6; margin-bottom: 2rem; }
.post-body .bio { font-size: 15px; opacity: 0.65; margin-top: 2.5rem; }
.post-body figure { margin: 2rem 0; }
.post-body figure img { max-width: 100%; height: auto; border-radius: 8px; }
.post-body figcaption { font-size: 14px; color: rgba(0,0,0,0.5); margin-top: 0.5rem; line-height: 1.5; font-style: italic; }
.post-body .references { font-size: 15px; line-height: 1.6; }
.post-body .references p { margin: 0 0 0.75rem; }
.post-body .references a { word-break: break-word; }
.post-body .callout {
  background: #f5fdf9; border-left: 3px solid #1D9E75;
  border-radius: 0 8px 8px 0; padding: 1rem 1.25rem;
  margin: 1.75rem 0; font-size: 17px; line-height: 1.65;
}
.post-body .tip-box {
  background: #f8f9fa; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px; padding: 1.25rem 1.5rem;
  margin: 1.75rem 0; font-size: 17px; line-height: 1.65;
}
.post-body .tip-box p { margin: 0 0 0.75rem; }
.post-body .tip-box p:last-child { margin: 0; }
@media (prefers-color-scheme: dark) {
  .post-body a { text-decoration-color: rgba(255,255,255,0.3); }
  .post-body figcaption { color: rgba(255,255,255,0.5); }
  .callout { background: #0d2e24; border-left-color: #1D9E75; }
  .tip-box { background: #1a1a1a; border-color: rgba(255,255,255,0.08); }
}
</style>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeSlug(slug: string) {
  return slug.replace(/^\/blog\//, '').replace(/^\//, '').replace(/\/$/, '');
}

function estimateReadingTime(text: string) {
  const words = text.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function convertFootnotes(markdown: string) {
  return markdown.replace(/\[\^(\d+)\]/g, '<sup>$1</sup>');
}

function convertMarkdownToHtml(mdContent: string, author: string, imageUrlMap: Map<string, string>) {
  let processed = convertFootnotes(mdContent);

  // Replace local image paths with uploaded URLs
  for (const [localPath, publicUrl] of imageUrlMap) {
    const escaped = localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processed = processed.replace(new RegExp(escaped, 'g'), publicUrl);
  }

  // Custom renderer for images → <figure> with <figcaption>
  const renderer = new marked.Renderer();
  renderer.image = function ({ href, text }: { href: string; title?: string | null; text: string }) {
    if (text) {
      return `<figure>\n  <img src="${href}" alt="${text}" />\n  <figcaption>${text}</figcaption>\n</figure>`;
    }
    return `<img src="${href}" alt="" />`;
  };

  let htmlBody = marked.parse(processed, { renderer }) as string;

  // Handle image + italic caption: <figure>...</figure>\n<p><em>caption</em></p>
  htmlBody = htmlBody.replace(
    /<figure>\s*<img ([^>]+)\/>\s*<figcaption>([^<]+)<\/figcaption>\s*<\/figure>\s*<p><em>([^<]+)<\/em><\/p>/g,
    '<figure>\n  <img $1/>\n  <figcaption>$3</figcaption>\n</figure>'
  );
  htmlBody = htmlBody.replace(
    /<p><img\s+([^>]+)\/?\s*><\/p>\s*<p><em>([^<]+)<\/em><\/p>/g,
    '<figure>\n  <img $1/>\n  <figcaption>$2</figcaption>\n</figure>'
  );

  // Styled references section
  htmlBody = htmlBody.replace(
    /(<h2[^>]*>References<\/h2>)([\s\S]*?)(?=<hr|$)/,
    (_, heading: string, body: string) => `${heading}\n<div class="references">${body}</div>`
  );

  const byline = `<p class="byline">By ${author}, AltogetherAgile</p>`;
  return `${POST_STYLES}\n\n<div class="post-body">\n\n${byline}\n\n${htmlBody}\n\n</div>`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ImportState {
  step: 'select' | 'preview' | 'importing' | 'done';
  mdFile: File | null;
  imageFiles: File[];
  frontmatter: Record<string, unknown> | null;
  mdContent: string;
  error: string | null;
}

export const ImportMarkdownDialog = () => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ImportState>({
    step: 'select',
    mdFile: null,
    imageFiles: [],
    frontmatter: null,
    mdContent: '',
    error: null,
  });
  const mdInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { createPost } = useBlogPostMutations();

  const reset = () => {
    setState({
      step: 'select',
      mdFile: null,
      imageFiles: [],
      frontmatter: null,
      mdContent: '',
      error: null,
    });
  };

  const handleMdSelect = async (file: File) => {
    try {
      const text = await file.text();
      const { data: fm, content } = matter(text);
      setState(prev => ({
        ...prev,
        mdFile: file,
        frontmatter: fm,
        mdContent: content,
        step: 'preview',
        error: null,
      }));
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to parse markdown file' }));
    }
  };

  const handleImport = async () => {
    if (!state.frontmatter || !user) return;

    setState(prev => ({ ...prev, step: 'importing', error: null }));

    try {
      const fm = state.frontmatter;
      const imageUrlMap = new Map<string, string>();

      // Upload images
      for (const imgFile of state.imageFiles) {
        const ext = imgFile.name.split('.').pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        };
        const storagePath = `blog/${Date.now()}-${imgFile.name}`;

        const { error: uploadErr } = await supabase.storage
          .from('assets')
          .upload(storagePath, imgFile, {
            contentType: mimeMap[ext || ''] || 'application/octet-stream',
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload failed for ${imgFile.name}:`, uploadErr);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(storagePath);

        imageUrlMap.set(imgFile.name, publicUrl);
      }

      // Convert markdown to styled HTML
      const author = (fm.author as string) || 'Alun Davies-Baker';
      const htmlContent = convertMarkdownToHtml(state.mdContent, author, imageUrlMap);

      // Get OG image URL
      let ogImageUrl = '';
      if (fm.og_image && imageUrlMap.has(fm.og_image as string)) {
        ogImageUrl = imageUrlMap.get(fm.og_image as string) || '';
      }

      // Build excerpt
      const excerpt = (fm.excerpt as string) || (fm.meta_description as string) ||
        state.mdContent.split('\n\n').find(p => p && !p.startsWith('#') && !p.startsWith('---'))?.slice(0, 300) || '';

      const slug = normalizeSlug((fm.slug as string) || '');
      const readingTime = (fm.estimated_reading_time as number) || estimateReadingTime(state.mdContent);

      await createPost.mutateAsync({
        title: fm.title as string,
        slug,
        content: htmlContent,
        excerpt,
        seo_title: (fm.meta_title || fm.seo_title || fm.title) as string,
        seo_description: (fm.meta_description || fm.seo_description || excerpt) as string,
        featured_image_url: ogImageUrl,
        estimated_reading_time: readingTime,
        is_published: false,
      });

      setState(prev => ({ ...prev, step: 'done' }));
      toast.success(`"${fm.title}" imported as draft`);

      // Navigate to blog list after a moment
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1500);
    } catch (err) {
      setState(prev => ({
        ...prev,
        step: 'preview',
        error: err instanceof Error ? err.message : 'Import failed',
      }));
    }
  };

  const fm = state.frontmatter;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Markdown
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Blog Post from Markdown</DialogTitle>
          <DialogDescription>
            Select a markdown file with YAML frontmatter and any images it references.
          </DialogDescription>
        </DialogHeader>

        {state.error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {state.error}
          </div>
        )}

        {/* Step 1: Select files */}
        {(state.step === 'select' || state.step === 'preview') && (
          <div className="space-y-4">
            {/* Markdown file */}
            <div>
              <Label>Markdown file (.md)</Label>
              <input
                ref={mdInputRef}
                type="file"
                accept=".md,.markdown"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMdSelect(file);
                }}
              />
              <div
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  state.mdFile ? 'border-green-300 bg-green-50' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => mdInputRef.current?.click()}
              >
                {state.mdFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">{state.mdFile.name}</span>
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p className="text-sm">Click to select markdown file</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image files */}
            <div>
              <Label>Images (optional — select all images referenced in the post)</Label>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setState(prev => ({ ...prev, imageFiles: files }));
                }}
              />
              <div
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  state.imageFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => imgInputRef.current?.click()}
              >
                {state.imageFiles.length > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <ImageIcon className="h-5 w-5" />
                    <span className="font-medium">{state.imageFiles.length} image{state.imageFiles.length !== 1 ? 's' : ''} selected</span>
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p className="text-sm">Click to select images</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {fm && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-base">{fm.title as string}</h4>
                <p className="text-muted-foreground">Slug: /blog/{normalizeSlug((fm.slug as string) || '')}</p>
                {fm.meta_description ? (
                  <p className="text-muted-foreground line-clamp-2">{String(fm.meta_description)}</p>
                ) : null}
                {fm.keywords ? (
                  <p className="text-muted-foreground text-xs">Keywords: {String(fm.keywords)}</p>
                ) : null}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!state.mdFile || !fm}
              >
                Import as Draft
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Importing */}
        {state.step === 'importing' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Uploading images and creating post...
            </p>
          </div>
        )}

        {/* Step 3: Done */}
        {state.step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Post imported as draft</p>
            <p className="text-sm text-muted-foreground">
              Preview it and publish when ready.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
