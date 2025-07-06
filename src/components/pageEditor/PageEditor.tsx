import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageById } from '@/hooks/usePages';
import { usePageMutations } from '@/hooks/usePageMutations';
import { useContentBlockMutations } from '@/hooks/useContentBlockMutations';
import { ContentBlock, ContentBlockCreate, ContentBlockUpdate } from '@/types/page';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { ContentBlockEditor } from './ContentBlockEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Save, Eye, Settings } from 'lucide-react';

export const PageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePageById(id || '');
  const { updatePage } = usePageMutations();
  const { createContentBlock, updateContentBlock, deleteContentBlock, reorderContentBlocks } = useContentBlockMutations();

  const [isEditingPage, setIsEditingPage] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [pageForm, setPageForm] = useState({
    title: '',
    description: '',
    slug: '',
    is_published: false,
  });

  React.useEffect(() => {
    if (page) {
      setPageForm({
        title: page.title,
        description: page.description || '',
        slug: page.slug,
        is_published: page.is_published,
      });
    }
  }, [page]);

  const handleSavePage = () => {
    if (!page) return;
    
    updatePage.mutate({
      id: page.id,
      ...pageForm,
    });
    setIsEditingPage(false);
  };

  const handleAddBlock = () => {
    setEditingBlock(null);
    setIsBlockEditorOpen(true);
  };

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setIsBlockEditorOpen(true);
  };

  const handleSaveBlock = (blockData: Partial<ContentBlock>) => {
    if (!page) return;

    if (editingBlock) {
      // Update existing block
      updateContentBlock.mutate({
        id: editingBlock.id,
        ...blockData,
      });
    } else {
      // Create new block
      const maxPosition = Math.max(0, ...page.content_blocks.map(b => b.position));
      createContentBlock.mutate({
        page_id: page.id,
        position: maxPosition + 1,
        ...blockData,
      } as ContentBlockCreate);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    deleteContentBlock.mutate(blockId);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!page) return;

    const blocks = [...page.content_blocks].sort((a, b) => a.position - b.position);
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    
    if (blockIndex === -1) return;
    if (direction === 'up' && blockIndex === 0) return;
    if (direction === 'down' && blockIndex === blocks.length - 1) return;

    const swapIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    // Swap positions
    const updates = [
      { id: blocks[blockIndex].id, position: blocks[swapIndex].position },
      { id: blocks[swapIndex].id, position: blocks[blockIndex].position },
    ];

    reorderContentBlocks.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <Button onClick={() => navigate('/admin/pages')}>
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Page Editor</h1>
          <p className="text-muted-foreground">/{page.slug}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {isPreview ? 'Edit Mode' : 'Preview'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsEditingPage(!isEditingPage)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Page Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Page Settings */}
          {isEditingPage && (
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
                    onChange={(e) => setPageForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="page-slug">URL Slug</Label>
                  <Input
                    id="page-slug"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="page-description">Description</Label>
                  <Textarea
                    id="page-description"
                    value={pageForm.description}
                    onChange={(e) => setPageForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={pageForm.is_published}
                    onCheckedChange={(checked) => 
                      setPageForm(prev => ({ ...prev, is_published: checked }))
                    }
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSavePage} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Page
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingPage(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Blocks */}
          <div className="space-y-4">
            {page.content_blocks
              .filter(block => block.is_visible || !isPreview)
              .sort((a, b) => a.position - b.position)
              .map((block) => (
                <ContentBlockRenderer
                  key={block.id}
                  block={block}
                  isEditing={!isPreview}
                  onEdit={handleEditBlock}
                  onDelete={handleDeleteBlock}
                  onMoveUp={(id) => handleMoveBlock(id, 'up')}
                  onMoveDown={(id) => handleMoveBlock(id, 'down')}
                />
              ))}
            
            {page.content_blocks.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-muted-foreground mb-4">No content blocks yet</p>
                <Button onClick={handleAddBlock} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Block
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {!isPreview && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleAddBlock}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Block
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Blocks:</strong> {page.content_blocks.length}
                </div>
                <div>
                  <strong>Published:</strong> {page.is_published ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Last Updated:</strong> {new Date(page.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Block Editor Dialog */}
      <ContentBlockEditor
        block={editingBlock}
        isOpen={isBlockEditorOpen}
        onClose={() => setIsBlockEditorOpen(false)}
        onSave={handleSaveBlock}
      />
    </div>
  );
};