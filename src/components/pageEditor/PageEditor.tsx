import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageById } from '@/hooks/usePages';
import { usePageMutations } from '@/hooks/usePageMutations';
import { useContentBlockMutations } from '@/hooks/useContentBlockMutations';
import { ContentBlock, ContentBlockCreate } from '@/types/page';
import { ContentBlockEditor } from './ContentBlockEditor';
import { PageHeader } from './PageHeader';
import { PageSettings } from './PageSettings';
import { ContentBlocksList } from './ContentBlocksList';
import { PageSidebar } from './PageSidebar';

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
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
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

  const handlePageFormChange = (field: string, value: string | boolean) => {
    setPageForm(prev => ({ ...prev, [field]: value }));
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
      
      // Ensure required fields are present
      if (!blockData.type) {
        console.error('Block type is required');
        return;
      }
      
      createContentBlock.mutate({
        page_id: page.id,
        type: blockData.type,
        content: blockData.content || {},
        position: maxPosition + 1,
        is_visible: blockData.is_visible !== false,
      });
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
        <button onClick={() => navigate('/admin/pages')}>
          Back to Pages
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <PageHeader
        pageSlug={page.slug}
        isPreview={isPreview}
        deviceView={deviceView}
        onPreviewToggle={() => setIsPreview(!isPreview)}
        onDeviceViewChange={setDeviceView}
        onSettingsToggle={() => setIsEditingPage(!isEditingPage)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <PageSettings
            isVisible={isEditingPage}
            pageForm={pageForm}
            onFormChange={handlePageFormChange}
            onSave={handleSavePage}
            onCancel={() => setIsEditingPage(false)}
          />

          <ContentBlocksList
            contentBlocks={page.content_blocks}
            isPreview={isPreview}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            onAddBlock={handleAddBlock}
          />
        </div>

        {/* Sidebar */}
        <PageSidebar
          isVisible={!isPreview}
          pageInfo={{
            contentBlocksCount: page.content_blocks.length,
            isPublished: page.is_published,
            lastUpdated: new Date(page.updated_at).toLocaleDateString(),
          }}
          onAddBlock={handleAddBlock}
        />
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