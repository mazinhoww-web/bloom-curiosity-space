import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 1500; // Process 1500 lines per invocation (< 5s execution)
const STORAGE_BUCKET = 'import-files';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get('content-type') || '';
    
    // ========================================
    // ACTION 1: UPLOAD - Create job and store CSV
    // ========================================
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Arquivo CSV é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[upload] Received file: ${file.name}, size: ${file.size}`);

      // Read file content
      const csvContent = await file.text();
      const lines = csvContent.split('\n').filter(line => line.trim());
      const totalRows = lines.length - 1; // Exclude header

      if (totalRows < 1) {
        return new Response(
          JSON.stringify({ error: 'CSV vazio ou sem dados' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create import job first
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          job_type: 'schools_csv',
          file_name: file.name,
          status: 'queued',
          total_records: totalRows,
          processed_records: 0,
          inserted_records: 0,
          skipped_records: 0,
          failed_records: 0,
          cursor_line: 0,
          batch_size: BATCH_SIZE,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('[upload] Failed to create job:', jobError);
        return new Response(
          JSON.stringify({ error: 'Falha ao criar job de importação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store CSV in storage bucket
      const filePath = `imports/${job.id}.csv`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, csvContent, {
          contentType: 'text/csv',
          upsert: true,
        });

      if (uploadError) {
        console.error('[upload] Failed to store CSV:', uploadError);
        // Cleanup job
        await supabase.from('import_jobs').delete().eq('id', job.id);
        return new Response(
          JSON.stringify({ error: 'Falha ao armazenar arquivo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update job with file path
      await supabase
        .from('import_jobs')
        .update({ file_path: filePath })
        .eq('id', job.id);

      console.log(`[upload] Created job ${job.id} with ${totalRows} rows`);

      return new Response(
        JSON.stringify({ 
          success: true,
          job_id: job.id,
          total_rows: totalRows,
          message: 'Job criado. Chame /process para iniciar o processamento.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========================================
    // Handle JSON requests
    // ========================================
    const body = await req.json();
    
    // ========================================
    // ACTION 2: STATUS - Get job status
    // ========================================
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

    // ========================================
    // ACTION 3: PROCESS - Re-entrant batch processing
    // ========================================
    if (body.action === 'process' && body.job_id) {
      const startTime = Date.now();
      const jobId = body.job_id;

      // Get job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already completed or failed
      if (job.status === 'completed' || job.status === 'failed') {
        return new Response(
          JSON.stringify({ 
            done: true,
            status: job.status,
            job,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update status to processing if queued
      if (job.status === 'queued') {
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString() 
          })
          .eq('id', jobId);
      }

      // Download CSV from storage
      const { data: csvData, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(job.file_path);

      if (downloadError || !csvData) {
        console.error('[process] Failed to download CSV:', downloadError);
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'failed',
            error_message: 'Arquivo CSV não encontrado',
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ error: 'Arquivo CSV não encontrado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const csvContent = await csvData.text();
      const allLines = csvContent.split('\n').filter(line => line.trim());
      
      // Parse headers (line 0)
      const headers = parseCSVLine(allLines[0]).map(h => 
        h.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      );

      // Map column indices
      const columnMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        if (header.includes('nome') || header === 'name') columnMap['name'] = index;
        if (header.includes('cep') || header.includes('codigo_postal')) columnMap['cep'] = index;
        if (header.includes('endereco') || header.includes('address') || header.includes('logradouro')) columnMap['address'] = index;
        if (header.includes('cidade') || header === 'city' || header.includes('municipio')) columnMap['city'] = index;
        if (header.includes('estado') || header === 'state' || header === 'uf') columnMap['state'] = index;
        if (header.includes('telefone') || header.includes('phone') || header.includes('fone')) columnMap['phone'] = index;
        if (header.includes('email') || header.includes('e-mail')) columnMap['email'] = index;
      });

      const nameIdx = columnMap['name'] ?? 0;
      const cepIdx = columnMap['cep'] ?? 1;

      // Get cursor position (start from line after header)
      const cursorLine = job.cursor_line || 0;
      const startLine = cursorLine + 1; // +1 because line 0 is header
      const endLine = Math.min(startLine + BATCH_SIZE, allLines.length);
      
      console.log(`[process] Job ${jobId}: Processing lines ${startLine} to ${endLine - 1} of ${allLines.length - 1}`);

      // Process this batch
      const batchLines = allLines.slice(startLine, endLine);
      const schools: SchoolRecord[] = [];
      let skippedInBatch = 0;
      let failedInBatch = 0;

      for (const line of batchLines) {
        try {
          const values = parseCSVLine(line);
          
          const name = values[nameIdx]?.trim();
          const rawCep = values[cepIdx] || '';
          const cleanCep = rawCep.replace(/\D/g, '');
          
          if (!name || !cleanCep || cleanCep.length < 5) {
            skippedInBatch++;
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
          console.error(`[process] Error parsing line: ${e}`);
          failedInBatch++;
        }
      }

      // Bulk insert with conflict handling
      let insertedInBatch = 0;
      if (schools.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('schools')
          .upsert(schools, {
            onConflict: 'slug',
            ignoreDuplicates: true,
          })
          .select('id');

        if (insertError) {
          console.error(`[process] Batch insert error:`, insertError);
          // Count as skipped if bulk fails
          skippedInBatch += schools.length;
        } else {
          insertedInBatch = insertedData?.length || 0;
          skippedInBatch += schools.length - insertedInBatch;
        }
      }

      // Calculate new cursor
      const newCursorLine = endLine - 1; // -1 because we want the last data line processed
      const newProcessedRecords = (job.processed_records || 0) + batchLines.length;
      const newInsertedRecords = (job.inserted_records || 0) + insertedInBatch;
      const newSkippedRecords = (job.skipped_records || 0) + skippedInBatch;
      const newFailedRecords = (job.failed_records || 0) + failedInBatch;
      const newCurrentBatch = (job.current_batch || 0) + 1;

      // Check if done
      const isDone = endLine >= allLines.length;
      const elapsedMs = Date.now() - (job.started_at ? new Date(job.started_at).getTime() : startTime);

      // Update job
      const updateData: Record<string, any> = {
        cursor_line: newCursorLine,
        processed_records: newProcessedRecords,
        inserted_records: newInsertedRecords,
        skipped_records: newSkippedRecords,
        failed_records: newFailedRecords,
        current_batch: newCurrentBatch,
      };

      if (isDone) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.error_details = {
          elapsed_ms: elapsedMs,
          elapsed_formatted: `${Math.floor(elapsedMs / 60000)}m ${Math.floor((elapsedMs % 60000) / 1000)}s`,
        };

        // Cleanup: delete CSV from storage
        await supabase.storage.from(STORAGE_BUCKET).remove([job.file_path]);
      }

      await supabase
        .from('import_jobs')
        .update(updateData)
        .eq('id', jobId);

      const batchTime = Date.now() - startTime;
      console.log(`[process] Job ${jobId}: Batch ${newCurrentBatch} done in ${batchTime}ms - ${insertedInBatch} inserted, ${skippedInBatch} skipped`);

      return new Response(
        JSON.stringify({
          done: isDone,
          status: isDone ? 'completed' : 'processing',
          cursor_line: newCursorLine,
          processed_records: newProcessedRecords,
          inserted_records: newInsertedRecords,
          skipped_records: newSkippedRecords,
          batch_time_ms: batchTime,
          total_records: job.total_records,
          current_batch: newCurrentBatch,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use: upload (multipart), status, ou process' }),
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
