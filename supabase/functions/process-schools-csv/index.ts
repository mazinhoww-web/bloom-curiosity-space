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

async function processWithAI(schools: RawSchool[], apiKey: string): Promise<{ processed: ProcessedSchool[]; errors: string[] }> {
  const processed: ProcessedSchool[] = [];
  const errors: string[] = [];
  
  // Processar em batches de 50 para a IA
  const batchSize = 50;
  
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize);
    
    try {
      // Chamar a IA para padronizar e categorizar
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
        const errorText = await response.text();
        console.error("AI API error:", response.status, errorText);
        
        // Fallback: processar sem IA
        for (const school of batch) {
          const result = await processSchoolBasic(school);
          if (result) {
            processed.push(result);
          } else {
            errors.push(`Erro ao processar: ${school.name || "escola sem nome"}`);
          }
        }
        continue;
      }
      
      const aiResult = await response.json();
      const aiProcessed = JSON.parse(aiResult.choices[0].message.content);
      
      // Combinar dados da IA com enriquecimento via CEP
      for (let j = 0; j < batch.length; j++) {
        const school = batch[j];
        const aiData = aiProcessed[j] || {};
        
        const result = await processSchoolWithAI(school, aiData);
        if (result) {
          processed.push(result);
        } else {
          errors.push(`Erro ao processar: ${school.name || "escola sem nome"}`);
        }
      }
      
    } catch (error) {
      console.error("Error processing batch:", error);
      
      // Fallback: processar sem IA
      for (const school of batch) {
        const result = await processSchoolBasic(school);
        if (result) {
          processed.push(result);
        } else {
          errors.push(`Erro ao processar: ${school.name || "escola sem nome"}`);
        }
      }
    }
  }
  
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

async function processSchoolBasic(school: RawSchool): Promise<ProcessedSchool | null> {
  const name = school.name;
  if (!name) return null;
  
  const rawCep = school.cep || "";
  const cleanCep = rawCep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  
  let address = school.address || school.endereco || null;
  let city = school.city || school.cidade || null;
  let state = school.state || school.estado || school.uf || null;
  
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
  
  const baseSlug = generateSlug(name);
  const slug = city ? `${baseSlug}-${generateSlug(city)}` : baseSlug;
  
  // Detectar tipo básico pelo nome
  let school_type: string | undefined;
  const nameLower = name.toLowerCase();
  if (nameLower.includes("municipal") || nameLower.startsWith("e.m.") || nameLower.startsWith("em ")) {
    school_type = "municipal";
  } else if (nameLower.includes("estadual") || nameLower.startsWith("e.e.") || nameLower.startsWith("ee ")) {
    school_type = "estadual";
  } else if (nameLower.includes("federal") || nameLower.includes("if ") || nameLower.includes("instituto federal")) {
    school_type = "federal";
  } else if (nameLower.includes("colégio") && !nameLower.includes("estadual") && !nameLower.includes("municipal")) {
    school_type = "particular";
  }
  
  return {
    name: name.trim(),
    slug,
    cep: formatCep(cleanCep),
    address,
    city,
    state: state?.toUpperCase() || null,
    phone: formatPhone(school.phone || school.telefone),
    email: school.email || null,
    is_active: true,
    school_type,
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
    const { schools, insertToDb = false } = await req.json() as { schools: RawSchool[]; insertToDb?: boolean };

    if (!schools || !Array.isArray(schools)) {
      return new Response(
        JSON.stringify({ error: "Invalid schools data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${schools.length} schools...`);
    
    // Processar escolas com IA e enriquecimento
    const { processed, errors } = await processWithAI(schools, LOVABLE_API_KEY);
    
    console.log(`Processed ${processed.length} schools, ${errors.length} errors`);

    let inserted = 0;
    let insertErrors: string[] = [];

    if (insertToDb && processed.length > 0) {
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
      }
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
