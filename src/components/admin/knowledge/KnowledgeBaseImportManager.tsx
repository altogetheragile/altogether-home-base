import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseFile } from '@/utils/fileParser';
import { useCreateDataImport, useCreateStagingData } from '@/hooks/useDataImports';

// Knowledge Base column mapping for Excel headers
const KB_COLUMN_MAPPING = {
  'Knowledge Item': 'name',
  'Knowledge Item Description': 'description',
  'Category': 'category_name',
  'Category Description': 'category_description',
  'Planning Focus': 'planning_layer_name',
  'Planning Focus Description': 'planning_layer_description',
  'Domain of Interest': 'domain_name',
  'Domain of Interest Description': 'domain_description',
  'Generic Use Case - Who': 'generic_who',
  'Generic Use Case - What': 'generic_what',
  'Generic Use Case - When': 'generic_when',
  'Generic Use Case - Where': 'generic_where',
  'Generic Use Case - Why': 'generic_why',
  'Generic Use Case - How': 'generic_how',
  'Generic Use Case - How Much': 'generic_how_much',
  'Generic Summary (Narrative Form)': 'generic_summary',
  'Example / Use Case': 'example_title',
  'Example / Use Case - Who': 'example_who',
  'Example / Use Case - What': 'example_what',
  'Example / Use Case - When': 'example_when',
  'Example / Use Case - Where': 'example_where',
  'Example / Use Case - Why': 'example_why',
  'Example / Use Case - How': 'example_how',
  'Example / Use Case - How Much': 'example_how_much',
  'Example / Use Case - Summary (Narrative Form)': 'example_summary',
  'Source': 'source',
  'Background': 'background'
};

interface ImportStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

const KnowledgeBaseImportManager: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [importProgress, setImportProgress] = useState(0);
  const [importSteps, setImportSteps] = useState<ImportStep[]>([
    { step: 1, title: 'Select File', description: 'Choose your Excel file with Knowledge Base data', completed: false },
    { step: 2, title: 'Parse Data', description: 'Extract and validate data from the file', completed: false },
    { step: 3, title: 'Import Data', description: 'Create import record and staging data', completed: false },
    { step: 4, title: 'Process', description: 'Process and normalize into Knowledge Base tables', completed: false }
  ]);

  const { toast } = useToast();
  const createImport = useCreateDataImport();
  const createStagingData = useCreateStagingData();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          file.type !== 'application/vnd.ms-excel') {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      updateStepStatus(1, true);
      setCurrentStep(2);
    }
  };

  const updateStepStatus = (step: number, completed: boolean) => {
    setImportSteps(prev => prev.map(s => 
      s.step === step ? { ...s, completed } : s
    ));
  };

  const handleParseAndImport = async () => {
    if (!selectedFile) return;

    try {
      setImportProgress(25);
      
      // Parse the file
      const parseResult = await parseFile(selectedFile);
      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse file');
      }

      updateStepStatus(2, true);
      setCurrentStep(3);
      setImportProgress(50);

      // Validate required columns
      const requiredColumns = ['Knowledge Item', 'Category', 'Planning Focus', 'Domain of Interest'];
      const missingColumns = requiredColumns.filter(col => 
        !parseResult.data!.headers.includes(col)
      );

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Create import record with proper field mapping structure
      const importRecord = await createImport.mutateAsync({
        filename: selectedFile.name,
        original_filename: selectedFile.name,
        file_type: 'excel',
        file_size: selectedFile.size,
        target_entity: 'knowledge_items',
        mapping_config: { 
          field_mappings: KB_COLUMN_MAPPING 
        },
        status: 'uploaded'
      });

      updateStepStatus(3, true);
      setCurrentStep(4);
      setImportProgress(75);

      // Create staging data
      const stagingRows = parseResult.data!.data.map((row, index) => ({
        import_id: importRecord.id,
        row_number: index + 1,
        raw_data: row,
        mapped_data: mapRowData(row),
        validation_status: 'pending' as const,
        processing_status: 'pending' as const
      }));

      await createStagingData.mutateAsync(stagingRows);

      updateStepStatus(4, true);
      setImportProgress(100);

      toast({
        title: "Import Successful",
        description: `Successfully imported ${parseResult.data!.rowCount} rows. Data is ready for processing.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const mapRowData = (row: Record<string, any>) => {
    const mapped: Record<string, any> = {};
    
    Object.entries(KB_COLUMN_MAPPING).forEach(([excelHeader, dbField]) => {
      if (row[excelHeader] !== undefined && row[excelHeader] !== '') {
        mapped[dbField] = row[excelHeader];
      }
    });

    return mapped;
  };

  const resetImport = () => {
    setSelectedFile(null);
    setCurrentStep(1);
    setImportProgress(0);
    setImportSteps(prev => prev.map(s => ({ ...s, completed: false })));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Knowledge Base Import Manager
          </CardTitle>
          <CardDescription>
            Import Knowledge Base data from Excel files with automated mapping and processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Import Progress</h3>
              <span className="text-sm text-muted-foreground">{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="w-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {importSteps.map((step) => (
                <div 
                  key={step.step} 
                  className={`p-4 border rounded-lg ${
                    step.completed ? 'bg-green-50 border-green-200' : 
                    currentStep === step.step ? 'bg-blue-50 border-blue-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : currentStep === step.step ? (
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="font-medium text-sm">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* File Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label htmlFor="file-upload">Select Knowledge Base Excel File</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please ensure your Excel file contains the required columns: Knowledge Item, Category, Planning Focus, and Domain of Interest.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* File Selected */}
          {selectedFile && currentStep >= 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">Selected File</h4>
                <p className="text-sm text-blue-700">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>

              {currentStep === 2 && (
                <Button 
                  onClick={handleParseAndImport}
                  disabled={createImport.isPending || createStagingData.isPending}
                  className="w-full"
                >
                  {createImport.isPending || createStagingData.isPending ? 'Processing...' : 'Parse and Import Data'}
                </Button>
              )}
            </div>
          )}

          {/* Import Complete */}
          {importProgress === 100 && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import completed successfully! The data has been staged and is ready for processing into the Knowledge Base.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button onClick={resetImport} variant="outline">
                  Import Another File
                </Button>
                <Button onClick={() => navigate('/admin/imports')}>
                  View Import Status
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Column Mapping Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Column Mapping Reference</CardTitle>
          <CardDescription>
            How Excel columns map to Knowledge Base fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(KB_COLUMN_MAPPING).map(([excel, db]) => (
              <div key={excel} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-mono text-blue-600">{excel}</span>
                <span className="text-muted-foreground">→ {db}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseImportManager;