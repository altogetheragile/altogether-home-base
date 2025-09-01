import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeItemBasicInfo } from '@/components/admin/knowledge/editor/KnowledgeItemBasicInfo';
import { KnowledgeItemClassification } from '@/components/admin/knowledge/editor/KnowledgeItemClassification';
import { KnowledgeItemContent } from '@/components/admin/knowledge/editor/KnowledgeItemContent';
import { KnowledgeItemUseCases } from '@/components/admin/knowledge/editor/KnowledgeItemUseCases';
import { KnowledgeItemAnalytics } from '@/components/admin/knowledge/editor/KnowledgeItemAnalytics';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';

const EditKnowledgeItem = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    category_id: '',
    planning_layer_id: '',
    domain_id: '',
    is_published: false,
    is_featured: false
  });

  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();

  // For new items, id will be "new"
  const isEditing = id !== 'new';

  const { data: knowledgeItem, isLoading } = useQuery({
    queryKey: ['knowledge-item', id],
    queryFn: async () => {
      if (!isEditing) return null;
      
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_layers (id, name, slug, color),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (knowledgeItem && isEditing) {
      setFormData({
        name: knowledgeItem.name || '',
        slug: knowledgeItem.slug || '',
        description: knowledgeItem.description || '',
        background: knowledgeItem.background || '',
        source: knowledgeItem.source || '',
        category_id: knowledgeItem.category_id || '',
        planning_layer_id: knowledgeItem.planning_layer_id || '',
        domain_id: knowledgeItem.domain_id || '',
        is_published: knowledgeItem.is_published || false,
        is_featured: knowledgeItem.is_featured || false
      });
    }
  }, [knowledgeItem, isEditing]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      setActiveTab('basic');
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Validation Error", 
        description: "Slug is required",
        variant: "destructive",
      });
      setActiveTab('basic');
      return;
    }

    try {
      if (isEditing) {
        await updateKnowledgeItem.mutateAsync({
          id: id!,
          ...formData
        });
      } else {
        await createKnowledgeItem.mutateAsync(formData);
      }
      
      toast({
        title: isEditing ? "Knowledge item updated" : "Knowledge item created",
        description: "Your changes have been saved.",
      });
      
      navigate('/admin/knowledge/items');
    } catch (error) {
      console.error('Error saving knowledge item:', error);
      toast({
        title: "Error saving knowledge item",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return slug;
  };

  const handleNameChange = (name: string) => {
    handleFormChange('name', name);
    if (!isEditing || !formData.slug) {
      handleFormChange('slug', generateSlug(name));
    }
  };

  const isLoading_ = createKnowledgeItem.isPending || updateKnowledgeItem.isPending;

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditing && !knowledgeItem && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Knowledge item not found</p>
        <Button onClick={() => navigate('/admin/knowledge/items')} className="mt-4">
          Back to Knowledge Items
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/admin/knowledge/items')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Items
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update knowledge item details' : 'Add a new knowledge item'}
          </p>
        </div>
      </div>

      <form className="max-w-7xl space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="usecases">Use Cases</TabsTrigger>
            {isEditing && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <KnowledgeItemBasicInfo
              formData={formData}
              onFormChange={handleFormChange}
              onNameChange={handleNameChange}
            />
          </TabsContent>

          <TabsContent value="classification" className="space-y-4 mt-6">
            <KnowledgeItemClassification
              formData={formData}
              onFormChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-6">
            <KnowledgeItemContent
              formData={formData}
              onFormChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="usecases" className="space-y-4 mt-6">
            <KnowledgeItemUseCases
              knowledgeItemId={isEditing ? id : undefined}
            />
          </TabsContent>

          {isEditing && (
            <TabsContent value="analytics" className="space-y-4 mt-6">
              <KnowledgeItemAnalytics
                knowledgeItem={knowledgeItem}
              />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex space-x-4">
          <Button type="button" onClick={handleSave} disabled={isLoading_}>
            {isLoading_ ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/knowledge/items')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditKnowledgeItem;