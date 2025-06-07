
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_DEV");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY_DEV is not set");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
      // Add retry configuration to handle rate limits
      maxNetworkRetries: 3,
    });

    // Use service role key to update registration
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Add a small delay to avoid rate limiting when multiple calls are made
    await sleep(100);

    // Retrieve checkout session with retry logic
    let session;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
        break;
      } catch (error: any) {
        if (error.type === 'StripeRateLimitError' && retryCount < maxRetries - 1) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          logStep(`Rate limit hit, retrying in ${delay}ms`, { attempt: retryCount + 1 });
          await sleep(delay);
          retryCount++;
        } else {
          throw error;
        }
      }
    }

    if (!session) {
      throw new Error("Failed to retrieve session after retries");
    }

    logStep("Session retrieved", { paymentStatus: session.payment_status });

    if (session.payment_status === "paid") {
      // Check if registration already exists and is paid
      const { data: existingReg } = await supabaseService
        .from("event_registrations")
        .select("payment_status")
        .eq("stripe_session_id", sessionId)
        .single();

      if (existingReg?.payment_status === "paid") {
        logStep("Registration already marked as paid");
        return new Response(JSON.stringify({ 
          payment_status: session.payment_status,
          session_id: sessionId 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Update registration status
      const { error } = await supabaseService
        .from("event_registrations")
        .update({ payment_status: "paid" })
        .eq("stripe_session_id", sessionId);

      if (error) {
        logStep("Error updating registration", { error: error.message });
        throw error;
      }

      logStep("Registration updated to paid");
    }

    return new Response(JSON.stringify({ 
      payment_status: session.payment_status,
      session_id: sessionId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    
    // Return appropriate error status based on error type
    let status = 500;
    if (errorMessage.includes('rate limit')) {
      status = 429; // Too Many Requests
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
