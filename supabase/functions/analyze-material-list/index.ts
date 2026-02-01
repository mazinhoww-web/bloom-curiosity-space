import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedItem {
  name: string;
  name_original?: string;
  quantity: number;
  category: string;
  description: string | null;
  brand_suggestion: string | null;
  is_required: boolean;
  item_type?: string;
  search_query?: string;
  confidence_score?: number;
  notes?: string;
}

interface AnalysisResult {
  items: ExtractedItem[];
  school_name: string | null;
  grade: string | null;
  year: number | null;
  raw_text: string | null;
}

// Robust prompt for material list extraction
const SYSTEM_PROMPT = `Você é um sistema de IA especializado em normalização, classificação e padronização de listas de materiais escolares.

Sua função é analisar listas escolares e classificar cada item de forma CONSISTENTE, comparável e reutilizável.

⚠️ REGRAS ABSOLUTAS
- NÃO inventar itens
- NÃO excluir itens
- NÃO fundir itens que não sejam semanticamente equivalentes
- NÃO assumir marcas quando não explicitadas
- NÃO simplificar regras condicionais
- EXTRAIR TODOS os itens, mesmo que pareçam duplicados

================================================
PROCESSO OBRIGATÓRIO
================================================

1️⃣ EXTRAÇÃO
- Identificar TODOS os itens da lista, linha por linha
- Separar itens concretos (compráveis) de observações

2️⃣ NORMALIZAÇÃO
Para cada item:
- name: Nome padronizado (ex: "Caderno 96 Folhas")
- Unificar plural/singular
- Manter especificações importantes (quantidade de folhas, cores, tamanho)

3️⃣ CLASSIFICAÇÃO
Classificar em UMA categoria:
- escrita (lápis, canetas, borracha)
- cadernos (cadernos, blocos)
- papelaria (papel, envelopes, pastas)
- artes (tintas, pincéis, massinha)
- higiene (lenços, fraldas, toalhas)
- uniforme (roupas, acessórios)
- livros (livros, apostilas)
- outros (mochilas, lancheiras, brinquedos)

4️⃣ TIPO DE ITEM
- is_required: true (obrigatório) ou false (opcional/condicional)

5️⃣ QUANTIDADE
- Extrair quantidade explícita do texto
- Se ausente: quantity = 1

================================================
SAÍDA OBRIGATÓRIA (JSON)
================================================

{
  "items": [
    {
      "name": "Nome Padronizado do Item",
      "quantity": 1,
      "category": "categoria",
      "description": "descrição adicional ou null",
      "brand_suggestion": "marca se mencionada ou null",
      "is_required": true
    }
  ],
  "school_name": "Nome da Escola ou null",
  "grade": "Série ou null",
  "year": 2025,
  "raw_text": null
}

IMPORTANTE:
- Responda APENAS com JSON válido
- NÃO use markdown, NÃO use \`\`\`json
- O JSON deve ser parseável diretamente
- Liste TODOS os itens encontrados, mesmo que sejam muitos`;

// Helper function to log AI provider metrics
async function logMetric(
  supabaseUrl: string,
  supabaseKey: string,
  functionName: string,
  provider: string,
  success: boolean,
  responseTimeMs: number,
  fallbackUsed: boolean,
  errorMessage?: string
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('ai_provider_metrics').insert({
      function_name: functionName,
      provider,
      success,
      response_time_ms: responseTimeMs,
      fallback_used: fallbackUsed,
      error_message: errorMessage || null,
    });
    if (error) {
      console.error('[Metrics] Insert error:', error);
    } else {
      console.log(`[Metrics] Logged: ${provider} - ${success ? 'success' : 'failed'} - ${responseTimeMs}ms`);
    }
  } catch (err) {
    console.error('[Metrics] Failed to log metric:', err);
  }
}

// Helper function to call AI provider
async function callAI(
  apiUrl: string, 
  apiKey: string, 
  model: string, 
  imageContent: { type: string; image_url: { url: string } },
  providerName: string
): Promise<{ success: boolean; content?: string; error?: string; status?: number; responseTimeMs: number }> {
  console.log(`[AI] Calling ${providerName} with model ${model}...`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(providerName === "OpenRouter" ? { "HTTP-Referer": "https://listapronta1.lovable.app" } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta lista de materiais escolares e extraia TODOS os itens. Retorne APENAS JSON válido, sem markdown."
              },
              imageContent
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 8192, // Reduced to work within OpenRouter free tier limits
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] ${providerName} API error:`, response.status, errorText);
      return { success: false, error: errorText, status: response.status, responseTimeMs };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: "Empty response from AI", responseTimeMs };
    }

    console.log(`[AI] ${providerName} response received successfully in ${responseTimeMs}ms`);
    return { success: true, content, responseTimeMs };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error(`[AI] ${providerName} call failed:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", responseTimeMs };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI API keys configured (OPENROUTER_API_KEY or LOVABLE_API_KEY)");
    }

    const { image_base64, image_url, file_type } = await req.json() as { 
      image_base64?: string; 
      image_url?: string;
      file_type?: string;
    };

    if (!image_base64 && !image_url) {
      return new Response(
        JSON.stringify({ error: "É necessário enviar uma imagem (base64 ou URL)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-material-list] Starting analysis...");
    console.log(`[analyze-material-list] File type: ${file_type}, Base64 length: ${image_base64?.length || 0}`);

    // Prepare image content for the API
    let imageContent: { type: string; image_url: { url: string } };
    
    if (image_base64) {
      const mimeType = file_type || "image/jpeg";
      imageContent = {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${image_base64}`
        }
      };
    } else {
      imageContent = {
        type: "image_url",
        image_url: {
          url: image_url!
        }
      };
    }

    let aiContent: string | null = null;
    let usedProvider = "none";
    let fallbackUsed = false;

    // Try OpenRouter first (primary)
    if (OPENROUTER_API_KEY) {
      console.log("[analyze-material-list] Trying OpenRouter (primary)...");
      const openRouterResult = await callAI(
        "https://openrouter.ai/api/v1/chat/completions",
        OPENROUTER_API_KEY,
        "google/gemini-2.5-flash",
        imageContent,
        "OpenRouter"
      );

      // Log OpenRouter attempt
      await logMetric(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        "analyze-material-list",
        "OpenRouter",
        openRouterResult.success,
        openRouterResult.responseTimeMs,
        false,
        openRouterResult.error
      );

      if (openRouterResult.success && openRouterResult.content) {
        aiContent = openRouterResult.content;
        usedProvider = "OpenRouter";
        console.log(`[analyze-material-list] ✅ OpenRouter succeeded in ${openRouterResult.responseTimeMs}ms`);
      } else {
        console.log(`[analyze-material-list] ❌ OpenRouter failed: ${openRouterResult.error}`);
        
        // Check for rate limiting or payment issues
        if (openRouterResult.status === 429) {
          console.log("[analyze-material-list] OpenRouter rate limited, trying fallback...");
        } else if (openRouterResult.status === 402) {
          console.log("[analyze-material-list] OpenRouter payment required, trying fallback...");
        }
      }
    }

    // Fallback to Lovable AI
    if (!aiContent && LOVABLE_API_KEY) {
      console.log("[analyze-material-list] Trying Lovable AI (fallback)...");
      fallbackUsed = true;
      
      const lovableResult = await callAI(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        LOVABLE_API_KEY,
        "google/gemini-2.5-flash",
        imageContent,
        "Lovable AI"
      );

      // Log Lovable AI attempt
      await logMetric(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        "analyze-material-list",
        "Lovable AI",
        lovableResult.success,
        lovableResult.responseTimeMs,
        true,
        lovableResult.error
      );

      if (lovableResult.success && lovableResult.content) {
        aiContent = lovableResult.content;
        usedProvider = "Lovable AI";
        console.log(`[analyze-material-list] ✅ Lovable AI succeeded in ${lovableResult.responseTimeMs}ms`);
      } else {
        console.log(`[analyze-material-list] ❌ Lovable AI failed: ${lovableResult.error}`);
        
        // Return appropriate error based on status
        if (lovableResult.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (lovableResult.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`Both AI providers failed. Last error: ${lovableResult.error}`);
      }
    }

    if (!aiContent) {
      throw new Error("No AI provider available to process the request");
    }

    console.log(`[analyze-material-list] ✅ Successfully processed with ${usedProvider} (fallback: ${fallbackUsed})`);
    const content = aiContent;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("AI response received, parsing...");
    console.log("Content length:", content.length);
    console.log("Content preview:", content.substring(0, 500));

    // Parse the JSON response with multiple strategies
    let analysisResult: AnalysisResult;
    try {
      // Strategy 1: Try direct parse (if response is clean JSON)
      const cleanContent = content.trim();
      if (cleanContent.startsWith("{")) {
        try {
          analysisResult = JSON.parse(cleanContent);
        } catch {
          // Strategy 2: Try to extract JSON from markdown code block
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[1].trim());
          } else {
            // Strategy 3: Find JSON object pattern
            const objectMatch = content.match(/\{[\s\S]*"items"[\s\S]*\}/);
            if (objectMatch) {
              // Try to fix common JSON issues
              let jsonStr = objectMatch[0];
              // Remove trailing commas before } or ]
              jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
              analysisResult = JSON.parse(jsonStr);
            } else {
              throw new Error("JSON não encontrado na resposta");
            }
          }
        }
      } else {
        // Content doesn't start with {, try extraction methods
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[1].trim());
        } else {
          const objectMatch = content.match(/\{[\s\S]*"items"[\s\S]*\}/);
          if (objectMatch) {
            let jsonStr = objectMatch[0];
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
            analysisResult = JSON.parse(jsonStr);
          } else {
            throw new Error("JSON não encontrado na resposta");
          }
        }
      }

      // Validate the result structure
      if (!analysisResult.items || !Array.isArray(analysisResult.items)) {
        console.error("Invalid structure - missing items array");
        analysisResult = {
          items: [],
          school_name: null,
          grade: null,
          year: null,
          raw_text: content
        };
      }

    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw content (first 2000 chars):", content.substring(0, 2000));
      
      // Return empty result with raw content for manual processing
      return new Response(
        JSON.stringify({ 
          items: [],
          school_name: null,
          grade: null,
          year: null,
          raw_text: content,
          parse_error: true,
          error_message: "Não foi possível processar a resposta da IA. Use entrada manual."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully extracted ${analysisResult.items?.length || 0} items`);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing material list:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        items: [],
        parse_error: true
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
