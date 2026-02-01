-- Add cursor_line column to import_jobs for re-entrant processing
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS cursor_line integer DEFAULT 0;

-- Add file_path column if not exists (for storing CSV in storage)
-- Already exists from previous migration

-- Create index for faster job lookups
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);