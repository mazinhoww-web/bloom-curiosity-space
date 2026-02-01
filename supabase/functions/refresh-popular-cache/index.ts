import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[refresh-popular-cache] Starting cache refresh...");

  try {
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let refreshSchools = true;
    let refreshLists = true;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.schools !== undefined) refreshSchools = body.schools;
        if (body.lists !== undefined) refreshLists = body.lists;
      } catch {
        // No body or invalid JSON, use defaults
      }
    }

    const results: { schools?: string; lists?: string } = {};

    // Refresh popular schools cache
    if (refreshSchools) {
      console.log("[refresh-popular-cache] Refreshing popular schools cache...");
      const { error: schoolsError } = await supabase.rpc("refresh_popular_schools_cache");

      if (schoolsError) {
        console.error("[refresh-popular-cache] Error refreshing schools:", schoolsError);
        results.schools = `Error: ${schoolsError.message}`;
      } else {
        results.schools = "Success";
        console.log("[refresh-popular-cache] Schools cache refreshed successfully");
      }
    }

    // Refresh popular lists cache
    if (refreshLists) {
      console.log("[refresh-popular-cache] Refreshing popular lists cache...");
      const { error: listsError } = await supabase.rpc("refresh_popular_lists_cache");

      if (listsError) {
        console.error("[refresh-popular-cache] Error refreshing lists:", listsError);
        results.lists = `Error: ${listsError.message}`;
      } else {
        results.lists = "Success";
        console.log("[refresh-popular-cache] Lists cache refreshed successfully");
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[refresh-popular-cache] Completed in ${duration}ms`, results);

    // Log the execution to a table for monitoring (optional)
    await supabase.from("ai_provider_metrics").insert({
      function_name: "refresh-popular-cache",
      provider: "cron",
      success: !results.schools?.startsWith("Error") && !results.lists?.startsWith("Error"),
      response_time_ms: duration,
      fallback_used: false,
      error_message: results.schools?.startsWith("Error") ? results.schools : results.lists?.startsWith("Error") ? results.lists : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[refresh-popular-cache] Fatal error:", errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
