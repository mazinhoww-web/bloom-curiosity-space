-- Create table to store cron job settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert system settings"
ON public.system_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default cache refresh settings
INSERT INTO public.system_settings (id, value, description)
VALUES (
  'cache_refresh_schedule',
  '{"enabled": true, "interval_hours": 24, "last_run": null, "next_run": null}'::jsonb,
  'Configuração do refresh automático do cache de escolas populares'
)
ON CONFLICT (id) DO NOTHING;

-- Create table to log cache refresh executions
CREATE TABLE IF NOT EXISTS public.cache_refresh_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  success BOOLEAN NOT NULL,
  schools_result TEXT,
  lists_result TEXT,
  triggered_by TEXT DEFAULT 'manual',
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.cache_refresh_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view cache refresh logs"
ON public.cache_refresh_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow service role to insert logs
CREATE POLICY "Service role can insert cache refresh logs"
ON public.cache_refresh_logs
FOR INSERT
WITH CHECK (true);

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;