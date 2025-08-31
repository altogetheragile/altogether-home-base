import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaUpload, type MediaItem } from '@/components/ui/media-upload';
import { Plus, X } from 'lucide-react';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { useActivityFocus } from '@/hooks/useActivityFocus';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useActivityCategories } from '@/hooks/useActivityCategories';

interface EnhancedTechniqueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingTechnique: any;
}

const EnhancedTechniqueForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingTechnique 
}: EnhancedTechniqueFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Data hooks
  const { data: categories } = useKnowledgeCategories();
  const { data: tags } = useKnowledgeTags();
  const { data: activityFocus } = useActivityFocus();
  const { data: activityDomains } = useActivityDomains();
  const { data: activityCategories } = useActivityCategories();

  // Initialize form data with all fields
  const [formData, setFormData] = useState(() => {
    const initial: any = {
      // Basic fields
      name: editingTechnique?.name || '',
      slug: editingTechnique?.slug || '',
      summary: editingTechnique?.summary || '',
      description: editingTechnique?.description || '',
      purpose: editingTechnique?.purpose || '',
      background: editingTechnique?.background || '',
      originator: editingTechnique?.originator || '',
      source: editingTechnique?.source || '',
      category_id: editingTechnique?.category_id || '',
      content_type: editingTechnique?.content_type || 'technique',
      difficulty_level: editingTechnique?.difficulty_level || '',
      estimated_reading_time: editingTechnique?.estimated_reading_time || '',
      image_url: editingTechnique?.image_url || '',
      is_published: editingTechnique?.is_published || false,
      is_featured: editingTechnique?.is_featured || false,
      is_complete: editingTechnique?.is_complete || false,

      // W5H Generic fields
      generic_who: editingTechnique?.generic_who || '',
      generic_what: editingTechnique?.generic_what || '',
      generic_when: editingTechnique?.generic_when || '',
      generic_where: editingTechnique?.generic_where || '',
      generic_why: editingTechnique?.generic_why || '',
      generic_how: editingTechnique?.generic_how || '',
      generic_how_much: editingTechnique?.generic_how_much || '',
      generic_summary: editingTechnique?.generic_summary || '',

      // W5H Example fields
      example_who: editingTechnique?.example_who || '',
      example_what: editingTechnique?.example_what || '',
      example_when: editingTechnique?.example_when || '',
      example_where: editingTechnique?.example_where || '',
      example_why: editingTechnique?.example_why || '',
      example_how: editingTechnique?.example_how || '',
      example_how_much: editingTechnique?.example_how_much || '',
      example_use_case: editingTechnique?.example_use_case || '',
      example_summary: editingTechnique?.example_summary || '',

      // Implementation fields
      planning_considerations: editingTechnique?.planning_considerations || '',
      industry_context: editingTechnique?.industry_context || '',
      focus_description: editingTechnique?.focus_description || '',
      typical_participants: editingTechnique?.typical_participants || [],
      required_skills: editingTechnique?.required_skills || [],
      success_criteria: editingTechnique?.success_criteria || [],
      common_pitfalls: editingTechnique?.common_pitfalls || [],
      related_practices: editingTechnique?.related_practices || [],
      team_size_min: editingTechnique?.team_size_min || '',
      team_size_max: editingTechnique?.team_size_max || '',
      duration_min_minutes: editingTechnique?.duration_min_minutes || '',
      duration_max_minutes: editingTechnique?.duration_max_minutes || '',

      // Classification fields
      activity_focus_id: editingTechnique?.activity_focus_id || '',
      activity_domain_id: editingTechnique?.activity_domain_id || '',
      activity_category_id: editingTechnique?.activity_category_id || '',

      // SEO fields
      seo_title: editingTechnique?.seo_title || '',
      seo_description: editingTechnique?.seo_description || '',
      seo_keywords: editingTechnique?.seo_keywords || [],

      // Tags and media
      tags: editingTechnique?.knowledge_tags?.map((tagInfo: any) => tagInfo.knowledge_tags.id) || [],
      media: editingTechnique?.knowledge_media?.map((media: any, index: number) => ({
        id: media.id,
        type: media.type,
        title: media.title,
        description: media.description,
        url: media.url,
        thumbnail_url: media.thumbnail_url,
        position: index
      })) || []
    };
    return initial;
  });

  // Reset form when editing item changes
  useEffect(() => {
    if (isOpen && editingTechnique) {
      setFormData({
        // Reset all fields with editing item data
        name: editingTechnique?.name || '',
        slug: editingTechnique?.slug || '',
        summary: editingTechnique?.summary || '',
        description: editingTechnique?.description || '',
        purpose: editingTechnique?.purpose || '',
        background: editingTechnique?.background || '',
        originator: editingTechnique?.originator || '',
        source: editingTechnique?.source || '',
        category_id: editingTechnique?.category_id || '',
        content_type: editingTechnique?.content_type || 'technique',
        difficulty_level: editingTechnique?.difficulty_level || '',
        estimated_reading_time: editingTechnique?.estimated_reading_time || '',
        image_url: editingTechnique?.image_url || '',
        is_published: editingTechnique?.is_published || false,
        is_featured: editingTechnique?.is_featured || false,
        is_complete: editingTechnique?.is_complete || false,
        generic_who: editingTechnique?.generic_who || '',
        generic_what: editingTechnique?.generic_what || '',
        generic_when: editingTechnique?.generic_when || '',
        generic_where: editingTechnique?.generic_where || '',
        generic_why: editingTechnique?.generic_why || '',
        generic_how: editingTechnique?.generic_how || '',
        generic_how_much: editingTechnique?.generic_how_much || '',
        generic_summary: editingTechnique?.generic_summary || '',
        example_who: editingTechnique?.example_who || '',
        example_what: editingTechnique?.example_what || '',
        example_when: editingTechnique?.example_when || '',
        example_where: editingTechnique?.example_where || '',
        example_why: editingTechnique?.example_why || '',
        example_how: editingTechnique?.example_how || '',
        example_how_much: editingTechnique?.example_how_much || '',
        example_use_case: editingTechnique?.example_use_case || '',
        example_summary: editingTechnique?.example_summary || '',
        planning_considerations: editingTechnique?.planning_considerations || '',
        industry_context: editingTechnique?.industry_context || '',
        focus_description: editingTechnique?.focus_description || '',
        typical_participants: editingTechnique?.typical_participants || [],
        required_skills: editingTechnique?.required_skills || [],
        success_criteria: editingTechnique?.success_criteria || [],
        common_pitfalls: editingTechnique?.common_pitfalls || [],
        related_practices: editingTechnique?.related_practices || [],
        team_size_min: editingTechnique?.team_size_min || '',
        team_size_max: editingTechnique?.team_size_max || '',
        duration_min_minutes: editingTechnique?.duration_min_minutes || '',
        duration_max_minutes: editingTechnique?.duration_max_minutes || '',
        activity_focus_id: editingTechnique?.activity_focus_id || '',
        activity_domain_id: editingTechnique?.activity_domain_id || '',
        activity_category_id: editingTechnique?.activity_category_id || '',
        seo_title: editingTechnique?.seo_title || '',
        seo_description: editingTechnique?.seo_description || '',
        seo_keywords: editingTechnique?.seo_keywords || [],
        tags: editingTechnique?.knowledge_tags?.map((tagInfo: any) => tagInfo.knowledge_tags.id) || [],
        media: editingTechnique?.knowledge_media?.map((media: any, index: number) => ({
          id: media.id,
          type: media.type,
          title: media.title,
          description: media.description,
          url: media.url,
          thumbnail_url: media.thumbnail_url,
          position: index
        })) || []
      });
    }
  }, [isOpen, editingTechnique]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayAdd = (key: string, value: string) => {
    if (!value.trim()) return;
    const currentArray = formData[key] || [];
    updateFormData(key, [...currentArray, value.trim()]);
  };

  const handleArrayRemove = (key: string, index: number) => {
    const currentArray = formData[key] || [];
    updateFormData(key, currentArray.filter((_: any, i: number) => i !== index));
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = formData.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id: string) => id !== tagId)
      : [...currentTags, tagId];
    updateFormData('tags', newTags);
  };

  const renderArrayField = (key: string, label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleArrayAdd(key, e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <Button
          type="button"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            handleArrayAdd(key, input.value);
            input.value = '';
          }}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {(formData[key] || []).map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="flex-1">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleArrayRemove(key, index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTechnique ? 'Edit Knowledge Item' : 'Create New Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="w5h">Use Cases</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
              <TabsTrigger value="classification">Classification</TabsTrigger>
              <TabsTrigger value="seo">SEO & Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => updateFormData('slug', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => updateFormData('summary', e.target.value)}
                  placeholder="Brief overview of this technique"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Textarea
                    value={formData.purpose}
                    onChange={(e) => updateFormData('purpose', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background</Label>
                  <Textarea
                    value={formData.background}
                    onChange={(e) => updateFormData('background', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => updateFormData('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={formData.content_type} onValueChange={(value) => updateFormData('content_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="framework">Framework</SelectItem>
                      <SelectItem value="method">Method</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={formData.difficulty_level} onValueChange={(value) => updateFormData('difficulty_level', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {tags?.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={formData.tags?.includes(tag.id) || false}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="text-sm">{tag.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                {formData.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tagId: string) => {
                      const tag = tags?.find(t => t.id === tagId);
                      return tag ? (
                        <Badge key={tagId} variant="secondary">
                          {tag.name}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => handleTagToggle(tagId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => updateFormData('is_published', checked)}
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => updateFormData('is_featured', checked)}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_complete"
                    checked={formData.is_complete}
                    onCheckedChange={(checked) => updateFormData('is_complete', checked)}
                  />
                  <Label htmlFor="is_complete">Complete</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="w5h" className="mt-4 space-y-4">
              <div className="space-y-6">
                 <div>
                   <h3 className="text-lg font-semibold mb-4">Generic Use Case</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Generic Use Case - Who</Label>
                       <Textarea
                         value={formData.generic_who}
                         onChange={(e) => updateFormData('generic_who', e.target.value)}
                         placeholder="Who typically uses this technique?"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Generic Use Case - What</Label>
                       <Textarea
                         value={formData.generic_what}
                         onChange={(e) => updateFormData('generic_what', e.target.value)}
                         placeholder="What is this technique about?"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Generic Use Case - When</Label>
                       <Textarea
                         value={formData.generic_when}
                         onChange={(e) => updateFormData('generic_when', e.target.value)}
                         placeholder="When should this technique be used?"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Generic Use Case - Where</Label>
                       <Textarea
                         value={formData.generic_where}
                         onChange={(e) => updateFormData('generic_where', e.target.value)}
                         placeholder="Where is this technique applicable?"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Generic Use Case - Why</Label>
                       <Textarea
                         value={formData.generic_why}
                         onChange={(e) => updateFormData('generic_why', e.target.value)}
                         placeholder="Why use this technique?"
                         rows={3}
                       />
                     </div>
                      <div className="space-y-2">
                        <Label>Generic Use Case - How</Label>
                        <Textarea
                          value={formData.generic_how}
                          onChange={(e) => updateFormData('generic_how', e.target.value)}
                          placeholder="How is this technique executed?"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Generic Use Case - How Much</Label>
                        <Textarea
                          value={formData.generic_how_much}
                          onChange={(e) => updateFormData('generic_how_much', e.target.value)}
                          placeholder="What resources/effort is required?"
                          rows={3}
                        />
                      </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-lg font-semibold mb-4">Example / Use Case</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Example / Use Case - Who</Label>
                       <Textarea
                         value={formData.example_who}
                         onChange={(e) => updateFormData('example_who', e.target.value)}
                         placeholder="Specific example of who uses this"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Example / Use Case - What</Label>
                       <Textarea
                         value={formData.example_what}
                         onChange={(e) => updateFormData('example_what', e.target.value)}
                         placeholder="Specific example scenario"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Example / Use Case - When</Label>
                       <Textarea
                         value={formData.example_when}
                         onChange={(e) => updateFormData('example_when', e.target.value)}
                         placeholder="Specific timing example"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Example / Use Case - Where</Label>
                       <Textarea
                         value={formData.example_where}
                         onChange={(e) => updateFormData('example_where', e.target.value)}
                         placeholder="Specific location/context example"
                         rows={3}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Example / Use Case - Why</Label>
                       <Textarea
                         value={formData.example_why}
                         onChange={(e) => updateFormData('example_why', e.target.value)}
                         placeholder="Specific reason example"
                         rows={3}
                       />
                     </div>
                      <div className="space-y-2">
                        <Label>Example / Use Case - How</Label>
                        <Textarea
                          value={formData.example_how}
                          onChange={(e) => updateFormData('example_how', e.target.value)}
                          placeholder="Specific execution example"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Example / Use Case - How Much</Label>
                        <Textarea
                          value={formData.example_how_much}
                          onChange={(e) => updateFormData('example_how_much', e.target.value)}
                          placeholder="Specific resource/effort example"
                          rows={3}
                        />
                      </div>
                     </div>
                     <div className="mt-4">
                       <div className="space-y-2">
                         <Label>Example / Use Case - Summary (Narrative Form)</Label>
                         <Textarea
                           value={formData.example_summary}
                           onChange={(e) => updateFormData('example_summary', e.target.value)}
                           placeholder="Narrative summary of the complete example"
                           rows={4}
                         />
                       </div>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="implementation" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Planning Considerations</Label>
                  <Textarea
                    value={formData.planning_considerations}
                    onChange={(e) => updateFormData('planning_considerations', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry Context</Label>
                  <Textarea
                    value={formData.industry_context}
                    onChange={(e) => updateFormData('industry_context', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderArrayField('typical_participants', 'Typical Participants', 'Add participant role...')}
                {renderArrayField('required_skills', 'Required Skills', 'Add required skill...')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderArrayField('success_criteria', 'Success Criteria', 'Add success criterion...')}
                {renderArrayField('common_pitfalls', 'Common Pitfalls', 'Add common pitfall...')}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Min Team Size</Label>
                  <Input
                    type="number"
                    value={formData.team_size_min}
                    onChange={(e) => updateFormData('team_size_min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Team Size</Label>
                  <Input
                    type="number"
                    value={formData.team_size_max}
                    onChange={(e) => updateFormData('team_size_max', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration_min_minutes}
                    onChange={(e) => updateFormData('duration_min_minutes', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration_max_minutes}
                    onChange={(e) => updateFormData('duration_max_minutes', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="classification" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Activity Focus</Label>
                  <Select value={formData.activity_focus_id} onValueChange={(value) => updateFormData('activity_focus_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityFocus?.map(focus => (
                        <SelectItem key={focus.id} value={focus.id}>{focus.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activity Domain</Label>
                  <Select value={formData.activity_domain_id} onValueChange={(value) => updateFormData('activity_domain_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityDomains?.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activity Category</Label>
                  <Select value={formData.activity_category_id} onValueChange={(value) => updateFormData('activity_category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input
                    value={formData.seo_title}
                    onChange={(e) => updateFormData('seo_title', e.target.value)}
                    placeholder="SEO optimized title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Textarea
                    value={formData.seo_description}
                    onChange={(e) => updateFormData('seo_description', e.target.value)}
                    placeholder="Meta description for search engines"
                    rows={3}
                  />
                </div>
                {renderArrayField('seo_keywords', 'SEO Keywords', 'Add keyword...')}
                
                <div className="space-y-2">
                  <Label>Media Gallery</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <MediaUpload
                      value={formData.media || []}
                      onChange={(mediaItems) => updateFormData('media', mediaItems)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingTechnique ? 'Update' : 'Create')} Knowledge Item
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedTechniqueForm;