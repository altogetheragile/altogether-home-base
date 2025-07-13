import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeTechniques } from '@/hooks/useKnowledgeTechniques';

export const BulkContentOperations = () => {
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [operationProgress, setOperationProgress] = useState(0);
  const [isOperationRunning, setIsOperationRunning] = useState(false);
  const [operationResults, setOperationResults] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: techniques = [] } = useKnowledgeTechniques({
    search: '',
    categoryId: '',
    sortBy: 'name'
  });

  // Export techniques mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (selectedTechniques.length === 0) {
        throw new Error('No techniques selected');
      }

      setIsOperationRunning(true);
      setOperationProgress(0);

      const { data } = await supabase
        .from('knowledge_techniques')
        .select(`
          *,
          knowledge_categories(name, slug),
          knowledge_technique_tags(
            knowledge_tags(name, slug)
          ),
          knowledge_media(*),
          knowledge_examples(*)
        `)
        .in('id', selectedTechniques);

      setOperationProgress(100);
      return data;
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const exportData = {
        exported_at: new Date().toISOString(),
        techniques: data,
        count: data?.length || 0
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge-techniques-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsOperationRunning(false);
      toast({
        title: "Export Complete",
        description: `Successfully exported ${data?.length || 0} techniques.`,
      });
    },
    onError: (error) => {
      setIsOperationRunning(false);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Bulk publish/unpublish mutation
  const publishMutation = useMutation({
    mutationFn: async ({ isPublished }: { isPublished: boolean }) => {
      if (selectedTechniques.length === 0) {
        throw new Error('No techniques selected');
      }

      setIsOperationRunning(true);
      setOperationProgress(0);

      const results = [];
      const total = selectedTechniques.length;

      for (let i = 0; i < selectedTechniques.length; i++) {
        const techniqueId = selectedTechniques[i];
        
        try {
          const { error } = await supabase
            .from('knowledge_techniques')
            .update({ is_published: isPublished })
            .eq('id', techniqueId);

          if (error) throw error;

          results.push({
            id: techniqueId,
            success: true,
            action: isPublished ? 'published' : 'unpublished'
          });
        } catch (error) {
          results.push({
            id: techniqueId,
            success: false,
            error: error.message,
            action: isPublished ? 'publish' : 'unpublish'
          });
        }

        setOperationProgress(((i + 1) / total) * 100);
      }

      return results;
    },
    onSuccess: (results) => {
      setOperationResults(results);
      setIsOperationRunning(false);
      queryClient.invalidateQueries({ queryKey: ['knowledge-techniques'] });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      toast({
        title: "Bulk Operation Complete",
        description: `${successCount} successful, ${failCount} failed`,
      });
    },
    onError: (error) => {
      setIsOperationRunning(false);
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Bulk delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (selectedTechniques.length === 0) {
        throw new Error('No techniques selected');
      }

      setIsOperationRunning(true);
      setOperationProgress(0);

      const results = [];
      const total = selectedTechniques.length;

      for (let i = 0; i < selectedTechniques.length; i++) {
        const techniqueId = selectedTechniques[i];
        
        try {
          // Delete related records first
          await supabase.from('knowledge_technique_tags').delete().eq('technique_id', techniqueId);
          await supabase.from('knowledge_media').delete().eq('technique_id', techniqueId);
          await supabase.from('knowledge_examples').delete().eq('technique_id', techniqueId);
          await supabase.from('kb_feedback').delete().eq('technique_id', techniqueId);
          
          // Delete the technique
          const { error } = await supabase
            .from('knowledge_techniques')
            .delete()
            .eq('id', techniqueId);

          if (error) throw error;

          results.push({
            id: techniqueId,
            success: true,
            action: 'deleted'
          });
        } catch (error) {
          results.push({
            id: techniqueId,
            success: false,
            error: error.message,
            action: 'delete'
          });
        }

        setOperationProgress(((i + 1) / total) * 100);
      }

      return results;
    },
    onSuccess: (results) => {
      setOperationResults(results);
      setIsOperationRunning(false);
      setSelectedTechniques([]);
      queryClient.invalidateQueries({ queryKey: ['knowledge-techniques'] });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      toast({
        title: "Bulk Delete Complete",
        description: `${successCount} deleted, ${failCount} failed`,
      });
    },
    onError: (error) => {
      setIsOperationRunning(false);
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTechniques(techniques.map(t => t.id));
    } else {
      setSelectedTechniques([]);
    }
  };

  const handleSelectTechnique = (techniqueId: string, checked: boolean) => {
    if (checked) {
      setSelectedTechniques(prev => [...prev, techniqueId]);
    } else {
      setSelectedTechniques(prev => prev.filter(id => id !== techniqueId));
    }
  };

  const resetResults = () => {
    setOperationResults([]);
    setOperationProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Bulk Operations</h3>
        <p className="text-sm text-muted-foreground">
          Manage multiple techniques at once with bulk operations.
        </p>
      </div>

      <Tabs defaultValue="operations" className="w-full">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="selection">
            Selection ({selectedTechniques.length})
          </TabsTrigger>
          {operationResults.length > 0 && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </CardTitle>
                <CardDescription>
                  Export selected techniques as JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => exportMutation.mutate()}
                  disabled={selectedTechniques.length === 0 || isOperationRunning}
                >
                  Export {selectedTechniques.length} Techniques
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Publish
                </CardTitle>
                <CardDescription>
                  Make techniques publicly visible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => publishMutation.mutate({ isPublished: true })}
                  disabled={selectedTechniques.length === 0 || isOperationRunning}
                >
                  Publish Selected
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Unpublish
                </CardTitle>
                <CardDescription>
                  Hide techniques from public view
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => publishMutation.mutate({ isPublished: false })}
                  disabled={selectedTechniques.length === 0 || isOperationRunning}
                >
                  Unpublish Selected
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </CardTitle>
                <CardDescription>
                  Permanently remove techniques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={selectedTechniques.length === 0 || isOperationRunning}
                >
                  Delete Selected
                </Button>
              </CardContent>
            </Card>
          </div>

          {isOperationRunning && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(operationProgress)}%
                    </span>
                  </div>
                  <Progress value={operationProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="selection" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Select Techniques</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTechniques.length === techniques.length && techniques.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select All</span>
                </div>
              </div>
              <CardDescription>
                Choose which techniques to include in bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {techniques.map((technique) => (
                  <div 
                    key={technique.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTechniques.includes(technique.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTechnique(technique.id, !!checked)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{technique.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={technique.is_published ? 'default' : 'secondary'}>
                            {technique.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="outline">
                            {technique.difficulty_level || 'No level'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {operationResults.length > 0 && (
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Operation Results</CardTitle>
                  <Button variant="outline" size="sm" onClick={resetResults}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Results
                  </Button>
                </div>
                <CardDescription>
                  Summary of the last bulk operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {operationResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Technique {result.id.slice(0, 8)}... - {result.action}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};