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
      const { data, error } = await supabase
        .from('knowledge_techniques')
        .insert(techniques);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, techniques) => {
      toast({
        title: "Success",
        description: `${techniques.length} techniques imported successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-techniques'] });
    },
    onError: (error) => {
      console.error('Import failed:', error);
      toast({
        title: "Error",
        description: "Import failed. Please check the file format and try again.",
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