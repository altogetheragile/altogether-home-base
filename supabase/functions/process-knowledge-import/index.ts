import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { importId } = await req.json()

    if (!importId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Import ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🚀 Starting knowledge import process for import:', importId);
    
    // Get import record
    const { data: importRecord, error: importError } = await supabaseClient
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

    // Update status to processing
    await supabaseClient
      .from('data_imports')
      .update({ status: 'processing' })
      .eq('id', importId);
    
    // Get staging data
    const { data: stagingData, error: stagingError } = await supabaseClient
      .from('staging_data')
      .select('*')
      .eq('import_id', importId)
      .eq('processing_status', 'pending');
    
    if (stagingError) throw stagingError;
    
    if (!stagingData || stagingData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No pending data found to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📊 Processing ${stagingData.length} knowledge items`);
    
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each row
    for (const row of stagingData) {
      try {
        const rawData = row.raw_data as any;
        console.log('🔍 Processing row with mapped data:', row.mapped_data);
        
        // Use the mapped data from staging
        const mappedData = row.mapped_data as Record<string, any>;
        
        // Build knowledge item data
        const kiData: any = {
          name: mappedData.name || '',
          description: mappedData.description || '',
          source: mappedData.source || null,
          background: mappedData.background || null,
          is_published: true,
          is_featured: false,
          view_count: 0
        };

        // Generate slug if name exists
        if (kiData.name) {
          kiData.slug = createSlug(kiData.name);
        } else {
          throw new Error('Knowledge item name is required');
        }
        
        // Handle category
        let categoryId = null;
        if (mappedData.category_name) {
          const categorySlug = createSlug(mappedData.category_name);
          
          // Try to find existing category
          const { data: existingCategory } = await supabaseClient
            .from('knowledge_categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();
          
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            // Create new category
            const { data: newCategory, error: catError } = await supabaseClient
              .from('knowledge_categories')
              .insert({
                name: mappedData.category_name,
                slug: categorySlug,
                description: mappedData.category_description || null,
                color: generateColor()
              })
              .select('id')
              .single();
            
            if (catError) throw catError;
            categoryId = newCategory.id;
          }
        }
        
        // Handle planning layer  
        let planningLayerId = null;
        if (mappedData.planning_layer_name) {
          const layerSlug = createSlug(mappedData.planning_layer_name);
          
          const { data: existingLayer } = await supabaseClient
            .from('planning_layers')
            .select('id')
            .eq('slug', layerSlug)
            .single();
          
          if (existingLayer) {
            planningLayerId = existingLayer.id;
          } else {
            // Get next display order
            const { data: maxOrder } = await supabaseClient
              .from('planning_layers')
              .select('display_order')
              .order('display_order', { ascending: false })
              .limit(1)
              .single();
            
            const nextOrder = (maxOrder?.display_order || 0) + 1;
            
            const { data: newLayer, error: layerError } = await supabaseClient
              .from('planning_layers')
              .insert({
                name: mappedData.planning_layer_name,
                slug: layerSlug,
                description: mappedData.planning_layer_description || null,
                color: generateColor(),
                display_order: nextOrder
              })
              .select('id')
              .single();
            
            if (layerError) throw layerError;
            planningLayerId = newLayer.id;
          }
        }
        
        // Handle activity domain
        let domainId = null;
        if (mappedData.domain_name) {
          const domainSlug = createSlug(mappedData.domain_name);
          
          const { data: existingDomain } = await supabaseClient
            .from('activity_domains')
            .select('id')
            .eq('slug', domainSlug)
            .single();
          
          if (existingDomain) {
            domainId = existingDomain.id;
          } else {
            const { data: newDomain, error: domainError } = await supabaseClient
              .from('activity_domains')
              .insert({
                name: mappedData.domain_name,
                slug: domainSlug,
                description: mappedData.domain_description || null,
                color: generateColor()
              })
              .select('id')
              .single();
            
            if (domainError) throw domainError;
            domainId = newDomain.id;
          }
        }
        
        // Set foreign key relationships
        if (categoryId) kiData.category_id = categoryId;
        if (domainId) kiData.domain_id = domainId;
        if (planningLayerId) kiData.planning_layer_id = planningLayerId;
        
        // Insert knowledge item
        const { data: newKI, error: kiError } = await supabaseClient
          .from('knowledge_items')
          .insert(kiData)
          .select('id')
          .single();
        
        if (kiError) throw kiError;
        
        // Create use cases if we have the data
        const useCases = [];
        
        // Generic use case
        if (mappedData.generic_who || mappedData.generic_what || mappedData.generic_summary) {
          useCases.push({
            knowledge_item_id: newKI.id,
            case_type: 'generic',
            title: 'Generic Use Case',
            who: mappedData.generic_who || null,
            what: mappedData.generic_what || null,
            when_used: mappedData.generic_when || null,
            where_used: mappedData.generic_where || null,
            why: mappedData.generic_why || null,
            how: mappedData.generic_how || null,
            how_much: mappedData.generic_how_much || null,
            summary: mappedData.generic_summary || null
          });
        }
        
        // Example use case
        if (mappedData.example_who || mappedData.example_what || mappedData.example_summary) {
          useCases.push({
            knowledge_item_id: newKI.id,
            case_type: 'example',
            title: mappedData.example_title || 'Example Use Case',
            who: mappedData.example_who || null,
            what: mappedData.example_what || null,
            when_used: mappedData.example_when || null,
            where_used: mappedData.example_where || null,
            why: mappedData.example_why || null,
            how: mappedData.example_how || null,
            how_much: mappedData.example_how_much || null,
            summary: mappedData.example_summary || null
          });
        }
        
        // Insert use cases if any
        if (useCases.length > 0) {
          const { error: useCaseError } = await supabaseClient
            .from('knowledge_use_cases')
            .insert(useCases);
          
          if (useCaseError) console.error('Use case insert error:', useCaseError);
        }
        
        // Update staging data as processed
        await supabaseClient
          .from('staging_data')
          .update({
            processing_status: 'processed',
            target_record_id: newKI.id,
            processed_at: new Date().toISOString()
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
        await supabaseClient
          .from('staging_data')
          .update({
            processing_status: 'failed',
            processing_errors: [errorMsg],
            processed_at: new Date().toISOString()
          })
          .eq('id', row.id);
      }
    }
    
    // Update import status
    const status = errorCount === 0 ? 'completed' : 'completed_with_errors';
    await supabaseClient
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
    
    return new Response(
      JSON.stringify({
        success: true,
        message,
        details: { processedCount, errorCount, errors: errors.slice(0, 10) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Import process failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})