// Deno + Supabase Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.57.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
  console.log("[BMC] =========================");
  console.log("[BMC] Function invoked:", new Date().toISOString());
  console.log("[BMC] Method:", req.method);
  console.log("[BMC] URL:", req.url);
  console.log("[BMC] Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[BMC] Handling OPTIONS preflight");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  const headers = { "Content-Type": "application/json", ...corsHeaders };

  try {
    console.log("[BMC] Checking OpenAI API key...");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("[BMC] CRITICAL: Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OpenAI API key not configured. Please contact support." 
        }),
        { status: 500, headers }
      );
    }
    console.log("[BMC] OpenAI key found:", openaiKey.substring(0, 10) + "...");

    console.log("[BMC] Parsing request body...");
    let body;
    try {
      body = await req.json();
      console.log("[BMC] Body parsed successfully:", JSON.stringify(body));
    } catch (e) {
      console.error("[BMC] Body parse error:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers }
      );
    }

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
    
    console.log("[BMC] Request params:", {
      companyName,
      industry,
      businessStage,
      hasContext: !!additionalContext,
      hasTemplate: !!templateTitle
    });

    console.log("[BMC] Generating BMC for:", companyName, industry);
    console.log("[BMC] Initializing OpenAI client...");

    const openai = new OpenAI({ apiKey: openaiKey });
    console.log("[BMC] OpenAI client initialized");

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

    console.log("[BMC] Calling OpenAI API...");
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
    console.log("[BMC] OpenAI API call completed");

    const text = resp.choices?.[0]?.message?.content ?? "";
    console.log("[BMC] Response length:", text?.length);
    console.log("[BMC] Response preview:", text?.slice(0, 300));

    console.log("[BMC] Parsing JSON response...");
    const parsed = extractJson(text);
    
    if (!parsed) {
      console.error("[BMC] JSON extraction failed. Raw:", text?.slice(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to extract valid JSON from AI response",
          raw: text?.slice(0, 500),
        }),
        { status: 422, headers }
      );
    }
    
    console.log("[BMC] Validating BMC structure...");
    if (!looksLikeBmc(parsed)) {
      console.error("[BMC] Invalid BMC structure:", JSON.stringify(parsed).slice(0, 300));
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI response doesn't match expected BMC structure",
          received: Object.keys(parsed),
        }),
        { status: 422, headers }
      );
    }

    console.log("[BMC] ✅ Success! Returning BMC data");
    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("[BMC] ❌ Fatal error:", err);
    console.error("[BMC] Error stack:", err instanceof Error ? err.stack : 'No stack');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err
      }), 
      {
        status: 500,
        headers,
      }
    );
  }
});