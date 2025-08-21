// Deno + Supabase Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.57.0";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://altogether-home-base.lovable.app",
  "https://preview--altogether-home-base.lovable.app",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  const headers = { "Content-Type": "application/json", ...corsHeaders(req) };

  try {
    const body = await req.json().catch(() => ({}));
    const {
      companyName,
      industry,
      businessStage,
      targetCustomers,
      productService,
      additionalContext,
    } = body ?? {};

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

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