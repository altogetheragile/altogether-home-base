import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataImport } from '@/hooks/useDataImports';

interface ProcessDataButtonProps {
  importRecord: DataImport;
  onProcessingComplete: () => void;
}

export const ProcessDataButton: React.FC<ProcessDataButtonProps> = ({ 
  importRecord, 
  onProcessingComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const { toast } = useToast();

  const processKnowledgeItem = async (stagingRow: any, fieldMappings: Record<string, string>) => {
    try {
      const mappedData: any = {};
      
      // Map basic fields
      Object.entries(fieldMappings).forEach(([targetField, sourceColumn]) => {
        if (sourceColumn && stagingRow.raw_data[sourceColumn]) {
          let value = stagingRow.raw_data[sourceColumn];
          
          // Handle special field types
          if (targetField.includes('_min') || targetField.includes('_max') || targetField === 'estimated_reading_time') {
            value = parseInt(value) || null;
          } else if (targetField.startsWith('is_')) {
            value = String(value).toLowerCase() === 'true';
          } else if (targetField.includes('keywords') || targetField === 'tags') {
            value = String(value).split(',').map(s => s.trim()).filter(Boolean);
          } else if (['typical_participants', 'required_skills', 'success_criteria', 'common_pitfalls', 'related_practices'].includes(targetField)) {
            value = String(value).split('|').map(s => s.trim()).filter(Boolean);
          }
          
          mappedData[targetField] = value;
        }
      });

      // Generate slug if not provided
      if (!mappedData.slug && mappedData.name) {
        mappedData.slug = mappedData.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
      }

      // Set defaults for published knowledge items
      mappedData.content_type = 'technique';
      mappedData.is_published = true;
      mappedData.is_complete = true;
      mappedData.is_featured = false;
      
      // Handle dimension lookups (categories, focus, etc.)
      if (fieldMappings.category_name && stagingRow.raw_data[fieldMappings.category_name]) {
        const categoryName = stagingRow.raw_data[fieldMappings.category_name];
        let { data: category } = await supabase
          .from('knowledge_categories')
          .select('id')
          .eq('name', categoryName)
          .maybeSingle();
        
        if (!category) {
          // Create category if it doesn't exist
          const { data: newCategory } = await supabase
            .from('knowledge_categories')
            .insert([{
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              description: stagingRow.raw_data['Category Description'] || null,
              full_description: stagingRow.raw_data['Category Description'] || null
            }])
            .select('id')
            .single();
          category = newCategory;
        }
        
        if (category) mappedData.category_id = category.id;
      }

      if (fieldMappings.activity_focus_name && stagingRow.raw_data[fieldMappings.activity_focus_name]) {
        const focusName = stagingRow.raw_data[fieldMappings.activity_focus_name];
        const { data: focus } = await supabase
          .from('activity_focus')
          .select('id')
          .eq('name', focusName)
          .single();
        if (focus) mappedData.activity_focus_id = focus.id;
      }

      if (fieldMappings.activity_domain_name && stagingRow.raw_data[fieldMappings.activity_domain_name]) {
        const domainName = stagingRow.raw_data[fieldMappings.activity_domain_name];
        let { data: domain } = await supabase
          .from('activity_domains')
          .select('id')
          .eq('name', domainName)
          .maybeSingle();
        
        if (!domain) {
          // Create domain if it doesn't exist
          const { data: newDomain } = await supabase
            .from('activity_domains')
            .insert([{
              name: domainName,
              slug: domainName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              description: stagingRow.raw_data['Domain of Interest Description'] || null,
              full_description: stagingRow.raw_data['Domain of Interest Description'] || null
            }])
            .select('id')
            .single();
          domain = newDomain;
        }
        
        if (domain) mappedData.activity_domain_id = domain.id;
      }

      if (fieldMappings.activity_category_name && stagingRow.raw_data[fieldMappings.activity_category_name]) {
        const categoryName = stagingRow.raw_data[fieldMappings.activity_category_name];
        const { data: category } = await supabase
          .from('activity_categories')
          .select('id')
          .eq('name', categoryName)
          .single();
        if (category) mappedData.activity_category_id = category.id;
      }

      // Insert knowledge item
      const { data: knowledgeItem, error } = await supabase
        .from('knowledge_items')
        .insert([mappedData])
        .select('id')
        .single();

      if (error) throw error;

      // Handle planning layers (single layer, not comma-separated)
      if (fieldMappings.planning_layers && stagingRow.raw_data[fieldMappings.planning_layers]) {
        const layerName = stagingRow.raw_data[fieldMappings.planning_layers];
        let { data: layer } = await supabase
          .from('planning_layers')
          .select('id')
          .eq('name', layerName)
          .maybeSingle();
        
        if (!layer) {
          // Create planning layer if it doesn't exist
          const { data: newLayer } = await supabase
            .from('planning_layers')
            .insert([{
              name: layerName,
              slug: layerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              description: stagingRow.raw_data['Planning Layer Description'] || null
            }])
            .select('id')
            .single();
          layer = newLayer;
        }
        
        if (layer) {
          await supabase
            .from('knowledge_item_planning_layers')
            .insert([{
              knowledge_item_id: knowledgeItem.id,
              planning_layer_id: layer.id,
              is_primary: true
            }]);
        }
      }

      // Handle tags
      if (fieldMappings.tags && stagingRow.raw_data[fieldMappings.tags]) {
        const tagNames = mappedData.tags || [];
        
        for (const tagName of tagNames) {
          // Get or create tag
          let { data: tag } = await supabase
            .from('knowledge_tags')
            .select('id')
            .eq('name', tagName)
            .single();
          
          if (!tag) {
            const { data: newTag } = await supabase
              .from('knowledge_tags')
              .insert([{ 
                name: tagName, 
                slug: tagName.toLowerCase().replace(/[^a-z0-9]/g, '-')
              }])
              .select('id')
              .single();
            tag = newTag;
          }
          
          if (tag) {
            await supabase
              .from('knowledge_item_tags')
              .insert([{
                knowledge_item_id: knowledgeItem.id,
                tag_id: tag.id
              }]);
          }
        }
      }

      // Update staging row as processed
      await supabase
        .from('staging_data')
        .update({
          processing_status: 'processed',
          target_record_id: knowledgeItem.id,
          mapped_data: mappedData,
          processed_at: new Date().toISOString()
        })
        .eq('id', stagingRow.id);

      return { success: true, recordId: knowledgeItem.id };
    } catch (error) {
      console.error('Processing error for row:', stagingRow.row_number, error);
      
      // Update staging row as failed
      await supabase
        .from('staging_data')
        .update({
          processing_status: 'failed',
          processing_errors: [error instanceof Error ? error.message : String(error)],
          processed_at: new Date().toISOString()
        })
        .eq('id', stagingRow.id);

      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const processData = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setErrorCount(0);
    
    try {
      setCurrentAction('Fetching staging data...');
      
      // Get all staging data for this import
      const { data: stagingData, error: stagingError } = await supabase
        .from('staging_data')
        .select('*')
        .eq('import_id', importRecord.id)
        .eq('processing_status', 'pending')
        .order('row_number');

      if (stagingError) throw stagingError;

      if (!stagingData || stagingData.length === 0) {
        toast({
          title: 'No Data to Process',
          description: 'All rows have already been processed or no data found.',
          variant: 'destructive',
        });
        return;
      }

      // Auto-configure field mappings if not set
      let fieldMappings = importRecord.mapping_config?.field_mappings || {};
      
      if (Object.keys(fieldMappings).length === 0 && stagingData.length > 0) {
        // Auto-map based on Excel column names for the 2025 knowledge items structure
        const sampleRow = stagingData[0].raw_data;
        fieldMappings = {
          name: 'Knowledge Item',
          description: 'Knowledge Item Description',
          summary: 'Generic Summary (Narrative Form)',
          generic_who: 'Generic Use Case - Who',
          generic_what: 'Generic Use Case - What',
          generic_when: 'Generic Use Case - When',
          generic_where: 'Generic Use Case - Where',
          generic_why: 'Generic Use Case - Why',
          generic_how: 'Generic Use Case - How',
          generic_how_much: 'Generic Use Case - How Much',
          example_who: 'Example / Use Case - Who',
          example_what: 'Example / Use Case - What',
          example_when: 'Example / Use Case - When',
          example_where: 'Example / Use Case - Where',
          example_why: 'Example / Use Case - Why',
          example_how: 'Example / Use Case - How',
          example_how_much: 'Example / Use Case - How Much',
          example_summary: 'Example / Use Case - Summary (Narrative Form)',
          source: 'Source',
          background: 'Background',
          category_name: 'Category',
          activity_domain_name: 'Domain of Interest',
          planning_layers: 'Planning Layer'
        };
        
        // Update the import record with these mappings
        await supabase
          .from('data_imports')
          .update({ 
            mapping_config: { 
              ...importRecord.mapping_config,
              field_mappings: fieldMappings
            }
          })
          .eq('id', importRecord.id);
      }

      const totalRows = stagingData.length;
      let processed = 0;
      let errors = 0;

      // Update import status
      await supabase
        .from('data_imports')
        .update({ status: 'processing' })
        .eq('id', importRecord.id);

      // Process each row
      for (const stagingRow of stagingData) {
        setCurrentAction(`Processing row ${stagingRow.row_number}...`);
        
        if (importRecord.target_entity === 'knowledge_items') {
          const result = await processKnowledgeItem(stagingRow, fieldMappings);
          if (result.success) {
            processed++;
          } else {
            errors++;
          }
        }
        
        setProcessedCount(processed);
        setErrorCount(errors);
        setProgress(((processed + errors) / totalRows) * 100);
      }

      // Update final import status
      await supabase
        .from('data_imports')
        .update({ 
          status: errors === 0 ? 'completed' : 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', importRecord.id);

      toast({
        title: 'Processing Complete',
        description: `Successfully processed ${processed} rows with ${errors} errors.`,
      });

      onProcessingComplete();
    } catch (error) {
      console.error('Processing failed:', error);
      
      // Update import as failed
      await supabase
        .from('data_imports')
        .update({ 
          status: 'failed',
          processing_log: [{ 
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : String(error)
          }]
        })
        .eq('id', importRecord.id);

      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setCurrentAction('');
    }
  };

  const canProcess = () => {
    // Allow processing if we have data, as we now have auto-mapping
    return importRecord.status !== 'processing' && importRecord.total_rows > 0;
  };

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Processing Data</span>
          </CardTitle>
          <CardDescription>
            {currentAction}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>Processed: {processedCount}</span>
            <span>Errors: {errorCount}</span>
            <span>{progress.toFixed(1)}% complete</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canProcess()) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cannot process import: {importRecord.status === 'processing' ? 'Already processing' : 'No data to process'}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready to Process</CardTitle>
        <CardDescription>
          Process {importRecord.total_rows} rows and create knowledge items in the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={processData} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Process Data
        </Button>
      </CardContent>
    </Card>
  );
};