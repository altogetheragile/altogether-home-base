// Shared Claude (Anthropic) client for edge functions.
// All the generate-* functions use this so the provider/model lives in one place.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';

export interface ClaudeJSONOptions {
  system: string;
  prompt: string;
  maxTokens: number;
  temperature?: number;
  model?: string;
}

/**
 * Return the substring of `s` that is the first balanced { ... } JSON object.
 * Tolerates trailing prose after the object (rare with prefill, but safe).
 */
function balancedJson(s: string): string {
  const start = s.indexOf('{');
  if (start === -1) return s;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return s.slice(start);
}

/**
 * Enforce the house style "no em dashes" rule on model output. The system prompts
 * ask for this, but the model still slips them in, so we strip them deterministically.
 * Prose em dashes (and spaced en dashes) become a comma; numeric en-dash ranges
 * like "5–10" are left as a hyphen.
 */
function stripEmDashes(s: string): string {
  return s
    .replace(/\s*—\s*/g, ', ')   // em dash, spaced or not
    .replace(/ – /g, ', ')        // spaced en dash used as punctuation
    .replace(/–/g, '-');          // any remaining en dash (e.g. ranges) -> hyphen
}

/**
 * Call Claude and return a clean JSON-object STRING (not parsed), so callers can
 * keep their existing extractJSON / JSON.parse logic unchanged.
 *
 * Claude has no "JSON mode", so we instruct strict-JSON output in the system
 * prompt and then extract the first balanced { ... } object from the reply
 * (tolerating any preamble or markdown code fences the model might add).
 */
const JSON_INSTRUCTION =
  '\n\nIMPORTANT: Respond with a single valid JSON object and nothing else. Do not include any explanation, prose, or markdown code fences.';

export async function callClaudeJSON({
  system,
  prompt,
  maxTokens,
  temperature = 0.5,
  model = DEFAULT_MODEL,
}: ClaudeJSONOptions): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: system + JSON_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', response.status, errorText);
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== 'string') {
    console.error('Empty/invalid response from Anthropic:', JSON.stringify(data).slice(0, 300));
    throw new Error('Empty response from Anthropic API');
  }

  return stripEmDashes(balancedJson(text));
}
