import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HORIZONS = ['Organisation', 'Coordination', 'Team']
const ISA = ['Intent', 'Scope', 'Approach']
const LAYERS = ['Anchoring', 'Iterative', 'Evidence']

const oneOf = (v: unknown, allowed: string[]): string | null =>
  typeof v === 'string' && allowed.includes(v) ? v : null
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []

// Map an isa_o3_master.json artifact/technique entry to a knowledge_items row.
// Only fields present in the entry are written, so partial edits are safe.
function artifactToRow(a: any) {
  return {
    slug: a.id,
    name: a.name,
    item_type: 'artifact',
    description: a.oneLiner ?? a.description ?? null,
    background: a.description ?? null,
    horizon: oneOf(a.horizon, HORIZONS),
    isa: oneOf(a.isa, ISA),
    layer: oneOf(a.layer, LAYERS),
    facet: typeof a.facet === 'string' ? a.facet : null,
    kind: typeof a.kind === 'string' ? a.kind : 'Artifact',
    shape: a.shape === 'anchor' || a.shape === 'container' ? a.shape : null,
    inheritable: !!a.inheritable,
    why_it_exists: typeof a.question === 'string' ? a.question : null,
    counterparts: strArr(a.counterparts),
    techniques: strArr(a.techniques),
    components: Array.isArray(a.components) ? a.components : [],
  }
}

function techniqueToRow(t: any) {
  return {
    slug: t.id,
    name: t.name,
    item_type: 'technique',
    description: t.description ?? null,
    source: typeof t.source === 'string' ? t.source : null,
    produces: strArr(t.produces),
  }
}

function constituentToRow(c: any) {
  return {
    slug: c.id,
    name: c.name,
    item_type: 'constituent',
    description: c.description ?? null,
    family: c.family === 'queue_item' || c.family === 'field_content' ? c.family : null,
    level: ['epic', 'feature', 'story', 'task'].includes(c.level) ? c.level : null,
    // Constituents carry components too (e.g. a story's acceptance criteria).
    components: Array.isArray(c.components) ? c.components : [],
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const master = body?.data ?? body
    const artifacts = Array.isArray(master?.artifacts) ? master.artifacts : []
    const techniques = Array.isArray(master?.techniques) ? master.techniques : []
    const constituents = Array.isArray(master?.constituents) ? master.constituents : []
    const edges = Array.isArray(master?.edges) ? master.edges : []

    if (artifacts.length === 0 && techniques.length === 0 && constituents.length === 0 && edges.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No artifacts, techniques, constituents or edges in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rows = [
      ...artifacts.filter((a: any) => a?.id && a?.name).map(artifactToRow),
      ...techniques.filter((t: any) => t?.id && t?.name).map(techniqueToRow),
      ...constituents.filter((c: any) => c?.id && c?.name).map(constituentToRow),
    ]

    // Only update items that already exist (match by slug); never insert new
    // rows here, so a stray id in the JSON cannot create junk records.
    const { data: existing, error: exErr } = await supabaseClient
      .from('knowledge_items')
      .select('slug')
    if (exErr) throw exErr
    const known = new Set((existing || []).map((r: any) => r.slug))

    let updated = 0
    const skipped: string[] = []
    const errors: string[] = []

    for (const row of rows) {
      if (!known.has(row.slug)) {
        skipped.push(row.slug)
        continue
      }
      const { error } = await supabaseClient
        .from('knowledge_items')
        .update(row)
        .eq('slug', row.slug)
      if (error) errors.push(`${row.slug}: ${error.message}`)
      else updated += 1
    }

    // Typed edges: resolve source/target slugs to ids and upsert. Edges to
    // unknown slugs are skipped; existing edges (same source+target+type) are
    // left as-is (only from/to level is refreshed).
    const VALID_EDGE_TYPES = new Set([
      'convene', 'generate', 'decompose', 'populate', 'formalise',
      'produce_or_shape', 'advance', 'anchors_to', 'cascades_to',
    ])
    let edgesUpserted = 0
    const edgesSkipped: string[] = []
    if (edges.length > 0) {
      const { data: idMapRows } = await supabaseClient.from('knowledge_items').select('id, slug')
      const idBySlug = new Map((idMapRows || []).map((r: any) => [r.slug, r.id]))
      for (const e of edges) {
        const sid = idBySlug.get(e.source)
        const tid = idBySlug.get(e.target)
        if (!sid || !tid || !VALID_EDGE_TYPES.has(e.edge_type)) {
          edgesSkipped.push(`${e.source}->${e.target}:${e.edge_type}`)
          continue
        }
        const { error } = await supabaseClient
          .from('knowledge_edges')
          .upsert(
            {
              source_id: sid,
              target_id: tid,
              edge_type: e.edge_type,
              from_level: e.from_level ?? null,
              to_level: e.to_level ?? null,
            },
            { onConflict: 'source_id,target_id,edge_type' },
          )
        if (error) errors.push(`edge ${e.source}->${e.target}: ${error.message}`)
        else edgesUpserted += 1
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message: `Updated ${updated} items, ${edgesUpserted} edges; skipped ${skipped.length} unknown slugs, ${edgesSkipped.length} unresolved edges, ${errors.length} errors`,
        details: { updated, skipped, edgesUpserted, edgesSkipped, errors },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in import-knowledge-json:', error)
    return new Response(
      JSON.stringify({ success: false, message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
