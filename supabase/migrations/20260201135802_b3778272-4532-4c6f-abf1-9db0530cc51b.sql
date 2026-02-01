-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create import_jobs table for tracking async imports
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Job metadata
  job_type TEXT NOT NULL DEFAULT 'schools_csv',
  file_name TEXT NOT NULL,
  file_path TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  
  -- Progress counters
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  inserted_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Batch info
  current_batch INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 1000,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage import jobs
CREATE POLICY "Admins can manage import jobs"
ON public.import_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for status queries
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON public.import_jobs(created_at DESC);

-- Create indexes for schools table for high-performance search
-- B-tree index on CEP for exact and prefix matches
CREATE INDEX IF NOT EXISTS idx_schools_cep ON public.schools(cep);

-- GIN trigram index on name for fuzzy/partial text search
CREATE INDEX idx_schools_name_trgm ON public.schools USING GIN (name gin_trgm_ops);

-- Composite index for common queries
CREATE INDEX idx_schools_active_name ON public.schools(is_active, name) WHERE is_active = true;