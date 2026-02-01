import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 2000; // Optimal batch size for bulk inserts

interface SchoolRecord {
  name: string;
  cep: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
}

function generateSlug(name: string, cep: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanCep = cep.replace(/\D/g, '');
  return `${cleanName}-${cleanCep}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function formatCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

function formatPhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

async function processImportJob(
  supabaseUrl: string,
  supabaseKey: string,
  jobId: string,
  csvContent: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();
  
  console.log(`[process-schools-csv] Starting job ${jobId}`);
  
  try {
    // Update job to processing
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV vazio ou sem dados');
    }

    // Get headers
    const headers = parseCSVLine(lines[0]).map(h => 
      h.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    );

    // Map column indices
    const columnMap: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      // Name variations
      if (header.includes('nome') || header === 'name') columnMap['name'] = index;
      // CEP
      if (header.includes('cep') || header.includes('codigo_postal')) columnMap['cep'] = index;
      // Address
      if (header.includes('endereco') || header.includes('address') || header.includes('logradouro')) columnMap['address'] = index;
      // City
      if (header.includes('cidade') || header === 'city' || header.includes('municipio')) columnMap['city'] = index;
      // State
      if (header.includes('estado') || header === 'state' || header === 'uf') columnMap['state'] = index;
      // Phone
      if (header.includes('telefone') || header.includes('phone') || header.includes('fone')) columnMap['phone'] = index;
      // Email
      if (header.includes('email') || header.includes('e-mail')) columnMap['email'] = index;
    });

    const nameIdx = columnMap['name'] ?? 0;
    const cepIdx = columnMap['cep'] ?? 1;

    const dataLines = lines.slice(1);
    const totalRecords = dataLines.length;

    // Update total records
    await supabase
      .from('import_jobs')
      .update({ total_records: totalRecords })
      .eq('id', jobId);

    console.log(`[process-schools-csv] Processing ${totalRecords} records in batches of ${BATCH_SIZE}`);

    let insertedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let currentBatch = 0;

    // Process in batches
    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      currentBatch++;
      const batchLines = dataLines.slice(i, i + BATCH_SIZE);
      const schools: SchoolRecord[] = [];

      for (const line of batchLines) {
        try {
          const values = parseCSVLine(line);
          
          const name = values[nameIdx]?.trim();
          const rawCep = values[cepIdx] || '';
          const cleanCep = rawCep.replace(/\D/g, '');
          
          if (!name || !cleanCep || cleanCep.length < 5) {
            skippedCount++;
            continue;
          }

          const school: SchoolRecord = {
            name,
            cep: formatCep(cleanCep),
            slug: generateSlug(name, cleanCep),
            address: columnMap['address'] !== undefined ? values[columnMap['address']]?.trim() || null : null,
            city: columnMap['city'] !== undefined ? values[columnMap['city']]?.trim() || null : null,
            state: columnMap['state'] !== undefined ? values[columnMap['state']]?.trim().toUpperCase().slice(0, 2) || null : null,
            phone: formatPhone(columnMap['phone'] !== undefined ? values[columnMap['phone']] : undefined),
            email: columnMap['email'] !== undefined ? values[columnMap['email']]?.trim().toLowerCase() || null : null,
            is_active: true,
          };

          schools.push(school);
        } catch (e) {
          console.error(`[process-schools-csv] Error parsing line: ${e}`);
          failedCount++;
        }
      }

      // Bulk insert with ON CONFLICT DO NOTHING (using upsert with ignoreDuplicates)
      if (schools.length > 0) {
        const { data, error } = await supabase
          .from('schools')
          .upsert(schools, {
            onConflict: 'slug',
            ignoreDuplicates: true,
          })
          .select('id');

        if (error) {
          console.error(`[process-schools-csv] Batch ${currentBatch} error:`, error);
          // Try inserting with modified slugs for duplicates
          let batchInserted = 0;
          for (const school of schools) {
            const { error: singleError } = await supabase
              .from('schools')
              .insert(school);
            
            if (singleError) {
              if (singleError.code === '23505') {
                // Duplicate - try with timestamp suffix
                const newSlug = `${school.slug}-${Date.now().toString(36)}`;
                const { error: retryError } = await supabase
                  .from('schools')
                  .insert({ ...school, slug: newSlug });
                
                if (!retryError) {
                  batchInserted++;
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++;
              }
            } else {
              batchInserted++;
            }
          }
          insertedCount += batchInserted;
        } else {
          insertedCount += data?.length || 0;
          skippedCount += schools.length - (data?.length || 0);
        }
      }

      // Update progress
      const processedRecords = Math.min(i + BATCH_SIZE, totalRecords);
      await supabase
        .from('import_jobs')
        .update({ 
          processed_records: processedRecords,
          inserted_records: insertedCount,
          skipped_records: skippedCount,
          failed_records: failedCount,
          current_batch: currentBatch,
        })
        .eq('id', jobId);

      console.log(`[process-schools-csv] Batch ${currentBatch}: ${processedRecords}/${totalRecords} processed, ${insertedCount} inserted`);
    }

    const elapsedTime = Date.now() - startTime;

    // Complete the job
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_records: totalRecords,
        inserted_records: insertedCount,
        skipped_records: skippedCount,
        failed_records: failedCount,
        error_details: {
          elapsed_ms: elapsedTime,
          elapsed_formatted: `${Math.floor(elapsedTime / 60000)}m ${Math.floor((elapsedTime % 60000) / 1000)}s`,
        },
      })
      .eq('id', jobId);

    console.log(`[process-schools-csv] Job ${jobId} completed in ${elapsedTime}ms: ${insertedCount} inserted, ${skippedCount} skipped, ${failedCount} failed`);

  } catch (error: any) {
    console.error(`[process-schools-csv] Job ${jobId} failed:`, error);
    
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error',
      })
      .eq('id', jobId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Arquivo CSV é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[process-schools-csv] Received file: ${file.name}, size: ${file.size}`);

      // Read file content
      const csvContent = await file.text();

      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          job_type: 'schools_csv',
          file_name: file.name,
          status: 'queued',
          batch_size: BATCH_SIZE,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('[process-schools-csv] Failed to create job:', jobError);
        return new Response(
          JSON.stringify({ error: 'Falha ao criar job de importação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[process-schools-csv] Created job: ${job.id}`);

      // Process in background using EdgeRuntime.waitUntil
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(processImportJob(supabaseUrl, supabaseKey, job.id, csvContent));

      // Return immediately with job ID
      return new Response(
        JSON.stringify({ 
          success: true,
          job_id: job.id,
          message: 'Importação iniciada em background. Acompanhe o progresso pelo job ID.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle JSON request for job status
    const body = await req.json();
    
    if (body.action === 'status' && body.job_id) {
      const { data: job, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', body.job_id)
        .single();
      
      if (error || !job) {
        return new Response(
          JSON.stringify({ error: 'Job não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(job),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-schools-csv] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
