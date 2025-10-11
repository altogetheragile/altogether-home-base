// Deno + Supabase Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.57.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// ---------- Helpers
type Bmc = {
  keyPartners?: string | string[];
  keyActivities?: string | string[];
  keyResources?: string | string[];
  valuePropositions?: string | string[];
  customerRelationships?: string | string[];
  channels?: string | string[];
  customerSegments?: string | string[];
  costStructure?: string | string[];
  revenueStreams?: string | string[];
};

// very light validator: ensures at least a couple of known keys exist
function looksLikeBmc(obj: unknown): obj is Bmc {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o);
  const expected = [
    "keyPartners","keyActivities","keyResources","valuePropositions",
    "customerRelationships","channels","customerSegments",
    "costStructure","revenueStreams",
  ];
  return keys.some(k => expected.includes(k)) || // camelCase
         keys.some(k => [
           "key_partners","key_activities","key_resources","value_propositions",
           "customer_relationships","customer_segments","cost_structure","revenue_streams"
         ].includes(k)); // snake_case
}

// try hard to extract a JSON object from any text
function extractJson(text: string): any | null {
  // common stray characters cleanup
  const cleaned = text
    .replace(/\u201C|\u201D|\u2018|\u2019/g, '"') // smart quotes -> straight
    .replace(/,\s*}/g, "}")                       // trailing comma in object
    .replace(/,\s*]/g, "]");                      // trailing comma in array

  // 1) look for the first balanced { ... } block
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate); } catch {}
  }

  // 2) last resort plain parse
  try { return JSON.parse(cleaned); } catch {}
  return null;
}

serve(async (req: Request) => {
  console.log("[BMC] Incoming request:", req.method, req.url);
  
  if (req.method === "OPTIONS") {
    console.log("[BMC] Handling OPTIONS preflight");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  const headers = { "Content-Type": "application/json", ...corsHeaders };

  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP address for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    console.log("[BMC] Request from IP:", ip);

    // Check rate limit: 5 requests per 24 hours per IP
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("anonymous_usage")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("endpoint", "generate-bmc")
      .gte("created_at", twentyFourHoursAgo);

    if (countError) {
      console.error("[BMC] Rate limit check failed:", countError);
      // Continue anyway - don't block on rate limit errors
    } else if (count !== null && count >= 5) {
      console.warn("[BMC] Rate limit exceeded for IP:", ip, "count:", count);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. You have reached the maximum of 5 free BMC generations per day. Please sign up for unlimited access or try again in 24 hours." 
        }),
        { status: 429, headers }
      );
    }

    // Log this usage attempt
    const { error: insertError } = await supabase
      .from("anonymous_usage")
      .insert({
        ip_address: ip,
        endpoint: "generate-bmc",
        user_agent: userAgent,
        request_count: 1
      });

    if (insertError) {
      console.error("[BMC] Failed to log usage:", insertError);
      // Continue anyway - don't block on logging errors
    }

    // Check for OpenAI API key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[BMC] Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase Edge Function secrets." 
        }),
        { status: 500, headers }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      companyName,
      industry,
      businessStage,
      targetCustomers,
      productService,
      additionalContext,
      templateTitle,
      templateUrl,
    } = body ?? {};

    console.log("[BMC] Generating BMC for:", companyName, industry);

    const openai = new OpenAI({ apiKey: openaiKey });

    // Prompt: force JSON only; the UI expects camelCase keys
    const system = `
You are an assistant that outputs ONLY a single JSON object for a Business Model Canvas.
Do not include any prose before or after the JSON. Keys must be camelCase:

{
  "keyPartners": string | string[],
  "keyActivities": string | string[],
  "keyResources": string | string[],
  "valuePropositions": string | string[],
  "customerRelationships": string | string[],
  "channels": string | string[],
  "customerSegments": string | string[],
  "costStructure": string | string[],
  "revenueStreams": string | string[]
}

Each field should be a newline-separated bullet list (using "• ") in a single string,
OR an array of bullet strings. Keep it concise and specific to the inputs.
${templateTitle ? `\n\nAlign your output with the official Business Model Canvas template: "${templateTitle}". Ensure all content fits the standard nine-block BMC structure from the template.` : ''}
`;

    const user = `
Company: ${companyName ?? ""}
Industry: ${industry ?? ""}
Stage: ${businessStage ?? ""}
Target customers: ${targetCustomers ?? ""}
Product/Service: ${productService ?? ""}
Additional context: ${additionalContext ?? ""}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",          // ← reliable, JSON-friendly
      temperature: 0.2,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: user.trim() },
      ],
      // If your OpenAI SDK supports it, this is even better:
      // response_format: { type: "json_object" },
    });

    const text = resp.choices?.[0]?.message?.content ?? "";
    // Log raw in case parsing fails
    console.log("[BMC][LLM raw]", text?.slice(0, 1000));

    const parsed = extractJson(text);
    if (!parsed || !looksLikeBmc(parsed)) {
      console.error("[BMC] JSON parse/shape failed. Raw sample:", text?.slice(0, 400));
      return new Response(
        JSON.stringify({
          success: false,
          error: "LLM JSON parsing failed",
          raw: text,
        }),
        { status: 422, headers }
      );
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers,
    });
  } catch (err) {
    console.error("[BMC] fatal error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers,
    });
  }
});