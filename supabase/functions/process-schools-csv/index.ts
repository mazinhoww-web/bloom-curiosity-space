import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RawSchool {
  name?: string;
  cep?: string;
  address?: string;
  endereco?: string;
  city?: string;
  cidade?: string;
  state?: string;
  estado?: string;
  uf?: string;
  phone?: string;
  telefone?: string;
  email?: string;
  tipo?: string;
  type?: string;
  nivel?: string;
  level?: string;
  [key: string]: string | undefined;
}

interface ProcessedSchool {
  name: string;
  slug: string;
  cep: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  school_type?: string;
  education_level?: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface SSEMessage {
  type: "progress" | "complete" | "error";
  stage?: string;
  progress?: number;
  message?: string;
  current?: number;
  total?: number;
  data?: {
    total: number;
    processed: number;
    inserted: number;
    processingErrors: string[];
    insertErrors: string[];
    preview?: ProcessedSchool[];
  };
  error?: string;
}

function createSSEMessage(msg: SSEMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

// Cache para CEPs já consultados
const cepCache = new Map<string, ViaCepResponse | null>();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

function formatPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

async function fetchCepData(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, "");
  
  if (cepCache.has(cleanCep)) {
    return cepCache.get(cleanCep)!;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) {
      cepCache.set(cleanCep, null);
      return null;
    }
    
    const data = await response.json() as ViaCepResponse;
    if (data.erro) {
      cepCache.set(cleanCep, null);
      return null;
    }
    
    cepCache.set(cleanCep, data);
    return data;
  } catch {
    cepCache.set(cleanCep, null);
    return null;
  }
}

// Função para processar em paralelo com controle de concorrência
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;
  
  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      try {
        const result = await processor(item);
        results[index] = result;
      } catch (error) {
        console.error(`Error processing item ${index}:`, error);
        results[index] = null as unknown as R;
      }
    }
  }
  
  // Criar workers em paralelo
  const workers = Array(Math.min(concurrency, items.length)).fill(null).map(() => worker());
  await Promise.all(workers);
  
  return results;
}

// Processar um batch de escolas com IA
async function processAIBatch(
  batch: RawSchool[],
  apiKey: string
): Promise<{ name?: string; school_type?: string; education_level?: string; email?: string }[]> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em processar dados de escolas brasileiras.
Sua tarefa é padronizar, corrigir erros e categorizar os dados das escolas.

Para cada escola, você deve:
1. Corrigir erros de digitação no nome (capitalização adequada, abreviações corretas como "E.E." para "Escola Estadual", "E.M." para "Escola Municipal")
2. Identificar o tipo de escola: "municipal", "estadual", "federal", "particular" ou "outro"
3. Identificar o nível de ensino: "infantil", "fundamental", "medio", "superior", "tecnico" ou "varios"
4. Padronizar o formato do email se presente

Responda APENAS com um array JSON válido, sem markdown ou texto adicional.
Cada objeto deve ter: name (corrigido), school_type, education_level, email (corrigido ou null)`
          },
          {
            role: "user",
            content: JSON.stringify(batch.map(s => ({
              name: s.name || "",
              email: s.email || null,
              tipo: s.tipo || s.type || null,
              nivel: s.nivel || s.level || null
            })))
          }
        ],
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      console.error("AI API error:", response.status);
      return batch.map(() => ({}));
    }
    
    const aiResult = await response.json();
    return JSON.parse(aiResult.choices[0].message.content);
  } catch (error) {
    console.error("Error processing AI batch:", error);
    return batch.map(() => ({}));
  }
}

async function processWithAI(
  schools: RawSchool[], 
  apiKey: string,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<{ processed: ProcessedSchool[]; errors: string[] }> {
  const processed: ProcessedSchool[] = [];
  const errors: string[] = [];
  
  // Criar batches de 50 para IA
  const batchSize = 50;
  const batches: RawSchool[][] = [];
  
  for (let i = 0; i < schools.length; i += batchSize) {
    batches.push(schools.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${schools.length} schools in ${batches.length} AI batches with concurrency 5...`);
  
  // Processar batches de IA em paralelo (5 simultâneos) com progresso
  let completedBatches = 0;
  const aiBatchResults = await processInParallel(
    batches,
    async (batch) => {
      const result = await processAIBatch(batch, apiKey);
      completedBatches++;
      if (onProgress) {
        onProgress(completedBatches, batches.length, "ai");
      }
      return result;
    },
    5
  );
  
  console.log(`AI processing complete. Enriching with CEP data...`);
  
  // Flatten os resultados da IA
  const aiResults: { name?: string; school_type?: string; education_level?: string; email?: string }[] = [];
  aiBatchResults.forEach(batchResult => {
    if (batchResult) {
      aiResults.push(...batchResult);
    }
  });
  
  // Processar cada escola com enriquecimento de CEP
  let processedCount = 0;
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const aiData = aiResults[i] || {};
    
    const result = await processSchoolWithAI(school, aiData);
    if (result) {
      processed.push(result);
      processedCount++;
    } else {
      errors.push(`Erro ao processar: ${school.name || "escola sem nome"}`);
    }
    
    // Reportar progresso a cada 100 escolas
    if (processedCount % 100 === 0 && onProgress) {
      onProgress(processedCount, schools.length, "cep");
    }
  }
  
  console.log(`Finished processing ${processed.length} schools, ${errors.length} errors`);
  
  return { processed, errors };
}

async function processSchoolWithAI(school: RawSchool, aiData: { name?: string; school_type?: string; education_level?: string; email?: string }): Promise<ProcessedSchool | null> {
  const name = aiData.name || school.name;
  if (!name) return null;
  
  const rawCep = school.cep || "";
  const cleanCep = rawCep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  
  // Enriquecer com dados do CEP
  let address = school.address || school.endereco || null;
  let city = school.city || school.cidade || null;
  let state = school.state || school.estado || school.uf || null;
  
  // Se faltam dados de endereço, buscar via CEP
  if (!address || !city || !state) {
    const cepData = await fetchCepData(cleanCep);
    if (cepData) {
      if (!address && cepData.logradouro) {
        address = `${cepData.logradouro}${cepData.bairro ? `, ${cepData.bairro}` : ""}`;
      }
      if (!city) city = cepData.localidade;
      if (!state) state = cepData.uf;
    }
  }
  
  // Gerar slug único
  const baseSlug = generateSlug(name);
  const slug = city ? `${baseSlug}-${generateSlug(city)}` : baseSlug;
  
  return {
    name: name.trim(),
    slug,
    cep: formatCep(cleanCep),
    address,
    city,
    state: state?.toUpperCase() || null,
    phone: formatPhone(school.phone || school.telefone),
    email: aiData.email || school.email || null,
    is_active: true,
    school_type: aiData.school_type,
    education_level: aiData.education_level,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { schools, insertToDb = false, use_sse = false } = await req.json() as { 
      schools: RawSchool[]; 
      insertToDb?: boolean;
      use_sse?: boolean;
    };

    if (!schools || !Array.isArray(schools)) {
      return new Response(
        JSON.stringify({ error: "Invalid schools data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received ${schools.length} schools to process. insertToDb: ${insertToDb}, use_sse: ${use_sse}`);
    
    // Se SSE está habilitado, usar streaming
    if (use_sse) {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Processar em background
      (async () => {
        try {
          // Etapa 1: Iniciando
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "starting",
            progress: 5,
            message: "Iniciando processamento...",
            current: 0,
            total: schools.length,
          })));

          const batchSize = 50;
          const totalBatches = Math.ceil(schools.length / batchSize);
          let completedAIBatches = 0;
          let completedCEP = 0;

          // Processar escolas com IA e enriquecimento com callback de progresso
          const { processed, errors } = await processWithAI(
            schools,
            LOVABLE_API_KEY,
            async (current, total, stage) => {
              if (stage === "ai") {
                completedAIBatches = current;
                const aiProgress = Math.round((current / total) * 40); // 5-45%
                await writer.write(encoder.encode(createSSEMessage({
                  type: "progress",
                  stage: "ai_processing",
                  progress: 5 + aiProgress,
                  message: `Processando com IA... (${current}/${total} batches)`,
                  current: current * batchSize,
                  total: schools.length,
                })));
              } else if (stage === "cep") {
                completedCEP = current;
                const cepProgress = Math.round((current / total) * 20); // 45-65%
                await writer.write(encoder.encode(createSSEMessage({
                  type: "progress",
                  stage: "cep_enrichment",
                  progress: 45 + cepProgress,
                  message: `Enriquecendo dados via CEP... (${current.toLocaleString()}/${total.toLocaleString()})`,
                  current,
                  total,
                })));
              }
            }
          );
          
          await writer.write(encoder.encode(createSSEMessage({
            type: "progress",
            stage: "processed",
            progress: 65,
            message: `${processed.length.toLocaleString()} escolas processadas`,
            current: processed.length,
            total: schools.length,
          })));

          let inserted = 0;
          const insertErrors: string[] = [];

          if (insertToDb && processed.length > 0) {
            await writer.write(encoder.encode(createSSEMessage({
              type: "progress",
              stage: "inserting",
              progress: 70,
              message: "Inserindo no banco de dados...",
              current: 0,
              total: processed.length,
            })));
            
            // Inserir em batches de 100
            const insertBatchSize = 100;
            
            for (let i = 0; i < processed.length; i += insertBatchSize) {
              const batch = processed.slice(i, i + insertBatchSize);
              
              const { error } = await supabase.from("schools").insert(
                batch.map(s => ({
                  name: s.name,
                  slug: s.slug,
                  cep: s.cep,
                  address: s.address,
                  city: s.city,
                  state: s.state,
                  phone: s.phone,
                  email: s.email,
                  is_active: s.is_active,
                }))
              );
              
              if (error) {
                if (error.code === "23505") {
                  // Unique constraint - tentar inserir um por um
                  for (const school of batch) {
                    const { error: singleError } = await supabase.from("schools").insert({
                      name: school.name,
                      slug: school.slug,
                      cep: school.cep,
                      address: school.address,
                      city: school.city,
                      state: school.state,
                      phone: school.phone,
                      email: school.email,
                      is_active: school.is_active,
                    });
                    
                    if (singleError) {
                      if (singleError.code === "23505") {
                        // Tentar com slug modificado
                        const newSlug = `${school.slug}-${Date.now().toString(36)}`;
                        const { error: retryError } = await supabase.from("schools").insert({
                          ...school,
                          slug: newSlug,
                        });
                        
                        if (retryError) {
                          insertErrors.push(`"${school.name}": ${retryError.message}`);
                        } else {
                          inserted++;
                        }
                      } else {
                        insertErrors.push(`"${school.name}": ${singleError.message}`);
                      }
                    } else {
                      inserted++;
                    }
                  }
                } else {
                  insertErrors.push(`Batch error: ${error.message}`);
                }
              } else {
                inserted += batch.length;
              }
              
              // Enviar progresso de inserção
              const insertProgress = Math.round((inserted / processed.length) * 30); // 70-100%
              await writer.write(encoder.encode(createSSEMessage({
                type: "progress",
                stage: "inserting",
                progress: 70 + insertProgress,
                message: `Inserindo... (${inserted.toLocaleString()}/${processed.length.toLocaleString()})`,
                current: inserted,
                total: processed.length,
              })));
            }
          }

          // Concluído
          await writer.write(encoder.encode(createSSEMessage({
            type: "complete",
            progress: 100,
            message: insertToDb 
              ? `${inserted.toLocaleString()} escola(s) importada(s)!`
              : `${processed.length.toLocaleString()} escola(s) processada(s)!`,
            data: {
              total: schools.length,
              processed: processed.length,
              inserted,
              processingErrors: errors,
              insertErrors,
              preview: insertToDb ? undefined : processed.slice(0, 10),
            },
          })));

          await writer.close();
        } catch (error) {
          console.error("SSE Error:", error);
          await writer.write(encoder.encode(createSSEMessage({
            type: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido",
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
    const { processed, errors } = await processWithAI(schools, LOVABLE_API_KEY);
    
    console.log(`Processed ${processed.length} schools, ${errors.length} errors`);

    let inserted = 0;
    const insertErrors: string[] = [];

    if (insertToDb && processed.length > 0) {
      console.log(`Inserting ${processed.length} schools into database...`);
      
      // Inserir em batches de 100
      const insertBatchSize = 100;
      
      for (let i = 0; i < processed.length; i += insertBatchSize) {
        const batch = processed.slice(i, i + insertBatchSize);
        
        const { error } = await supabase.from("schools").insert(
          batch.map(s => ({
            name: s.name,
            slug: s.slug,
            cep: s.cep,
            address: s.address,
            city: s.city,
            state: s.state,
            phone: s.phone,
            email: s.email,
            is_active: s.is_active,
          }))
        );
        
        if (error) {
          if (error.code === "23505") {
            // Unique constraint - tentar inserir um por um
            for (const school of batch) {
              const { error: singleError } = await supabase.from("schools").insert({
                name: school.name,
                slug: school.slug,
                cep: school.cep,
                address: school.address,
                city: school.city,
                state: school.state,
                phone: school.phone,
                email: school.email,
                is_active: school.is_active,
              });
              
              if (singleError) {
                if (singleError.code === "23505") {
                  // Tentar com slug modificado
                  const newSlug = `${school.slug}-${Date.now().toString(36)}`;
                  const { error: retryError } = await supabase.from("schools").insert({
                    ...school,
                    slug: newSlug,
                  });
                  
                  if (retryError) {
                    insertErrors.push(`"${school.name}": ${retryError.message}`);
                  } else {
                    inserted++;
                  }
                } else {
                  insertErrors.push(`"${school.name}": ${singleError.message}`);
                }
              } else {
                inserted++;
              }
            }
          } else {
            insertErrors.push(`Batch error: ${error.message}`);
          }
        } else {
          inserted += batch.length;
        }
        
        // Log de progresso a cada 1000 inserções
        if (inserted % 1000 === 0 && inserted > 0) {
          console.log(`Inserted ${inserted}/${processed.length} schools...`);
        }
      }
      
      console.log(`Finished inserting. Total: ${inserted}, Errors: ${insertErrors.length}`);
    }

    return new Response(
      JSON.stringify({
        total: schools.length,
        processed: processed.length,
        inserted,
        processingErrors: errors,
        insertErrors,
        preview: insertToDb ? undefined : processed.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing schools:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
