import { supabase } from '@/integrations/supabase/client';

export const processKnowledgeImport = async (importId: string) => {
  // console.log('🚀 Starting knowledge import processing...');
  
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
      // console.log('❌ No staging data to process');
      return { success: false, message: 'No data to process' };
    }

    // console.log(`📊 Processing ${stagingData.length} knowledge items...`);

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
      planning_focuses: 'Planning Focus'
    };

    let processed = 0;
    let errors = 0;

    for (const stagingRow of stagingData) {
      try {
        // console.log(`📝 Processing row ${stagingRow.row_number}: ${rawData?.['Knowledge Item']}`);

        const rawData = stagingRow.raw_data as Record<string, unknown> | null;

        const mappedData: Record<string, unknown> = {
          content_type: 'technique',
          is_published: true,
          is_featured: false,
          is_complete: true
        };

        // Map basic fields
        Object.entries(fieldMappings).forEach(([targetField, sourceColumn]) => {
          if (sourceColumn && rawData?.[sourceColumn]) {
            let value: unknown = rawData[sourceColumn];

            if (targetField.includes('_min') || targetField.includes('_max') || targetField === 'estimated_reading_time') {
              value = parseInt(String(value)) || null;
            } else if (targetField.startsWith('is_')) {
              value = String(value).toLowerCase() === 'true';
            }

            mappedData[targetField] = value;
          }
        });

        // Generate slug
        mappedData.slug = (typeof mappedData.name === 'string' ? mappedData.name : '').toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) || `item-${stagingRow.row_number}`;

        // Handle category lookup
        if (rawData?.['Category']) {
          const categoryName = String(rawData['Category']);
          let { data: category } = await supabase
            .from('knowledge_categories')
            .select('id')
            .eq('name', categoryName)
            .maybeSingle();

          if (!category) {
            // Create category
            const catDesc = rawData?.['Category Description'] ? String(rawData['Category Description']) : null;
            const { data: newCategory } = await supabase
              .from('knowledge_categories')
              .insert([{
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                description: catDesc,
                full_description: catDesc
              }])
              .select('id')
              .single();
            category = newCategory;
          }

          if (category) mappedData.category_id = category.id;
        }

        // Handle domain lookup
        if (rawData?.['Domain of Interest']) {
          const domainName = String(rawData['Domain of Interest']);
          let { data: domain } = await supabase
            .from('activity_domains')
            .select('id')
            .eq('name', domainName)
            .maybeSingle();

          if (!domain) {
            // Create domain
            const domDesc = rawData?.['Domain of Interest Description'] ? String(rawData['Domain of Interest Description']) : null;
            const { data: newDomain } = await supabase
              .from('activity_domains')
              .insert([{
                name: domainName,
                slug: domainName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                description: domDesc,
                full_description: domDesc
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
          .insert([mappedData as { name: string; slug: string; [key: string]: unknown }])
          .select('id')
          .single();

        if (error) throw error;

        // Handle planning focuses
        if (rawData?.['Planning Focus']) {
          const focusName = String(rawData['Planning Focus']);
          let { data: focus } = await supabase
            .from('planning_focuses')
            .select('id')
            .eq('name', focusName)
            .maybeSingle();

          if (!focus) {
            // Create planning focus
            const focusDesc = rawData?.['Planning Focus Description'] ? String(rawData['Planning Focus Description']) : null;
            const { data: newFocus } = await supabase
              .from('planning_focuses')
              .insert([{
                name: focusName,
                slug: focusName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                description: focusDesc
              }])
              .select('id')
              .single();
            focus = newFocus;
          }
          
          if (focus) {
            mappedData.planning_focus_id = focus.id;
          }
        }

        // Update staging row as processed
        await supabase
          .from('staging_data')
          .update({
            processing_status: 'processed',
            target_record_id: knowledgeItem.id,
            mapped_data: mappedData as Record<string, string | number | boolean | null | string[]>,
            processed_at: new Date().toISOString()
          })
          .eq('id', stagingRow.id);

        processed++;
        // console.log(`✅ Successfully processed: ${mappedData.name}`);
        
      } catch (error) {
        // console.error(`❌ Error processing row ${stagingRow.row_number}:`, error);
        
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

    // console.log(`🎉 Import completed: ${processed} successful, ${errors} errors`);
    
    return {
      success: true,
      processed,
      errors,
      message: `Successfully processed ${processed} knowledge items with ${errors} errors`
    };

  } catch (error) {
    // console.error('💥 Import processing failed:', error);
    
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
  .then(_result => {
    // console.log('📋 Final result:', _result);
  })
  .catch(_error => {
    // console.error('🚨 Processing script error:', error);
  });