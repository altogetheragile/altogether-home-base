import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { useCreateDataImport, useCreateStagingData } from '@/hooks/useDataImports';
import { parseFile, validateFileSize, getFileSizeDisplay } from '@/utils/fileParser';
import { useToast } from '@/hooks/use-toast';

const targetEntities = [
  { value: 'knowledge_items', label: 'Knowledge Items' },
  { value: 'events', label: 'Events' },
  { value: 'instructors', label: 'Instructors' },
  { value: 'categories', label: 'Categories' },
  { value: 'tags', label: 'Tags' },
  { value: 'learning_paths', label: 'Learning Paths' },
];

export const ImportUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetEntity, setTargetEntity] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const createImport = useCreateDataImport();
  const createStagingData = useCreateStagingData();
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!validateFileSize(selectedFile)) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const fileType = selectedFile.name.toLowerCase();
    if (!fileType.endsWith('.xlsx') && !fileType.endsWith('.xls') && !fileType.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an Excel (.xlsx, .xls) or CSV (.csv) file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !targetEntity) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a file and target entity.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Parse the file
      const parseResult = await parseFile(file);
      
      if (!parseResult.success || !parseResult.data) {
        toast({
          title: 'Parse Error',
          description: parseResult.error || 'Failed to parse file',
          variant: 'destructive',
        });
        return;
      }

      const { data: parsedData } = parseResult;

      // Create import record
      const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
      const importRecord = await createImport.mutateAsync({
        filename: file.name,
        original_filename: file.name,
        file_type: fileType,
        target_entity: targetEntity as any,
        file_size: file.size,
        total_rows: parsedData.rowCount,
        mapping_config: {
          headers: parsedData.headers,
          detected_mappings: {},
        },
      });

      // Create staging data records
      const stagingRows = parsedData.data.map((row, index) => ({
        import_id: importRecord.id,
        row_number: index + 1,
        raw_data: row,
      }));

      await createStagingData.mutateAsync(stagingRows);

      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${parsedData.rowCount} rows. You can now preview and process the data.`,
      });

      // Reset form
      setFile(null);
      setTargetEntity('');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Data File</CardTitle>
        <CardDescription>
          Upload Excel (.xlsx, .xls) or CSV (.csv) files to import data into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="target-entity">Target Entity</Label>
          <Select value={targetEntity} onValueChange={setTargetEntity}>
            <SelectTrigger>
              <SelectValue placeholder="Select what type of data you're importing" />
            </SelectTrigger>
            <SelectContent>
              {targetEntities.map((entity) => (
                <SelectItem key={entity.value} value={entity.value}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>File Upload</Label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getFileSizeDisplay(file.size)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Drop your file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">
                    Supports Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {file && (
          <div className="bg-info/10 border border-info/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-info mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-info">Preview Before Processing</p>
                <p className="text-info/80 mt-1">
                  After uploading, you'll be able to preview the data and configure column mappings 
                  before processing it into the main database tables.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setTargetEntity('');
            }}
            disabled={isUploading}
          >
            Clear
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !targetEntity || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};