-- Create table for CEP search events
CREATE TABLE public.cep_search_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cep TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Create table for school view events
CREATE TABLE public.school_view_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Create table for list view events
CREATE TABLE public.list_view_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.cep_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_view_events ENABLE ROW LEVEL SECURITY;

-- Policies for cep_search_events
CREATE POLICY "Anyone can track CEP searches"
ON public.cep_search_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view CEP search events"
ON public.cep_search_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for school_view_events
CREATE POLICY "Anyone can track school views"
ON public.school_view_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view school view events"
ON public.school_view_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for list_view_events
CREATE POLICY "Anyone can track list views"
ON public.list_view_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view list view events"
ON public.list_view_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_cep_search_events_cep ON public.cep_search_events(cep);
CREATE INDEX idx_cep_search_events_searched_at ON public.cep_search_events(searched_at);
CREATE INDEX idx_school_view_events_school_id ON public.school_view_events(school_id);
CREATE INDEX idx_school_view_events_viewed_at ON public.school_view_events(viewed_at);
CREATE INDEX idx_list_view_events_list_id ON public.list_view_events(list_id);
CREATE INDEX idx_list_view_events_school_id ON public.list_view_events(school_id);
CREATE INDEX idx_list_view_events_grade_id ON public.list_view_events(grade_id);
CREATE INDEX idx_list_view_events_viewed_at ON public.list_view_events(viewed_at);