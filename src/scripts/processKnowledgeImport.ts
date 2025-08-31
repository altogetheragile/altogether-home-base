import { supabase } from '@/integrations/supabase/client';

export const processKnowledgeImport = async (importId: string) => {
  console.log('🚀 Starting knowledge import processing...');
  
  try {
    // Get staging data
    const { data: stagingData, error: stagingError } = await supabase
      .from('staging_data')
      .select('*')
      .eq('import_id', importId)
      .eq('processing_status', 'pending')
      .order('row_number');

    if (stagingError) throw stagingError;

    if (!stagingData || stagingData.length === 0) {
      console.log('❌ No staging data to process');
      return { success: false, message: 'No data to process' };
    }

    console.log(`📊 Processing ${stagingData.length} knowledge items...`);

    const fieldMappings = {
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

    let processed = 0;
    let errors = 0;

    for (const stagingRow of stagingData) {
      try {
        console.log(`📝 Processing row ${stagingRow.row_number}: ${stagingRow.raw_data['Knowledge Item']}`);
        
        const mappedData: any = {
          content_type: 'technique',
          is_published: true,
          is_featured: false,
          is_complete: true
        };

        // Map basic fields
        Object.entries(fieldMappings).forEach(([targetField, sourceColumn]) => {
          if (sourceColumn && stagingRow.raw_data[sourceColumn]) {
            let value = stagingRow.raw_data[sourceColumn];
            
            if (targetField.includes('_min') || targetField.includes('_max') || targetField === 'estimated_reading_time') {
              value = parseInt(value) || null;
            } else if (targetField.startsWith('is_')) {
              value = String(value).toLowerCase() === 'true';
            }
            
            mappedData[targetField] = value;
          }
        });

        // Generate slug
        mappedData.slug = mappedData.name?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) || `item-${stagingRow.row_number}`;

        // Handle category lookup
        if (stagingRow.raw_data['Category']) {
          const categoryName = stagingRow.raw_data['Category'];
          let { data: category } = await supabase
            .from('knowledge_categories')
            .select('id')
            .eq('name', categoryName)
            .maybeSingle();
          
          if (!category) {
            // Create category
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

        // Handle domain lookup
        if (stagingRow.raw_data['Domain of Interest']) {
          const domainName = stagingRow.raw_data['Domain of Interest'];
          let { data: domain } = await supabase
            .from('activity_domains')
            .select('id')
            .eq('name', domainName)
            .maybeSingle();
          
          if (!domain) {
            // Create domain
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

        // Insert knowledge item
        const { data: knowledgeItem, error } = await supabase
          .from('knowledge_items')
          .insert([mappedData])
          .select('id')
          .single();

        if (error) throw error;

        // Handle planning layers
        if (stagingRow.raw_data['Planning Layer']) {
          const layerName = stagingRow.raw_data['Planning Layer'];
          let { data: layer } = await supabase
            .from('planning_layers')
            .select('id')
            .eq('name', layerName)
            .maybeSingle();
          
          if (!layer) {
            // Create planning layer
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

        processed++;
        console.log(`✅ Successfully processed: ${mappedData.name}`);
        
      } catch (error) {
        console.error(`❌ Error processing row ${stagingRow.row_number}:`, error);
        
        // Update staging row as failed
        await supabase
          .from('staging_data')
          .update({
            processing_status: 'failed',
            processing_errors: [error instanceof Error ? error.message : String(error)],
            processed_at: new Date().toISOString()
          })
          .eq('id', stagingRow.id);

        errors++;
      }
    }

    // Update import status
    await supabase
      .from('data_imports')
      .update({
        status: errors === 0 ? 'completed' : 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', importId);

    console.log(`🎉 Import completed: ${processed} successful, ${errors} errors`);
    
    return {
      success: true,
      processed,
      errors,
      message: `Successfully processed ${processed} knowledge items with ${errors} errors`
    };

  } catch (error) {
    console.error('💥 Import processing failed:', error);
    
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
      .eq('id', importId);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Import processing failed'
    };
  }
};

// Auto-run the processing
processKnowledgeImport('350bf975-21e2-4e12-8352-cf4a87178228')
  .then(result => {
    console.log('📋 Final result:', result);
  })
  .catch(error => {
    console.error('🚨 Processing script error:', error);
  });