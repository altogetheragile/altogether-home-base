import { supabase } from "@/integrations/supabase/client";

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to generate random colors
function generateColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Find or create category
async function findOrCreateCategory(name: string, description?: string): Promise<string> {
  if (!name || name.trim() === '') return '';
  
  const slug = createSlug(name);
  
  // First try to find existing category
  const { data: existing } = await supabase
    .from('knowledge_categories')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) return existing.id;
  
  // Create new category
  const { data: newCategory, error } = await supabase
    .from('knowledge_categories')
    .insert({
      name: name.trim(),
      slug,
      description: description || null,
      full_description: description || null,
      color: generateColor()
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return newCategory.id;
}

// Find or create planning layer
async function findOrCreatePlanningLayer(name: string, description?: string): Promise<string> {
  if (!name || name.trim() === '') return '';
  
  const slug = createSlug(name);
  
  // First try to find existing layer
  const { data: existing } = await supabase
    .from('planning_layers')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) return existing.id;
  
  // Get next display order
  const { data: maxOrder } = await supabase
    .from('planning_layers')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();
  
  const nextOrder = (maxOrder?.display_order || 0) + 1;
  
  // Create new planning layer
  const { data: newLayer, error } = await supabase
    .from('planning_layers')
    .insert({
      name: name.trim(),
      slug,
      description: description || null,
      full_description: description || null,
      color: generateColor(),
      display_order: nextOrder
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return newLayer.id;
}

// Find or create activity domain
async function findOrCreateActivityDomain(name: string, description?: string): Promise<string> {
  if (!name || name.trim() === '') return '';
  
  const slug = createSlug(name);
  
  // First try to find existing domain
  const { data: existing } = await supabase
    .from('activity_domains')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing) return existing.id;
  
  // Create new activity domain
  const { data: newDomain, error } = await supabase
    .from('activity_domains')
    .insert({
      name: name.trim(),
      slug,
      description: description || null,
      full_description: description || null,
      color: generateColor()
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return newDomain.id;
}

// Helper function to parse array fields
function parseArrayField(value: string): string[] | null {
  if (!value || value.trim() === '') return null;
  
  // Split by common delimiters and clean up
  return value
    .split(/[,;|]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Process the knowledge import
export async function processKnowledgeImportNew(importId: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log('🚀 Starting knowledge import process for import:', importId);
    
    // Get import record
    const { data: importRecord, error: importError } = await supabase
      .from('data_imports')
      .select('*')
      .eq('id', importId)
      .single();
    
    if (importError || !importRecord) {
      throw new Error('Import record not found');
    }
    
    // Get the field mappings from the import record
    const fieldMappings = (importRecord.mapping_config?.field_mappings || {}) as Record<string, string>;
    console.log('📋 Using field mappings:', fieldMappings);
    
    if (Object.keys(fieldMappings).length === 0) {
      throw new Error('No field mappings configured for this import');
    }
    
    // Get staging data
    const { data: stagingData, error: stagingError } = await supabase
      .from('staging_data')
      .select('*')
      .eq('import_id', importId)
      .eq('processing_status', 'pending');
    
    if (stagingError) throw stagingError;
    
    if (!stagingData || stagingData.length === 0) {
      return { success: false, message: 'No pending data found to process' };
    }
    
    console.log(`📊 Processing ${stagingData.length} knowledge items`);
    
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each row
    for (const row of stagingData) {
      try {
        const rawData = row.raw_data as any;
        console.log('🔍 Processing row with data:', Object.keys(rawData));
        
        // Map Excel data to KI fields using the configured mapping
        const kiData: any = {
          content_type: 'technique',
          is_published: true,
          is_featured: false,
          is_complete: true,
          view_count: 0,
          popularity_score: 0,
          estimated_reading_time: 5,
        };
        
        // Map all fields using the configured field mappings
        Object.entries(fieldMappings).forEach(([dbField, excelCol]) => {
          if (!excelCol) return; // Skip unmapped fields
          
          const value = rawData[excelCol];
          console.log(`📝 Mapping ${excelCol} -> ${dbField}:`, value);
          
          if (value !== undefined && value !== null && value !== '') {
            // Handle array fields
            if (['required_skills', 'success_criteria', 'common_pitfalls', 'related_practices', 'typical_participants'].includes(dbField)) {
              kiData[dbField] = parseArrayField(String(value));
            }
            // Handle numeric fields
            else if (['duration_min_minutes', 'duration_max_minutes', 'team_size_min', 'team_size_max'].includes(dbField)) {
              const numValue = parseInt(String(value));
              if (!isNaN(numValue)) {
                kiData[dbField] = numValue;
              }
            }
            // Handle text fields
            else {
              kiData[dbField] = String(value).trim();
            }
          }
        });
        
        // Generate slug if not provided
        if (!kiData.slug && kiData.name) {
          kiData.slug = createSlug(kiData.name);
        }
        
        // Handle category (get the mapped column name)
        let categoryId = '';
        const categoryCol = Object.entries(fieldMappings).find(([field]) => field === 'category_name')?.[1];
        const categoryDescCol = Object.entries(fieldMappings).find(([field]) => field === 'category_description')?.[1];
        if (categoryCol && rawData[categoryCol]) {
          categoryId = await findOrCreateCategory(
            rawData[categoryCol],
            categoryDescCol ? rawData[categoryDescCol] : undefined
          );
        }
        
        // Handle planning layer (get the mapped column name)
        let planningLayerId = '';
        const planningCol = Object.entries(fieldMappings).find(([field]) => field === 'planning_layers')?.[1];
        const planningDescCol = Object.entries(fieldMappings).find(([field]) => field === 'planning_layer_description')?.[1];
        if (planningCol && rawData[planningCol]) {
          planningLayerId = await findOrCreatePlanningLayer(
            rawData[planningCol],
            planningDescCol ? rawData[planningDescCol] : undefined
          );
        }
        
        // Handle activity domain (get the mapped column name)
        let activityDomainId = '';
        const domainCol = Object.entries(fieldMappings).find(([field]) => field === 'activity_domain_name')?.[1];
        const domainDescCol = Object.entries(fieldMappings).find(([field]) => field === 'domain_description')?.[1];
        if (domainCol && rawData[domainCol]) {
          activityDomainId = await findOrCreateActivityDomain(
            rawData[domainCol],
            domainDescCol ? rawData[domainDescCol] : undefined
          );
        }
        
        // Remove category/domain/layer fields from kiData since they're handled separately
        delete kiData.category_name;
        delete kiData.category_description;
        delete kiData.planning_layer_name;
        delete kiData.planning_layer_description;
        delete kiData.domain_name;
        delete kiData.domain_description;
        
        // Set foreign key relationships
        if (categoryId) kiData.category_id = categoryId;
        if (activityDomainId) kiData.activity_domain_id = activityDomainId;
        
        // Insert knowledge item
        const { data: newKI, error: kiError } = await supabase
          .from('knowledge_items')
          .insert(kiData)
          .select('id')
          .single();
        
        if (kiError) throw kiError;
        
        // Create planning layer relationship if we have both
        if (newKI && planningLayerId) {
          await supabase
            .from('knowledge_item_planning_layers')
            .insert({
              knowledge_item_id: newKI.id,
              planning_layer_id: planningLayerId,
              is_primary: true
            });
        }
        
        // Update staging data as processed
        await supabase
          .from('staging_data')
          .update({
            processing_status: 'processed',
            processing_result: { 
              knowledge_item_id: newKI.id,
              category_id: categoryId,
              planning_layer_id: planningLayerId,
              activity_domain_id: activityDomainId
            }
          })
          .eq('id', row.id);
        
        processedCount++;
        console.log(`✅ Processed KI: ${kiData.name}`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Row ${row.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌ Error processing row:', error);
        
        // Update staging data as failed
        await supabase
          .from('staging_data')
          .update({
            processing_status: 'failed',
            processing_result: { error: errorMsg }
          })
          .eq('id', row.id);
      }
    }
    
    // Update import status
    const status = errorCount === 0 ? 'completed' : 'completed_with_errors';
    await supabase
      .from('data_imports')
      .update({
        status,
        processed_at: new Date().toISOString(),
        processing_log: [
          ...importRecord.processing_log || [],
          {
            timestamp: new Date().toISOString(),
            message: `Processed ${processedCount} items, ${errorCount} errors`,
            details: { processedCount, errorCount, errors: errors.slice(0, 5) }
          }
        ]
      })
      .eq('id', importId);
    
    const message = `Successfully processed ${processedCount} knowledge items${errorCount > 0 ? ` with ${errorCount} errors` : ''}`;
    console.log('🎉 Import completed:', message);
    
    return {
      success: true,
      message,
      details: { processedCount, errorCount, errors: errors.slice(0, 10) }
    };
    
  } catch (error) {
    console.error('💥 Import process failed:', error);
    
    // Update import status as failed
    await supabase
      .from('data_imports')
      .update({
        status: 'failed',
        processing_log: [
          {
            timestamp: new Date().toISOString(),
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error: true
          }
        ]
      })
      .eq('id', importId);
    
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}