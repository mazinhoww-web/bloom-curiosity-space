-- Create storage bucket for list uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'list-uploads', 
  'list-uploads', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for list-uploads bucket
CREATE POLICY "Anyone can upload lists"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'list-uploads');

CREATE POLICY "Anyone can view their uploaded lists"
ON storage.objects
FOR SELECT
USING (bucket_id = 'list-uploads');

-- Create uploaded_lists table to track upload sessions
CREATE TABLE public.uploaded_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- School reference (optional if not in system)
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name_custom TEXT, -- For schools not in system
  
  -- Grade selection
  grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  
  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  
  -- Processing status: pending, processing, completed, failed, published
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'published')),
  processing_progress INTEGER DEFAULT 0, -- 0-100
  processing_message TEXT,
  error_message TEXT,
  
  -- AI-extracted items (stored as JSON before review)
  extracted_items JSONB,
  
  -- After publishing, reference to created material_list
  material_list_id UUID REFERENCES public.material_lists(id) ON DELETE SET NULL,
  
  -- Session tracking
  session_id TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create upload_events for metrics
CREATE TABLE public.upload_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_list_id UUID REFERENCES public.uploaded_lists(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('upload_started', 'processing_started', 'processing_completed', 'processing_failed', 'list_published', 'list_shared')),
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uploaded_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_lists
CREATE POLICY "Anyone can create uploaded lists"
ON public.uploaded_lists
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their own uploaded lists by session"
ON public.uploaded_lists
FOR SELECT
USING (true); -- Public access for simplicity, items are not sensitive

CREATE POLICY "Anyone can update their uploaded lists"
ON public.uploaded_lists
FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage all uploaded lists"
ON public.uploaded_lists
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for upload_events
CREATE POLICY "Anyone can create upload events"
ON public.upload_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view upload events"
ON public.upload_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_uploaded_lists_updated_at
BEFORE UPDATE ON public.uploaded_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_uploaded_lists_status ON public.uploaded_lists(status);
CREATE INDEX idx_uploaded_lists_session_id ON public.uploaded_lists(session_id);