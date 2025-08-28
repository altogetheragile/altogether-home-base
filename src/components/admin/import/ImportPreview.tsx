import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DataImport } from '@/hooks/useDataImports';
import { useStagingData } from '@/hooks/useDataImports';
import { ColumnMapper } from './ColumnMapper';
import { format } from 'date-fns';

interface ImportPreviewProps {
  importRecord: DataImport;
  onBack: () => void;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({ importRecord, onBack }) => {
  const { data: stagingData = [], isLoading } = useStagingData(importRecord.id, 50);
  const [activeTab, setActiveTab] = useState('preview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-success';
      case 'invalid':
        return 'text-destructive';
      case 'processed':
        return 'text-primary';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProcessingProgress = () => {
    if (importRecord.total_rows === 0) return 0;
    const processed = importRecord.successful_rows + importRecord.failed_rows;
    return (processed / importRecord.total_rows) * 100;
  };

  const sampleData = stagingData.slice(0, 10);
  const headers = Object.keys(sampleData[0]?.raw_data || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Imports
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {importRecord.original_filename || importRecord.filename}
          </h2>
          <p className="text-muted-foreground">
            Import Preview • Target: {importRecord.target_entity.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Rows</p>
                <p className="text-2xl font-bold">{importRecord.total_rows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Successful</p>
                <p className="text-2xl font-bold text-success">{importRecord.successful_rows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold text-destructive">{importRecord.failed_rows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {importRecord.total_rows > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={getProcessingProgress()} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {importRecord.successful_rows + importRecord.failed_rows} / {importRecord.total_rows} processed
                </span>
                <span>
                  {getProcessingProgress().toFixed(1)}% complete
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="mapping">Column Mapping</TabsTrigger>
          <TabsTrigger value="validation">Validation Results</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data Preview</CardTitle>
              <CardDescription>
                Showing first 10 rows of imported data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading preview...</div>
              ) : sampleData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data to preview</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        {headers.map((header) => (
                          <TableHead key={header} className="min-w-[150px]">
                            {header}
                          </TableHead>
                        ))}
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.row_number}</TableCell>
                          {headers.map((header) => (
                            <TableCell key={header} className="max-w-[200px] truncate">
                              {String(row.raw_data[header] || '')}
                            </TableCell>
                          ))}
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(row.validation_status)}>
                              {row.validation_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <ColumnMapper importRecord={importRecord} headers={headers} />
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
              <CardDescription>
                Validation errors and issues found in the data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stagingData.filter(row => row.validation_errors.length > 0).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                  <p className="text-muted-foreground">No validation errors found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stagingData
                    .filter(row => row.validation_errors.length > 0)
                    .slice(0, 10)
                    .map((row) => (
                      <div key={row.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Row {row.row_number}</span>
                          <Badge variant="destructive">
                            {row.validation_errors.length} error(s)
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {row.validation_errors.map((error, index) => (
                            <div key={index} className="text-sm text-destructive flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{String(error)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};