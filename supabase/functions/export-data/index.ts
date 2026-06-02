import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'techniques' | 'events' | 'users' | 'analytics' | 'knowledge-base';
  format: 'csv' | 'json';
  filters?: Record<string, any>;
}

// Build the isa_o3_master.json shape (meta + artifacts[] + techniques[]) from
// knowledge_items. Mirrors src/data/isa_o3_master.json so it round-trips with
// the import-knowledge-json function.
function buildKnowledgeBaseExport(rows: any[], edgeRows: any[] = []) {
  const artifacts = rows
    .filter((r) => r.item_type === 'artifact')
    .map((r) => ({
      id: r.slug,
      name: r.name,
      horizon: r.horizon ?? null,
      isa: r.isa ?? null,
      layer: r.layer ?? null,
      kind: r.kind ?? 'Artifact',
      shape: r.shape ?? null,
      facet: r.facet ?? null,
      oneLiner: r.description ?? '',
      description: r.background || r.description || '',
      question: r.why_it_exists ?? null,
      inheritable: !!r.inheritable,
      counterparts: r.counterparts ?? [],
      techniques: r.techniques ?? [],
      components: r.components ?? [],
    }))
    .sort((a, b) => (a.horizon || 'zz').localeCompare(b.horizon || 'zz') || a.id.localeCompare(b.id));

  const techniques = rows
    .filter((r) => r.item_type === 'technique')
    .map((r) => ({
      id: r.slug,
      name: r.name,
      description: r.description ?? '',
      source: r.source ?? '',
      produces: r.produces ?? [],
    }))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const events = rows
    .filter((r) => r.item_type === 'event')
    .map((r) => ({ id: r.slug, name: r.name, horizon: r.horizon ?? null, description: r.description ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const constituents = rows
    .filter((r) => r.item_type === 'constituent')
    .map((r) => ({ id: r.slug, name: r.name, family: r.family ?? null, level: r.level ?? null, description: r.description ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Typed edges expressed by slug for a clean round-trip.
  const edges = (edgeRows || [])
    .filter((e) => e.source?.slug && e.target?.slug)
    .map((e) => ({
      source: e.source.slug,
      target: e.target.slug,
      edge_type: e.edge_type,
      from_level: e.from_level ?? null,
      to_level: e.to_level ?? null,
    }))
    .sort((a, b) => a.edge_type.localeCompare(b.edge_type) || a.source.localeCompare(b.source));

  return {
    _README: 'GENERATED FROM SUPABASE - DO NOT EDIT as a source of truth. Supabase is canonical; ' +
      'edit content via the admin UI. Re-import edits via the import-knowledge-json function (upsert by slug).',
    meta: {
      generated: new Date().toISOString().split('T')[0],
      source: 'Exported from Altogether Agile knowledge_items (Supabase)',
      artifacts: artifacts.length,
      techniques: techniques.length,
      events: events.length,
      constituents: constituents.length,
      edges: edges.length,
    },
    artifacts,
    techniques,
    events,
    constituents,
    edges,
  };
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
          .from('knowledge_items')
          .select(`
            name,
            slug,
            description,
            is_published,
            is_featured,
            view_count,
            item_type,
            learning_value_summary,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        data = techniques?.map(t => ({
          name: t.name,
          slug: t.slug,
          description: t.description,
          is_published: t.is_published,
          is_featured: t.is_featured,
          view_count: t.view_count || 0,
          item_type: t.item_type || '',
          learning_value_summary: t.learning_value_summary || '',
          created_at: t.created_at,
          updated_at: t.updated_at,
        })) || [];
        filename = 'knowledge_items';
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

      case 'knowledge-base': {
        // Always JSON: a structured master document, not a flat table.
        const { data: rows, error: kbErr } = await supabase
          .from('knowledge_items')
          .select(`
            id, slug, name, item_type, description, background, source,
            horizon, isa, layer, facet, kind, inheritable, why_it_exists,
            shape, family, level, produces, counterparts, techniques, components
          `)
          .order('slug');
        if (kbErr) throw kbErr;

        // Typed edges, resolved to slugs via the two FKs.
        const { data: edgeRows, error: edgeErr } = await supabase
          .from('knowledge_edges')
          .select('edge_type, from_level, to_level, source:source_id(slug), target:target_id(slug)');
        if (edgeErr) throw edgeErr;

        const master = buildKnowledgeBaseExport(rows || [], edgeRows || []);
        return new Response(JSON.stringify(master, null, 2), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="isa_o3_master_${new Date().toISOString().split('T')[0]}.json"`,
          },
        });
      }

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