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

interface BulkCategoryOperationsProps {
  categories: any[];
  selectedCategories: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const BulkCategoryOperations = ({ 
  categories, 
  selectedCategories, 
  onSelectionChange 
}: BulkCategoryOperationsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkOperation = useMutation({
    mutationFn: async ({ operation }: { operation: string }) => {
      if (selectedCategories.length === 0) return;

      switch (operation) {
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`)) {
            return;
          }
          await supabase
            .from('knowledge_categories')
            .delete()
            .in('id', selectedCategories);
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
        description: `${selectedCategories.length} categories ${operationLabels[operation as keyof typeof operationLabels]}`
      });
      
      onSelectionChange([]);
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-categories'] });
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
    mutationFn: async (categories: any[]) => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(categories);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, categories) => {
      toast({
        title: "Success",
        description: `${categories.length} categories imported successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-categories'] });
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
    const exportData = selectedCategories.length > 0 
      ? categories.filter(c => selectedCategories.includes(c.id))
      : categories;
    
    const formattedData = formatDataForExport(exportData, 'categories');
    exportToCSV(formattedData, `knowledge-categories-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} categories`
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
      const categories = JSON.parse(text);
      
      // Validate structure
      if (!Array.isArray(categories)) {
        throw new Error('File must contain an array of categories');
      }

      // Basic validation for required fields
      const requiredFields = ['name', 'slug'];
      const validCategories = categories.filter(category => 
        requiredFields.every(field => category[field])
      );

      if (validCategories.length === 0) {
        throw new Error('No valid categories found in file');
      }

      if (validCategories.length !== categories.length) {
        toast({
          title: "Warning",
          description: `${categories.length - validCategories.length} categories skipped due to missing required fields`,
          variant: "destructive"
        });
      }

      importMutation.mutate(validCategories);
    } catch (error) {
      let errorMessage = "Invalid JSON file format";
      
      if (error instanceof SyntaxError) {
        errorMessage = "Invalid JSON syntax. Please check your file format.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(categories.map(c => c.id));
    }
  };

  if (categories.length === 0) return null;

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
                disabled={categories.length === 0}
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
                checked={selectedCategories.length === categories.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select All ({selectedCategories.length}/{categories.length})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {selectedCategories.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {selectedCategories.length} selected
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