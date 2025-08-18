import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type MediaItem } from '@/components/ui/media-upload';
import SimpleForm from '@/components/admin/SimpleForm';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';

interface TechniqueFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingTechnique: any;
}

const TechniqueFormDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingTechnique 
}: TechniqueFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('TechniqueFormDialog opened with:', { editingTechnique, isOpen });
    }
  }, [isOpen, editingTechnique]);

  // Prepare existing media for editing
  const existingMedia: MediaItem[] = editingTechnique?.knowledge_media?.map((media: any, index: number) => ({
    id: media.id,
    type: media.type,
    title: media.title,
    description: media.description,
    url: media.url,
    thumbnail_url: media.thumbnail_url,
    position: index
  })) || [];

  // Prepare existing tags for editing
  const existingTags = editingTechnique?.knowledge_tags?.map((tagInfo: any) => tagInfo.knowledge_tags.id) || [];

  const formFields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'slug', label: 'Slug', type: 'text' as const, required: true, placeholder: 'unique-slug-for-url' },
    { 
      key: 'category_id', 
      label: 'Category', 
      type: 'select' as const, 
      options: categories?.map(cat => ({ value: cat.id, label: cat.name })) || [],
      placeholder: 'Select a category'
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'multiselect' as const,
      options: tags?.map(tag => ({ value: tag.id, label: tag.name })) || [],
      placeholder: 'Select tags',
      existingValues: existingTags
    },
    { key: 'description', label: 'Description', type: 'textarea' as const },
    { key: 'purpose', label: 'Purpose', type: 'textarea' as const },
    { key: 'originator', label: 'Originator', type: 'text' as const },
    { key: 'media', label: 'Media Gallery (Images & Videos)', type: 'media' as const },
  ];

  const handleSubmit = async (formData: any) => {
    console.log('TechniqueFormDialog handleSubmit called with:', formData);
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('TechniqueFormDialog submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('TechniqueFormDialog cancel clicked');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTechnique ? 'Edit Technique' : 'Create New Technique'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isSubmitting && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Saving...</span>
            </div>
          )}
          
          <SimpleForm
            title=""
            onSubmit={handleSubmit}
            editingItem={editingTechnique}
            onCancel={handleCancel}
            fields={formFields}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechniqueFormDialog;