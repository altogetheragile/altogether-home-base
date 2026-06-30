// Per-user AI rate limiting, shared by every Claude-calling edge function so a single
// signed-in user cannot hammer the (paid) AI endpoints. Backed by the existing
// check_ai_rate_limit(p_user_id, p_endpoint, p_max_requests, p_window_minutes) RPC and
// the ai_rate_limits table.
//
// Returns a 429 Response when the caller is over the limit, or null when they may proceed.
// Fails OPEN on an infrastructure error (a broken rate-limit check must not take the
// feature down) — the auth gate still applies.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export async function enforceAiRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  corsHeaders: Record<string, string>,
  maxRequests = 50,
  windowMinutes = 60,
): Promise<Response | null> {
  try {
    const { data: ok, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });
    if (error) {
      console.error(`[rate-limit] check failed for ${endpoint}:`, error);
      return null; // fail open
    }
    if (!ok) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. You can make up to ${maxRequests} AI requests per hour. Please try again later.`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    return null;
  } catch (e) {
    console.error(`[rate-limit] unexpected error for ${endpoint}:`, e);
    return null; // fail open
  }
}
