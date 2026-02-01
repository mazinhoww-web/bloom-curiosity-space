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

// Build URL from template
function buildStoreUrl(
  template: string,
  baseUrl: string,
  query: string,
  affiliateTag: string | null
): string {
  let url = template
    .replace('{{base_url}}', baseUrl)
    .replace('{{query}}', query)
    .replace('{{affiliate_tag}}', affiliateTag || '');

  // Clean up URL if no affiliate tag
  if (!affiliateTag) {
    url = url.replace('&tag=', '').replace('?tag=', '?').replace(/\?$/, '');
  }

  return url;
}

interface StoreCartItem {
  item_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  price_estimate: number | null;
  url: string;
}

interface StoreCart {
  store_id: string;
  store_name: string;
  logo_url: string | null;
  cart_strategy: string;
  items: StoreCartItem[];
  total_estimate: number | null;
  items_with_price: number;
  items_without_price: number;
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
    const listId = url.searchParams.get('list_id');
    const sessionId = url.searchParams.get('session_id');

    console.log(`[store-carts] Request: list_id=${listId}`);

    if (!listId) {
      return new Response(
        JSON.stringify({ error: 'list_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch list with school info
    const { data: list, error: listError } = await supabase
      .from('material_lists')
      .select('id, school_id, is_active')
      .eq('id', listId)
      .maybeSingle();

    if (listError || !list) {
      console.error('[store-carts] List not found:', listId);
      return new Response(
        JSON.stringify({ error: 'List not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all items from the list
    const { data: items, error: itemsError } = await supabase
      .from('material_items')
      .select('id, name, search_query, quantity, unit, price_estimate')
      .eq('list_id', listId);

    if (itemsError) {
      console.error('[store-carts] Items fetch error:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ 
          store_carts: [],
          message: 'No items in this list'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active partner stores
    const { data: stores, error: storesError } = await supabase
      .from('partner_stores')
      .select('id, name, logo_url, base_url, affiliate_tag, search_template, cart_strategy')
      .eq('is_active', true)
      .order('order_index');

    if (storesError) {
      console.error('[store-carts] Stores fetch error:', storesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stores' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ 
          store_carts: [],
          message: 'No partner stores available'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate store carts
    const storeCarts: StoreCart[] = stores.map(store => {
      let totalEstimate = 0;
      let itemsWithPrice = 0;
      let itemsWithoutPrice = 0;

      const cartItems: StoreCartItem[] = items.map(item => {
        const rawQuery = item.search_query || item.name;
        const encodedQuery = normalizeSearchQuery(rawQuery);
        const itemUrl = buildStoreUrl(
          store.search_template,
          store.base_url,
          encodedQuery,
          store.affiliate_tag
        );

        const quantity = item.quantity || 1;
        
        if (item.price_estimate) {
          totalEstimate += item.price_estimate * quantity;
          itemsWithPrice++;
        } else {
          itemsWithoutPrice++;
        }

        return {
          item_id: item.id,
          name: item.name,
          quantity: quantity,
          unit: item.unit,
          price_estimate: item.price_estimate,
          url: itemUrl,
        };
      });

      return {
        store_id: store.id,
        store_name: store.name,
        logo_url: store.logo_url,
        cart_strategy: store.cart_strategy,
        items: cartItems,
        total_estimate: itemsWithPrice > 0 ? totalEstimate : null,
        items_with_price: itemsWithPrice,
        items_without_price: itemsWithoutPrice,
      };
    });

    // Track the store cart view event
    if (sessionId) {
      const userAgent = req.headers.get('user-agent') || null;
      const referrer = req.headers.get('referer') || null;

      // Track view for each store (or could be a single event)
      await supabase.from('store_click_events').insert({
        school_id: list.school_id,
        list_id: listId,
        session_id: sessionId,
        user_agent: userAgent,
        referrer: referrer,
      });
    }

    console.log(`[store-carts] Generated ${storeCarts.length} store carts with ${items.length} items each`);

    return new Response(
      JSON.stringify({ 
        store_carts: storeCarts,
        total_items: items.length,
        school_id: list.school_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[store-carts] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
