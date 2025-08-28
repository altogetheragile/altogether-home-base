import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Eye, Trash2, Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useDataImports, useDeleteDataImport, DataImport } from '@/hooks/useDataImports';
import { ImportUploader } from './ImportUploader';
import { ImportPreview } from './ImportPreview';
import { getFileSizeDisplay } from '@/utils/fileParser';
import { format } from 'date-fns';

const ImportManager: React.FC = () => {
  const { data: imports = [], isLoading } = useDataImports();
  const deleteImport = useDeleteDataImport();
  const [selectedImport, setSelectedImport] = useState<DataImport | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const getStatusIcon = (status: DataImport['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      case 'uploaded':
        return <AlertTriangle className="h-4 w-4 text-info" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-muted" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: DataImport['status']) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'processing':
        return 'outline' as const;
      case 'uploaded':
        return 'secondary' as const;
      case 'cancelled':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const handlePreview = (importRecord: DataImport) => {
    setSelectedImport(importRecord);
    setShowPreview(true);
  };

  const handleDelete = async (importId: string) => {
    if (confirm('Are you sure you want to delete this import? This will also remove all associated staging data.')) {
      deleteImport.mutate(importId);
    }
  };

  const getProgress = (importRecord: DataImport) => {
    if (importRecord.total_rows === 0) return 0;
    const processedRows = importRecord.successful_rows + importRecord.failed_rows;
    return (processedRows / importRecord.total_rows) * 100;
  };

  if (showPreview && selectedImport) {
    return (
      <ImportPreview
        importRecord={selectedImport}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Import Manager</h2>
          <p className="text-muted-foreground">
            Upload and manage data imports from Excel and CSV files
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <ImportUploader />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading imports...</div>
            </div>
          ) : imports.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No imports found. Upload a file to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {imports.map((importRecord) => (
                <Card key={importRecord.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(importRecord.status)}
                        <div>
                          <CardTitle className="text-lg">
                            {importRecord.original_filename || importRecord.filename}
                          </CardTitle>
                          <CardDescription>
                            Target: {importRecord.target_entity.replace('_', ' ')} • 
                            {importRecord.file_size && ` ${getFileSizeDisplay(importRecord.file_size)} • `}
                            Uploaded {format(new Date(importRecord.created_at), 'MMM d, yyyy HH:mm')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusVariant(importRecord.status)}>
                          {importRecord.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(importRecord)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(importRecord.id)}
                          disabled={deleteImport.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {importRecord.total_rows > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {importRecord.successful_rows + importRecord.failed_rows} / {importRecord.total_rows} rows
                          </span>
                        </div>
                        <Progress value={getProgress(importRecord)} className="h-2" />
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span className="text-success">✓ {importRecord.successful_rows} successful</span>
                          <span className="text-destructive">✗ {importRecord.failed_rows} failed</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportManager;