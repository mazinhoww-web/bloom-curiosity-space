import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Material categories for classification
const CATEGORIES = [
  { name: "Cadernos", keywords: ["caderno", "fichário", "agenda"] },
  { name: "Escrita", keywords: ["lápis", "caneta", "lapiseira", "borracha", "apontador", "marca texto", "marcador", "corretivo", "giz"] },
  { name: "Papelaria", keywords: ["papel", "folha", "sulfite", "cartolina", "eva", "contact", "etiqueta", "post-it"] },
  { name: "Organização", keywords: ["pasta", "envelope", "capa", "divisória", "fichário", "organizador", "porta"] },
  { name: "Desenho e Arte", keywords: ["tinta", "pincel", "lápis de cor", "canetinha", "giz de cera", "aquarela", "massinha", "argila", "palito"] },
  { name: "Matemática", keywords: ["régua", "esquadro", "transferidor", "compasso", "calculadora"] },
  { name: "Corte e Colagem", keywords: ["tesoura", "cola", "fita", "durex", "crepe"] },
  { name: "Higiene", keywords: ["álcool", "lenço", "toalha", "sabonete", "escova"] },
  { name: "Outros", keywords: [] },
];

function classifyItem(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(keyword => lowerName.includes(keyword))) {
      return cat.name;
    }
  }
  return "Outros";
}

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand_suggestion?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { uploaded_list_id } = await req.json();

    if (!uploaded_list_id) {
      return new Response(
        JSON.stringify({ error: 'uploaded_list_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-public-upload] Processing upload: ${uploaded_list_id}`);

    // Fetch the uploaded list
    const { data: uploadedList, error: fetchError } = await supabase
      .from('uploaded_lists')
      .select('*')
      .eq('id', uploaded_list_id)
      .single();

    if (fetchError || !uploadedList) {
      console.error('[process-public-upload] Failed to fetch uploaded list:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Upload not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('uploaded_lists')
      .update({ 
        status: 'processing', 
        processing_progress: 10,
        processing_message: 'Baixando arquivo...'
      })
      .eq('id', uploaded_list_id);

    // Track processing started
    await supabase.from('upload_events').insert({
      uploaded_list_id,
      event_type: 'processing_started',
      session_id: uploadedList.session_id,
    });

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('list-uploads')
      .download(uploadedList.file_path);

    if (downloadError || !fileData) {
      console.error('[process-public-upload] Failed to download file:', downloadError);
      await supabase
        .from('uploaded_lists')
        .update({ 
          status: 'failed', 
          error_message: 'Falha ao baixar arquivo'
        })
        .eq('id', uploaded_list_id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('uploaded_lists')
      .update({ 
        processing_progress: 30,
        processing_message: 'Preparando para análise...'
      })
      .eq('id', uploaded_list_id);

    // Convert file to base64 for AI processing (chunk-based to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunkSize = 32768; // Process in 32KB chunks
    let base64 = '';
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64 = btoa(base64);

    await supabase
      .from('uploaded_lists')
      .update({ 
        processing_progress: 50,
        processing_message: 'Analisando com IA...'
      })
      .eq('id', uploaded_list_id);

    // Call the AI analysis function
    let extractedItems: ExtractedItem[] = [];
    
    try {
      // Determine mime type
      const mimeTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      const fileExt = uploadedList.file_name.split('.').pop()?.toLowerCase() || '';
      const mimeType = mimeTypeMap[fileExt] || uploadedList.file_type;

      // Call the existing analyze-material-list function
      console.log(`[process-public-upload] Calling AI analysis, file type: ${mimeType}, base64 length: ${base64.length}`);
      
      const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-material-list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64,
          file_type: mimeType,
        }),
      });

      if (analyzeResponse.ok) {
        const analyzeResult = await analyzeResponse.json();
        console.log('[process-public-upload] AI analysis result:', analyzeResult);
        
        if (analyzeResult.items && Array.isArray(analyzeResult.items)) {
          extractedItems = analyzeResult.items.map((item: any) => ({
            name: item.name || item.item || 'Item sem nome',
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || 'un',
            category: item.category || classifyItem(item.name || item.item || ''),
            brand_suggestion: item.brand || item.brand_suggestion || null,
          }));
        }
      } else {
        console.error('[process-public-upload] AI analysis failed:', await analyzeResponse.text());
      }
    } catch (aiError) {
      console.error('[process-public-upload] AI analysis error:', aiError);
    }

    // If AI didn't extract items, provide some defaults based on file name or empty list
    if (extractedItems.length === 0) {
      console.log('[process-public-upload] No items extracted, using fallback');
      // Fallback: create a placeholder for manual entry
      extractedItems = [];
    }

    await supabase
      .from('uploaded_lists')
      .update({ 
        processing_progress: 90,
        processing_message: 'Finalizando...'
      })
      .eq('id', uploaded_list_id);

    // Update the uploaded list with extracted items
    const { error: updateError } = await supabase
      .from('uploaded_lists')
      .update({
        status: 'completed',
        processing_progress: 100,
        processing_message: `${extractedItems.length} itens encontrados`,
        extracted_items: extractedItems,
      })
      .eq('id', uploaded_list_id);

    if (updateError) {
      console.error('[process-public-upload] Failed to update extracted items:', updateError);
    }

    // Track processing completed
    await supabase.from('upload_events').insert({
      uploaded_list_id,
      event_type: 'processing_completed',
      metadata: { items_count: extractedItems.length },
      session_id: uploadedList.session_id,
    });

    console.log(`[process-public-upload] Completed. Extracted ${extractedItems.length} items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        items_count: extractedItems.length,
        items: extractedItems,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-public-upload] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
