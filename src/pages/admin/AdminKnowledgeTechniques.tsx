import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { type MediaItem } from '@/components/ui/media-upload';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import SimpleForm from '@/components/admin/SimpleForm';
import { BulkContentOperations } from '@/components/admin/BulkContentOperations';
import { ContentAnalyticsDashboard } from '@/components/admin/ContentAnalyticsDashboard';

const AdminKnowledgeTechniques = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTechnique, setEditingTechnique] = useState<any>(null);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();

  const { data: techniques, isLoading, refetch } = useQuery({
    queryKey: ['admin-knowledge-techniques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_techniques')
        .select(`
          *,
          category:knowledge_categories(name, color),
          knowledge_media(id, type, title, description, url, thumbnail_url, position),
          knowledge_tags:knowledge_technique_tags(knowledge_tags(id, name, slug))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (formData: any) => {
    try {
      const { name, slug, description, purpose, originator, category_id, media, tags: selectedTags } = formData;
      
      let techniqueId: string;
      
      if (editingTechnique) {
        const { error } = await supabase
          .from('knowledge_techniques')
          .update({
            name,
            slug,
            description,
            purpose,
            originator,
            category_id: category_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTechnique.id);

        if (error) throw error;
        techniqueId = editingTechnique.id;
      } else {
        const { data, error } = await supabase
          .from('knowledge_techniques')
          .insert({
            name,
            slug,
            description,
            purpose,
            originator,
            category_id: category_id || null,
          })
          .select()
          .single();

        if (error) throw error;
        techniqueId = data.id;
      }

      // Handle media uploads
      if (media && Array.isArray(media) && media.length > 0) {
        // First, delete existing media for this technique
        await supabase
          .from('knowledge_media')
          .delete()
          .eq('technique_id', techniqueId);

        // Then insert new media items
        const mediaToInsert = media.map((item: MediaItem, index: number) => ({
          technique_id: techniqueId,
          type: item.type,
          title: item.title,
          description: item.description,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
          position: index
        }));

        const { error: mediaError } = await supabase
          .from('knowledge_media')
          .insert(mediaToInsert);

        if (mediaError) throw mediaError;
      }

      // Handle tags
      if (selectedTags && Array.isArray(selectedTags)) {
        // First, delete existing tag associations
        await supabase
          .from('knowledge_technique_tags')
          .delete()
          .eq('technique_id', techniqueId);

        // Then insert new tag associations
        if (selectedTags.length > 0) {
          const tagAssociations = selectedTags.map((tagId: string) => ({
            technique_id: techniqueId,
            tag_id: tagId
          }));

          const { error: tagsError } = await supabase
            .from('knowledge_technique_tags')
            .insert(tagAssociations);

          if (tagsError) throw tagsError;
        }
      }

      toast({
        title: "Success",
        description: `Technique ${editingTechnique ? 'updated' : 'created'} successfully.`,
      });
      
      setShowForm(false);
      setEditingTechnique(null);
      refetch();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingTechnique ? 'update' : 'create'} technique.`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (technique: any) => {
    setEditingTechnique(technique);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this technique?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_techniques')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Technique deleted successfully.",
      });
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete technique.",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (technique: any) => {
    try {
      const { error } = await supabase
        .from('knowledge_techniques')
        .update({ is_published: !technique.is_published })
        .eq('id', technique.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Technique ${!technique.is_published ? 'published' : 'unpublished'} successfully.`,
      });
      refetch();
    } catch (error) {
      console.error('Toggle published error:', error);
      toast({
        title: "Error",
        description: "Failed to update technique status.",
        variant: "destructive",
      });
    }
  };

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
      type: 'select' as const,
      options: tags?.map(tag => ({ value: tag.id, label: tag.name })) || [],
      placeholder: 'Select tags (use Ctrl/Cmd+click for multiple)'
    },
    { key: 'description', label: 'Description', type: 'textarea' as const },
    { key: 'purpose', label: 'Purpose', type: 'textarea' as const },
    { key: 'originator', label: 'Originator', type: 'text' as const },
    { key: 'media', label: 'Media Gallery (Images & Videos)', type: 'media' as const },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <SimpleForm
          title="Technique"
          onSubmit={handleSubmit}
          editingItem={editingTechnique}
          onCancel={() => {
            setShowForm(false);
            setEditingTechnique(null);
          }}
          fields={formFields}
        />
      )}

      {showAnalytics && <ContentAnalyticsDashboard />}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Knowledge Techniques</span>
          </h3>
          <p className="text-gray-600">Manage product delivery techniques and methods</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Technique</span>
          </Button>
        </div>
      </div>

      <BulkContentOperations
        techniques={techniques || []}
        selectedTechniques={selectedTechniques}
        onSelectionChange={setSelectedTechniques}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTechniques.length === techniques?.length && techniques.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTechniques(techniques?.map(t => t.id) || []);
                    } else {
                      setSelectedTechniques([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {techniques?.map((technique) => (
              <TableRow key={technique.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTechniques.includes(technique.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTechniques([...selectedTechniques, technique.id]);
                      } else {
                        setSelectedTechniques(selectedTechniques.filter(id => id !== technique.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{technique.name}</TableCell>
                <TableCell className="font-mono text-sm">{technique.slug}</TableCell>
                <TableCell>
                  {technique.category ? (
                    <Badge style={{ backgroundColor: technique.category.color + '20', color: technique.category.color }}>
                      {technique.category.name}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">No category</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {technique.knowledge_tags && technique.knowledge_tags.length > 0 ? (
                      technique.knowledge_tags.map((tagInfo: any) => (
                        <Badge key={tagInfo.knowledge_tags.id} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tagInfo.knowledge_tags.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No tags</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{technique.view_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={technique.is_published ? 'default' : 'secondary'}>
                    {technique.is_published ? (
                      <><Eye className="h-3 w-3 mr-1" />Published</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(technique)}
                    >
                      {technique.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(technique)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(technique.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!techniques?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No techniques found. Create your first technique to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminKnowledgeTechniques;