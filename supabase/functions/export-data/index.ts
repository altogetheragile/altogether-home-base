import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'techniques' | 'events' | 'users' | 'analytics';
  format: 'csv' | 'json';
  filters?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Require authenticated admin
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin');
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, format, filters = {} }: ExportRequest = await req.json();
    console.log('Export request:', { type, format, filters });

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'techniques':
        const { data: techniques } = await supabase
          .from('knowledge_techniques')
          .select(`
            name,
            slug,
            summary,
            description,
            difficulty_level,
            estimated_reading_time,
            is_published,
            view_count,
            created_at,
            knowledge_categories(name)
          `)
          .order('created_at', { ascending: false });
        
        data = techniques?.map(t => ({
          name: t.name,
          slug: t.slug,
          summary: t.summary,
          description: t.description,
          difficulty_level: t.difficulty_level,
          estimated_reading_time: t.estimated_reading_time,
          is_published: t.is_published,
          view_count: t.view_count || 0,
          category: t.knowledge_categories?.name || '',
          created_at: t.created_at,
        })) || [];
        filename = 'knowledge_techniques';
        break;

      case 'events':
        const { data: events } = await supabase
          .from('events')
          .select(`
            title,
            description,
            start_date,
            end_date,
            price_cents,
            currency,
            capacity,
            is_published,
            created_at,
            locations(name),
            instructors(name)
          `)
          .order('created_at', { ascending: false });
        
        data = events?.map(e => ({
          title: e.title,
          description: e.description,
          start_date: e.start_date,
          end_date: e.end_date,
          price_cents: e.price_cents || 0,
          currency: e.currency || 'usd',
          capacity: e.capacity || 0,
          is_published: e.is_published,
          location: e.locations?.name || '',
          instructor: e.instructors?.name || '',
          created_at: e.created_at,
        })) || [];
        filename = 'events';
        break;

      case 'analytics':
        const { data: analytics } = await supabase
          .from('search_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10000);
        
        data = analytics || [];
        filename = 'search_analytics';
        break;

      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Return JSON
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error in export-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});