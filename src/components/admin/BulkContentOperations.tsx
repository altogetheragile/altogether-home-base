import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Tag, Eye, EyeOff, Star, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useKnowledgeTags } from '@/hooks/useKnowledgeTags';
import { exportToCSV, formatDataForExport } from '@/utils/exportUtils';

interface BulkContentOperationsProps {
  techniques: any[];
  selectedTechniques: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const BulkContentOperations = ({ 
  techniques, 
  selectedTechniques, 
  onSelectionChange 
}: BulkContentOperationsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tags } = useKnowledgeTags();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkOperation = useMutation({
    mutationFn: async ({ operation, value }: { operation: string; value?: any }) => {
      if (selectedTechniques.length === 0) return;

      switch (operation) {
        case 'publish':
          await supabase
            .from('knowledge_techniques')
            .update({ is_published: true })
            .in('id', selectedTechniques);
          break;

        case 'unpublish':
          await supabase
            .from('knowledge_techniques')
            .update({ is_published: false })
            .in('id', selectedTechniques);
          break;

        case 'feature':
          await supabase
            .from('knowledge_techniques')
            .update({ is_featured: true })
            .in('id', selectedTechniques);
          break;

        case 'unfeature':
          await supabase
            .from('knowledge_techniques')
            .update({ is_featured: false })
            .in('id', selectedTechniques);
          break;

        case 'add-tag':
          if (!value) return;
          const tagAssociations = selectedTechniques.map(techniqueId => ({
            technique_id: techniqueId,
            tag_id: value
          }));
          await supabase
            .from('knowledge_technique_tags')
            .upsert(tagAssociations, { 
              onConflict: 'technique_id,tag_id',
              ignoreDuplicates: true 
            });
          break;

        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedTechniques.length} techniques? This action cannot be undone.`)) {
            return;
          }
          await supabase
            .from('knowledge_techniques')
            .delete()
            .in('id', selectedTechniques);
          break;

        default:
          throw new Error('Unknown operation');
      }
    },
    onSuccess: (_, { operation }) => {
      const operationLabels = {
        'publish': 'published',
        'unpublish': 'unpublished',
        'feature': 'featured',
        'unfeature': 'unfeatured',
        'add-tag': 'tagged',
        'delete': 'deleted'
      };
      
      toast({
        title: "Success",
        description: `${selectedTechniques.length} techniques ${operationLabels[operation as keyof typeof operationLabels]}`
      });
      
      onSelectionChange([]);
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-techniques'] });
    },
    onError: (error) => {
      console.error('Bulk operation failed:', error);
      toast({
        title: "Error",
        description: "Bulk operation failed. Please try again.",
        variant: "destructive"
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (techniques: any[]) => {
      console.log('🚀 Import started: Importing', techniques.length, 'techniques');
      
      // Log import start
      await supabase.from('admin_logs').insert({
        action: 'import_start',
        details: { 
          count: techniques.length,
          timestamp: new Date().toISOString()
        }
      });
      
      const results = {
        total: techniques.length,
        successful: [] as string[],
        failed: [] as { name: string; error: string }[],
        categories: { created: [] as string[], found: [] as string[] },
        tags: { created: [] as string[], found: [] as string[] }
      };

      for (const technique of techniques) {
        try {
          // Check if technique already exists by slug
          const { data: existingTechnique } = await supabase
            .from('knowledge_techniques')
            .select('id, name')
            .eq('slug', technique.slug)
            .maybeSingle();

          if (existingTechnique) {
            console.log(`Skipping technique "${technique.name}" - already exists with slug "${technique.slug}"`);
            
            // Log the skip event
            await supabase.from('admin_logs').insert({
              action: 'Import Technique Skipped',
              details: {
                name: technique.name,
                reason: 'Technique with this slug already exists',
                existing_name: existingTechnique.name,
                timestamp: new Date().toISOString()
              }
            });
            
            continue; // Skip this technique and continue with the next one
          }

          // Handle category
          let categoryId = technique.category_id;
          if (technique.category && !categoryId) {
            // Try to find existing category by name or slug
            const { data: existingCategory } = await supabase
              .from('knowledge_categories')
              .select('id')
              .or(`name.eq.${technique.category},slug.eq.${technique.category?.toLowerCase().replace(/\s+/g, '-')}`)
              .maybeSingle();

            if (existingCategory) {
              categoryId = existingCategory.id;
              results.categories.found.push(technique.category);
            } else {
              // Create new category
              const { data: newCategory, error: categoryError } = await supabase
                .from('knowledge_categories')
                .insert({
                  name: technique.category,
                  slug: technique.category.toLowerCase().replace(/\s+/g, '-'),
                  description: `Auto-created category for ${technique.category}`
                })
                .select('id')
                .single();

              if (categoryError) throw categoryError;
              categoryId = newCategory.id;
              results.categories.created.push(technique.category);
            }
          }

          // Insert technique
          const { data: insertedTechnique, error: techniqueError } = await supabase
            .from('knowledge_techniques')
            .insert({
              name: technique.name,
              slug: technique.slug,
              description: technique.description,
              purpose: technique.purpose,
              summary: technique.summary,
              originator: technique.originator,
              difficulty_level: technique.difficulty_level,
              estimated_reading_time: technique.estimated_reading_time,
              category_id: categoryId,
              is_published: technique.is_published || false,
              is_featured: technique.is_featured || false,
              is_complete: technique.is_complete || false,
              content_type: technique.content_type || 'technique',
              image_url: technique.image_url,
              seo_title: technique.seo_title,
              seo_description: technique.seo_description,
              seo_keywords: technique.seo_keywords,
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select('id')
            .single();

          if (techniqueError) throw techniqueError;

          // Handle tags
          if (technique.tags && Array.isArray(technique.tags)) {
            for (const tagName of technique.tags) {
              // Find or create tag
              let { data: existingTag } = await supabase
                .from('knowledge_tags')
                .select('id')
                .eq('name', tagName)
                .maybeSingle();

              if (!existingTag) {
                const { data: newTag, error: tagError } = await supabase
                  .from('knowledge_tags')
                  .insert({
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-')
                  })
                  .select('id')
                  .single();

                if (tagError) throw tagError;
                existingTag = newTag;
                results.tags.created.push(tagName);
              } else {
                results.tags.found.push(tagName);
              }

              // Link tag to technique
              const { error: linkError } = await supabase
                .from('knowledge_technique_tags')
                .insert({
                  technique_id: insertedTechnique.id,
                  tag_id: existingTag.id
                });

              if (linkError) throw linkError;
            }
          }

          // Handle examples
          if (technique.examples && Array.isArray(technique.examples)) {
            for (const example of technique.examples) {
              const { error: exampleError } = await supabase
                .from('knowledge_examples')
                .insert({
                  technique_id: insertedTechnique.id,
                  title: example.title,
                  description: example.description,
                  context: example.context,
                  outcome: example.outcome,
                  industry: example.industry,
                  company_size: example.company_size,
                  position: example.position || 0,
                  created_by: (await supabase.auth.getUser()).data.user?.id
                });

              if (exampleError) throw exampleError;
            }
          }

          // Handle media
          if (technique.media && Array.isArray(technique.media)) {
            for (const media of technique.media) {
              const { error: mediaError } = await supabase
                .from('knowledge_media')
                .insert({
                  technique_id: insertedTechnique.id,
                  type: media.type,
                  url: media.url,
                  title: media.title,
                  description: media.description,
                  mime_type: media.mime_type,
                  file_size: media.file_size,
                  thumbnail_url: media.thumbnail_url,
                  position: media.position || 0
                });

              if (mediaError) throw mediaError;
            }
          }

          results.successful.push(technique.name);

        } catch (error: any) {
          console.error(`❌ Error importing technique ${technique.name}:`, error);
          results.failed.push({
            name: technique.name,
            error: error.message || 'Unknown error'
          });
          
          // Log individual failure
          await supabase.from('admin_logs').insert({
            action: 'import_technique_failed',
            details: { 
              name: technique.name,
              error: error.message || 'Unknown error',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      // Show detailed outcome report
      const successCount = results.successful.length;
      const failCount = results.failed.length;
      const categoriesCreated = results.categories.created.length;
      const tagsCreated = results.tags.created.length;

      let description = `Successfully imported ${successCount} techniques`;
      if (failCount > 0) description += `, ${failCount} failed`;
      if (categoriesCreated > 0) description += `, created ${categoriesCreated} categories`;
      if (tagsCreated > 0) description += `, created ${tagsCreated} tags`;

      toast({
        title: "Import completed",
        description: description,
      });

      // Log detailed results for debugging
      console.log('✅ Import completed:', results);
      
      // Log import completion to admin logs
      supabase.from('admin_logs').insert({
        action: 'import_completed',
        details: { 
          total: results.total,
          successful: results.successful.length,
          failed: results.failed.length,
          categories_created: results.categories.created.length,
          tags_created: results.tags.created.length,
          failed_items: results.failed,
          timestamp: new Date().toISOString()
        }
      });
      
      if (results.failed.length > 0) {
        console.warn('⚠️ Failed imports:', results.failed);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-techniques'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
    },
    onError: (error) => {
      console.error('💥 Import error:', error);
      
      // Log import error to admin logs
      supabase.from('admin_logs').insert({
        action: 'import_error',
        details: { 
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Import failed",
        description: "There was an error during the import process.",
        variant: "destructive"
      });
    }
  });

  const handleExport = () => {
    const exportData = selectedTechniques.length > 0 
      ? techniques.filter(t => selectedTechniques.includes(t.id))
      : techniques;
    
    const formattedData = formatDataForExport(exportData, 'techniques');
    exportToCSV(formattedData, `knowledge-techniques-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} techniques`
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const techniques = JSON.parse(text);
      
      // Validate structure
      if (!Array.isArray(techniques)) {
        throw new Error('File must contain an array of techniques');
      }

      // Basic validation for required fields
      const requiredFields = ['name', 'slug'];
      const validTechniques = techniques.filter(technique => 
        requiredFields.every(field => technique[field])
      );

      if (validTechniques.length === 0) {
        throw new Error('No valid techniques found in file');
      }

      if (validTechniques.length !== techniques.length) {
        toast({
          title: "Warning",
          description: `${techniques.length - validTechniques.length} techniques skipped due to missing required fields`,
          variant: "destructive"
        });
      }

      importMutation.mutate(validTechniques);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON file format",
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleSelectAll = () => {
    if (selectedTechniques.length === techniques.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(techniques.map(t => t.id));
    }
  };

  const handleAddTag = () => {
    if (selectedTag) {
      bulkOperation.mutate({ operation: 'add-tag', value: selectedTag });
      setSelectedTag('');
    }
  };

  if (techniques.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Bulk Operations
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={techniques.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleImportClick}
                disabled={importMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import JSON
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTechniques.length === techniques.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select All ({selectedTechniques.length}/{techniques.length})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {selectedTechniques.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {selectedTechniques.length} selected
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkOperation.mutate({ operation: 'publish' })}
              disabled={bulkOperation.isPending}
            >
              <Eye className="h-4 w-4 mr-1" />
              Publish
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkOperation.mutate({ operation: 'unpublish' })}
              disabled={bulkOperation.isPending}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Unpublish
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkOperation.mutate({ operation: 'feature' })}
              disabled={bulkOperation.isPending}
            >
              <Star className="h-4 w-4 mr-1" />
              Feature
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkOperation.mutate({ operation: 'unfeature' })}
              disabled={bulkOperation.isPending}
            >
              <Star className="h-4 w-4 mr-1" />
              Unfeature
            </Button>

            <div className="flex items-center gap-2">
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags?.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTag}
                disabled={!selectedTag || bulkOperation.isPending}
              >
                <Tag className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </div>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => bulkOperation.mutate({ operation: 'delete' })}
              disabled={bulkOperation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};