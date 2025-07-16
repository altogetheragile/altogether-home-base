import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, formatDataForExport } from '@/utils/exportUtils';

interface BulkTagOperationsProps {
  tags: any[];
  selectedTags: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const BulkTagOperations = ({ 
  tags, 
  selectedTags, 
  onSelectionChange 
}: BulkTagOperationsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkOperation = useMutation({
    mutationFn: async ({ operation }: { operation: string }) => {
      if (selectedTags.length === 0) return;

      switch (operation) {
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedTags.length} tags? This action cannot be undone.`)) {
            return;
          }
          await supabase
            .from('knowledge_tags')
            .delete()
            .in('id', selectedTags);
          break;

        default:
          throw new Error('Unknown operation');
      }
    },
    onSuccess: (_, { operation }) => {
      const operationLabels = {
        'delete': 'deleted'
      };
      
      toast({
        title: "Success",
        description: `${selectedTags.length} tags ${operationLabels[operation as keyof typeof operationLabels]}`
      });
      
      onSelectionChange([]);
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-tags'] });
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
    mutationFn: async (tags: any[]) => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .insert(tags);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, tags) => {
      toast({
        title: "Success",
        description: `${tags.length} tags imported successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-tags'] });
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
    const exportData = selectedTags.length > 0 
      ? tags.filter(t => selectedTags.includes(t.id))
      : tags;
    
    const formattedData = formatDataForExport(exportData, 'tags');
    exportToCSV(formattedData, `knowledge-tags-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} tags`
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
      const tags = JSON.parse(text);
      
      // Validate structure
      if (!Array.isArray(tags)) {
        throw new Error('File must contain an array of tags');
      }

      // Basic validation for required fields
      const requiredFields = ['name', 'slug'];
      const validTags = tags.filter(tag => 
        requiredFields.every(field => tag[field])
      );

      if (validTags.length === 0) {
        throw new Error('No valid tags found in file');
      }

      if (validTags.length !== tags.length) {
        toast({
          title: "Warning",
          description: `${tags.length - validTags.length} tags skipped due to missing required fields`,
          variant: "destructive"
        });
      }

      importMutation.mutate(validTags);
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
    if (selectedTags.length === tags.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tags.map(t => t.id));
    }
  };

  if (tags.length === 0) return null;

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
                disabled={tags.length === 0}
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
                checked={selectedTags.length === tags.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select All ({selectedTags.length}/{tags.length})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {selectedTags.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {selectedTags.length} selected
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
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