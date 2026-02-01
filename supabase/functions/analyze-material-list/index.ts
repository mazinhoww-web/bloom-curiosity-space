import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedItem {
  name: string;
  quantity: number;
  category: string;
  description: string | null;
  brand_suggestion: string | null;
  is_required: boolean;
}

interface AnalysisResult {
  items: ExtractedItem[];
  school_name: string | null;
  grade: string | null;
  year: number | null;
  raw_text: string | null;
}

interface SSEMessage {
  type: "progress" | "complete" | "error";
  stage?: string;
  progress?: number;
  message?: string;
  data?: AnalysisResult;
  error?: string;
}

function createSSEMessage(msg: SSEMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { image_base64, image_url, file_type, use_sse } = await req.json() as { 
      image_base64?: string; 
      image_url?: string;
      file_type?: string;
      use_sse?: boolean;
    };

    if (!image_base64 && !image_url) {
      return new Response(
        JSON.stringify({ error: "É necessário enviar uma imagem (base64 ou URL)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se SSE está habilitado, usar streaming
    if (use_sse) {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Processar em background
      (async () => {
        try {
          // Etapa 1: Preparando imagem
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "preparing",
            progress: 10,
            message: "Preparando imagem para análise..."
          })));

          // Preparar a imagem para a API
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

          // Etapa 2: Enviando para IA
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "sending",
            progress: 25,
            message: "Enviando para análise com IA..."
          })));

          console.log("Analyzing material list image with SSE...");

          // Etapa 3: IA processando
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "analyzing",
            progress: 40,
            message: "IA analisando a lista de materiais..."
          })));

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `Você é um especialista em extrair informações de listas de materiais escolares.
Analise a imagem e extraia TODOS os itens de material escolar listados.

Para cada item, identifique:
1. Nome do item (padronizado, ex: "Caderno 96 folhas")
2. Quantidade (número, default 1 se não especificado)
3. Categoria: escolha entre "escrita", "cadernos", "papelaria", "artes", "higiene", "uniforme", "livros", "outros"
4. Descrição adicional se houver (cor, tamanho específico, etc.)
5. Sugestão de marca se mencionada
6. Se é obrigatório (default true, false apenas se explicitamente indicado como opcional)

Também extraia se possível:
- Nome da escola
- Série/ano escolar
- Ano letivo

IMPORTANTE: 
- Leia TODO o texto da imagem
- NÃO invente itens que não estão na lista
- Se a imagem for um PDF ou documento, extraia todos os itens de todas as páginas visíveis
- Padronize os nomes dos itens (ex: "Lapis de cor 12 cores" -> "Lápis de Cor 12 Cores")

Responda APENAS com um JSON válido no seguinte formato:
{
  "items": [
    {
      "name": "Nome do Item",
      "quantity": 1,
      "category": "categoria",
      "description": "descrição ou null",
      "brand_suggestion": "marca ou null",
      "is_required": true
    }
  ],
  "school_name": "Nome da Escola ou null",
  "grade": "Série ou null",
  "year": 2025,
  "raw_text": "Texto extraído da imagem"
}`
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Analise esta lista de materiais escolares e extraia todos os itens com suas informações:"
                    },
                    imageContent
                  ]
                }
              ],
              temperature: 0.1,
              max_tokens: 4096,
            }),
          });

          // Etapa 4: Processando resposta
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "processing",
            progress: 70,
            message: "Processando resposta da IA..."
          })));

          if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API error:", response.status, errorText);
            
            let errorMessage = "Erro ao processar com IA";
            if (response.status === 429) {
              errorMessage = "Limite de requisições excedido. Tente novamente em alguns minutos.";
            } else if (response.status === 402) {
              errorMessage = "Créditos insuficientes. Adicione créditos ao workspace.";
            }
            
            await writer.write(encoder.encode(createSSEMessage({
              type: "error",
              error: errorMessage
            })));
            await writer.close();
            return;
          }

          const aiResult = await response.json();
          const content = aiResult.choices?.[0]?.message?.content;
          
          if (!content) {
            await writer.write(encoder.encode(createSSEMessage({
              type: "error",
              error: "Resposta vazia da IA"
            })));
            await writer.close();
            return;
          }

          // Etapa 5: Extraindo itens
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "extracting",
            progress: 85,
            message: "Extraindo itens da lista..."
          })));

          console.log("AI response received, parsing...");

          // Parse o JSON da resposta
          let analysisResult: AnalysisResult;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("JSON não encontrado na resposta");
            }
          } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            await writer.write(encoder.encode(createSSEMessage({
              type: "error",
              error: "Erro ao processar resposta da IA"
            })));
            await writer.close();
            return;
          }

          // Etapa 6: Concluído
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "complete",
            progress: 100,
            message: `${analysisResult.items?.length || 0} itens encontrados!`
          })));

          console.log(`Extracted ${analysisResult.items?.length || 0} items from the list`);

          // Enviar resultado final
          await writer.write(encoder.encode(createSSEMessage({
            type: "complete",
            data: analysisResult
          })));

          await writer.close();
        } catch (error) {
          console.error("SSE Error:", error);
          await writer.write(encoder.encode(createSSEMessage({
            type: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido"
          })));
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Fluxo tradicional (sem SSE)
    console.log("Analyzing material list image...");

    // Preparar a imagem para a API
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

    // Chamar a IA para analisar a imagem
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em extrair informações de listas de materiais escolares.
Analise a imagem e extraia TODOS os itens de material escolar listados.

Para cada item, identifique:
1. Nome do item (padronizado, ex: "Caderno 96 folhas")
2. Quantidade (número, default 1 se não especificado)
3. Categoria: escolha entre "escrita", "cadernos", "papelaria", "artes", "higiene", "uniforme", "livros", "outros"
4. Descrição adicional se houver (cor, tamanho específico, etc.)
5. Sugestão de marca se mencionada
6. Se é obrigatório (default true, false apenas se explicitamente indicado como opcional)

Também extraia se possível:
- Nome da escola
- Série/ano escolar
- Ano letivo

IMPORTANTE: 
- Leia TODO o texto da imagem
- NÃO invente itens que não estão na lista
- Se a imagem for um PDF ou documento, extraia todos os itens de todas as páginas visíveis
- Padronize os nomes dos itens (ex: "Lapis de cor 12 cores" -> "Lápis de Cor 12 Cores")

Responda APENAS com um JSON válido no seguinte formato:
{
  "items": [
    {
      "name": "Nome do Item",
      "quantity": 1,
      "category": "categoria",
      "description": "descrição ou null",
      "brand_suggestion": "marca ou null",
      "is_required": true
    }
  ],
  "school_name": "Nome da Escola ou null",
  "grade": "Série ou null",
  "year": 2025,
  "raw_text": "Texto extraído da imagem"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta lista de materiais escolares e extraia todos os itens com suas informações:"
              },
              imageContent
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    console.log("AI response received, parsing...");

    // Parse o JSON da resposta
    let analysisResult: AnalysisResult;
    try {
      // Tentar extrair JSON do conteúdo (pode vir com markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    console.log(`Extracted ${analysisResult.items?.length || 0} items from the list`);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing material list:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
