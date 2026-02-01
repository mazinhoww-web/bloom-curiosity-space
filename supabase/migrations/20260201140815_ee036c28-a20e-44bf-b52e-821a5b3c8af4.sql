-- Create storage bucket for import files
INSERT INTO storage.buckets (id, name, public)
VALUES ('import-files', 'import-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to manage import files (edge functions use service role)
CREATE POLICY "Service role can manage import files"
ON storage.objects FOR ALL
USING (bucket_id = 'import-files')
WITH CHECK (bucket_id = 'import-files');