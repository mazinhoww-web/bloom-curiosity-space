import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { uploaded_list_id, items } = await req.json();

    if (!uploaded_list_id) {
      return new Response(
        JSON.stringify({ error: 'uploaded_list_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[publish-uploaded-list] Publishing upload: ${uploaded_list_id}`);

    // Fetch the uploaded list
    const { data: uploadedList, error: fetchError } = await supabase
      .from('uploaded_lists')
      .select('*')
      .eq('id', uploaded_list_id)
      .single();

    if (fetchError || !uploadedList) {
      console.error('[publish-uploaded-list] Upload not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Upload not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate we have a school
    if (!uploadedList.school_id) {
      return new Response(
        JSON.stringify({ error: 'School is required to publish' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided items or extracted items
    const itemsToPublish = items || uploadedList.extracted_items || [];

    if (itemsToPublish.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items to publish' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch categories for mapping
    const { data: categories } = await supabase
      .from('material_categories')
      .select('id, name');

    const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]) || []);

    // Create the material list
    const { data: newList, error: listError } = await supabase
      .from('material_lists')
      .insert({
        school_id: uploadedList.school_id,
        grade_id: uploadedList.grade_id,
        year: uploadedList.year || new Date().getFullYear(),
        is_active: true,
        version: 1,
      })
      .select()
      .single();

    if (listError || !newList) {
      console.error('[publish-uploaded-list] Failed to create material list:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to create list' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[publish-uploaded-list] Created material_list: ${newList.id}`);

    // Create material items
    const materialItems = itemsToPublish.map((item: any) => ({
      list_id: newList.id,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'un',
      category_id: categoryMap.get(item.category?.toLowerCase()) || null,
      brand_suggestion: item.brand_suggestion || null,
      is_required: true,
    }));

    const { error: itemsError } = await supabase
      .from('material_items')
      .insert(materialItems);

    if (itemsError) {
      console.error('[publish-uploaded-list] Failed to create items:', itemsError);
      // Rollback the list creation
      await supabase.from('material_lists').delete().eq('id', newList.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the uploaded list status
    await supabase
      .from('uploaded_lists')
      .update({
        status: 'published',
        material_list_id: newList.id,
        extracted_items: itemsToPublish, // Save final version
      })
      .eq('id', uploaded_list_id);

    // Track list published event
    await supabase.from('upload_events').insert({
      uploaded_list_id,
      event_type: 'list_published',
      metadata: { 
        material_list_id: newList.id,
        items_count: materialItems.length,
      },
      session_id: uploadedList.session_id,
    });

    // Fetch school info for the response
    const { data: school } = await supabase
      .from('schools')
      .select('slug, name')
      .eq('id', uploadedList.school_id)
      .single();

    // Fetch grade info
    const { data: grade } = await supabase
      .from('grades')
      .select('name')
      .eq('id', uploadedList.grade_id)
      .maybeSingle();

    console.log(`[publish-uploaded-list] Published ${materialItems.length} items to list ${newList.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        material_list_id: newList.id,
        items_count: materialItems.length,
        school_slug: school?.slug,
        school_name: school?.name,
        grade_name: grade?.name,
        public_url: school?.slug ? `/escola/${school.slug}` : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[publish-uploaded-list] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
