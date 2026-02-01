import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Normalize text for search (remove accents, lowercase)
function normalizeSearchQuery(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '+'); // Replace spaces with +
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const url = new URL(req.url);
    const itemId = url.searchParams.get('item_id');
    const storeId = url.searchParams.get('store_id');
    const schoolId = url.searchParams.get('school_id');
    const listId = url.searchParams.get('list_id');
    const sessionId = url.searchParams.get('session_id');

    console.log(`[resolve-link] Request: item_id=${itemId}, store_id=${storeId}`);

    // Validate required params
    if (!itemId || !storeId) {
      console.error('[resolve-link] Missing required params');
      return new Response(
        JSON.stringify({ error: 'item_id and store_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch item
    const { data: item, error: itemError } = await supabase
      .from('material_items')
      .select('id, name, search_query')
      .eq('id', itemId)
      .maybeSingle();

    if (itemError) {
      console.error('[resolve-link] Item fetch error:', itemError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch item' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!item) {
      console.error('[resolve-link] Item not found:', itemId);
      return new Response(
        JSON.stringify({ error: 'Item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch store
    const { data: store, error: storeError } = await supabase
      .from('partner_stores')
      .select('id, name, base_url, affiliate_tag, search_template, is_active')
      .eq('id', storeId)
      .maybeSingle();

    if (storeError) {
      console.error('[resolve-link] Store fetch error:', storeError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch store' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!store) {
      console.error('[resolve-link] Store not found:', storeId);
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!store.is_active) {
      console.error('[resolve-link] Store is inactive:', storeId);
      return new Response(
        JSON.stringify({ error: 'Store is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query (use search_query if available, fallback to name)
    const rawQuery = item.search_query || item.name;
    const encodedQuery = normalizeSearchQuery(rawQuery);

    console.log(`[resolve-link] Building URL for "${rawQuery}" -> "${encodedQuery}"`);

    // Generate final URL from template
    let finalUrl = store.search_template
      .replace('{{base_url}}', store.base_url)
      .replace('{{query}}', encodedQuery)
      .replace('{{affiliate_tag}}', store.affiliate_tag || '');

    // Clean up URL if no affiliate tag
    if (!store.affiliate_tag) {
      finalUrl = finalUrl.replace('&tag=', '').replace('?tag=', '?').replace(/\?$/, '');
    }

    console.log(`[resolve-link] Final URL: ${finalUrl}`);

    // Track the click event
    const userAgent = req.headers.get('user-agent') || null;
    const referrer = req.headers.get('referer') || null;

    const { error: trackError } = await supabase
      .from('store_click_events')
      .insert({
        item_id: itemId,
        store_id: storeId,
        school_id: schoolId || null,
        list_id: listId || null,
        session_id: sessionId || null,
        user_agent: userAgent,
        referrer: referrer,
      });

    if (trackError) {
      console.error('[resolve-link] Failed to track click:', trackError);
      // Don't fail the request, just log the error
    }

    // Return the resolved URL
    return new Response(
      JSON.stringify({ 
        url: finalUrl,
        store_name: store.name,
        item_name: item.name,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[resolve-link] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
