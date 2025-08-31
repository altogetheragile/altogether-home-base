import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type MediaItem } from '@/components/ui/media-upload';
import SimpleForm from '@/components/admin/SimpleForm';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { useActivityFocus } from '@/hooks/useActivityFocus';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useActivityCategories } from '@/hooks/useActivityCategories';

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
  const [activeTab, setActiveTab] = useState('basic');
  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();
  const { data: activityFocus } = useActivityFocus();
  const { data: activityDomains } = useActivityDomains();
  const { data: activityCategories } = useActivityCategories();

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

  // Define all form field sets organized by tabs
  const basicInfoFields = [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { key: 'slug', label: 'Slug', type: 'text' as const, required: true, placeholder: 'unique-slug-for-url' },
    { key: 'summary', label: 'Summary', type: 'textarea' as const, placeholder: 'Brief overview of this technique' },
    { key: 'description', label: 'Description', type: 'textarea' as const },
    { key: 'purpose', label: 'Purpose', type: 'textarea' as const },
    { key: 'background', label: 'Background', type: 'textarea' as const },
    { key: 'originator', label: 'Originator', type: 'text' as const },
    { key: 'source', label: 'Source', type: 'text' as const },
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
    {
      key: 'content_type',
      label: 'Content Type',
      type: 'select' as const,
      options: [
        { value: 'technique', label: 'Technique' },
        { value: 'framework', label: 'Framework' },
        { value: 'method', label: 'Method' },
        { value: 'tool', label: 'Tool' }
      ]
    },
    {
      key: 'difficulty_level',
      label: 'Difficulty Level',
      type: 'select' as const,
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' }
      ]
    },
    { key: 'estimated_reading_time', label: 'Estimated Reading Time (minutes)', type: 'number' as const },
    { key: 'image_url', label: 'Featured Image URL', type: 'text' as const, placeholder: 'https://...' },
    { key: 'is_published', label: 'Published', type: 'checkbox' as const },
    { key: 'is_featured', label: 'Featured', type: 'checkbox' as const },
    { key: 'is_complete', label: 'Complete', type: 'checkbox' as const }
  ];

  const w5hFields = [
    // Generic Use Case
    { key: 'generic_who', label: 'Generic Use Case - Who', type: 'textarea' as const, placeholder: 'Who typically uses this technique?' },
    { key: 'generic_what', label: 'Generic Use Case - What', type: 'textarea' as const, placeholder: 'What is this technique about?' },
    { key: 'generic_when', label: 'Generic Use Case - When', type: 'textarea' as const, placeholder: 'When should this technique be used?' },
    { key: 'generic_where', label: 'Generic Use Case - Where', type: 'textarea' as const, placeholder: 'Where is this technique applicable?' },
    { key: 'generic_why', label: 'Generic Use Case - Why', type: 'textarea' as const, placeholder: 'Why use this technique?' },
    { key: 'generic_how', label: 'Generic Use Case - How', type: 'textarea' as const, placeholder: 'How is this technique executed?' },
    { key: 'generic_how_much', label: 'Generic Use Case - How Much', type: 'textarea' as const, placeholder: 'What resources/time needed?' },
    { key: 'generic_summary', label: 'Generic Summary', type: 'textarea' as const },
    
    // Example / Use Case
    { key: 'example_who', label: 'Example / Use Case - Who', type: 'textarea' as const, placeholder: 'Specific example of who uses this' },
    { key: 'example_what', label: 'Example / Use Case - What', type: 'textarea' as const, placeholder: 'Specific example scenario' },
    { key: 'example_when', label: 'Example / Use Case - When', type: 'textarea' as const, placeholder: 'Specific timing example' },
    { key: 'example_where', label: 'Example / Use Case - Where', type: 'textarea' as const, placeholder: 'Specific location/context example' },
    { key: 'example_why', label: 'Example / Use Case - Why', type: 'textarea' as const, placeholder: 'Specific reason example' },
    { key: 'example_how', label: 'Example / Use Case - How', type: 'textarea' as const, placeholder: 'Specific execution example' },
    { key: 'example_how_much', label: 'Example / Use Case - How Much', type: 'textarea' as const, placeholder: 'Specific resource example' },
    { key: 'example_use_case', label: 'Example Use Case', type: 'textarea' as const },
    { key: 'example_summary', label: 'Example / Use Case - Summary (Narrative Form)', type: 'textarea' as const }
  ];

  const implementationFields = [
    { key: 'planning_considerations', label: 'Planning Considerations', type: 'textarea' as const },
    { key: 'industry_context', label: 'Industry Context', type: 'textarea' as const },
    { key: 'focus_description', label: 'Focus Description', type: 'textarea' as const },
    { key: 'typical_participants', label: 'Typical Participants', type: 'array' as const, placeholder: 'Add participant role...' },
    { key: 'required_skills', label: 'Required Skills', type: 'array' as const, placeholder: 'Add required skill...' },
    { key: 'success_criteria', label: 'Success Criteria', type: 'array' as const, placeholder: 'Add success criterion...' },
    { key: 'common_pitfalls', label: 'Common Pitfalls', type: 'array' as const, placeholder: 'Add common pitfall...' },
    { key: 'related_practices', label: 'Related Practices', type: 'array' as const, placeholder: 'Add related practice...' },
    { key: 'team_size_min', label: 'Min Team Size', type: 'number' as const },
    { key: 'team_size_max', label: 'Max Team Size', type: 'number' as const },
    { key: 'duration_min_minutes', label: 'Min Duration (minutes)', type: 'number' as const },
    { key: 'duration_max_minutes', label: 'Max Duration (minutes)', type: 'number' as const }
  ];

  const classificationFields = [
    {
      key: 'activity_focus_id',
      label: 'Activity Focus',
      type: 'select' as const,
      options: activityFocus?.map(focus => ({ value: focus.id, label: focus.name })) || [],
      placeholder: 'Select activity focus'
    },
    {
      key: 'activity_domain_id',
      label: 'Activity Domain',
      type: 'select' as const,
      options: activityDomains?.map(domain => ({ value: domain.id, label: domain.name })) || [],
      placeholder: 'Select activity domain'
    },
    {
      key: 'activity_category_id',
      label: 'Activity Category',
      type: 'select' as const,
      options: activityCategories?.map(cat => ({ value: cat.id, label: cat.name })) || [],
      placeholder: 'Select activity category'
    }
  ];

  const seoMediaFields = [
    { key: 'seo_title', label: 'SEO Title', type: 'text' as const, placeholder: 'SEO optimized title' },
    { key: 'seo_description', label: 'SEO Description', type: 'textarea' as const, placeholder: 'Meta description for search engines' },
    { key: 'seo_keywords', label: 'SEO Keywords', type: 'array' as const, placeholder: 'Add keyword...' },
    { key: 'media', label: 'Media Gallery (Images & Videos)', type: 'media' as const }
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTechnique ? 'Edit Knowledge Item' : 'Create New Knowledge Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isSubmitting && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Saving...</span>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="w5h">Use Cases</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
              <TabsTrigger value="classification">Classification</TabsTrigger>
              <TabsTrigger value="seo">SEO & Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <SimpleForm
                title=""
                onSubmit={handleSubmit}
                editingItem={editingTechnique}
                onCancel={handleCancel}
                fields={basicInfoFields}
                showActions={false}
              />
            </TabsContent>

            <TabsContent value="w5h" className="mt-4">
              <SimpleForm
                title=""
                onSubmit={handleSubmit}
                editingItem={editingTechnique}
                onCancel={handleCancel}
                fields={w5hFields}
                showActions={false}
              />
            </TabsContent>

            <TabsContent value="implementation" className="mt-4">
              <SimpleForm
                title=""
                onSubmit={handleSubmit}
                editingItem={editingTechnique}
                onCancel={handleCancel}
                fields={implementationFields}
                showActions={false}
              />
            </TabsContent>

            <TabsContent value="classification" className="mt-4">
              <SimpleForm
                title=""
                onSubmit={handleSubmit}
                editingItem={editingTechnique}
                onCancel={handleCancel}
                fields={classificationFields}
                showActions={false}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <SimpleForm
                title=""
                onSubmit={handleSubmit}
                editingItem={editingTechnique}
                onCancel={handleCancel}
                fields={seoMediaFields}
                showActions={false}
              />
            </TabsContent>

            {/* Action buttons at the bottom */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Collect data from all forms and submit
                const allForms = document.querySelectorAll('form');
                const formData = new FormData();
                
                // This will trigger submission from the active form
                // We'll need to modify SimpleForm to handle this better
                handleSubmit({});
              }} disabled={isSubmitting}>
                {editingTechnique ? 'Update' : 'Create'} Knowledge Item
              </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechniqueFormDialog;