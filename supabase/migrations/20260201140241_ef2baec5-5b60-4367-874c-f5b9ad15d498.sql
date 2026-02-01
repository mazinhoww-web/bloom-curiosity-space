-- Create enum for list status
CREATE TYPE public.list_status AS ENUM ('draft', 'published', 'flagged', 'official');

-- Add status column to material_lists
ALTER TABLE public.material_lists 
ADD COLUMN status public.list_status NOT NULL DEFAULT 'draft';

-- Add promotion tracking columns
ALTER TABLE public.material_lists 
ADD COLUMN promoted_by uuid REFERENCES auth.users(id),
ADD COLUMN promoted_at timestamp with time zone;

-- Create status history table
CREATE TABLE public.list_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  previous_status public.list_status,
  new_status public.list_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on status history
ALTER TABLE public.list_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for status history
CREATE POLICY "Admins can manage status history"
ON public.list_status_history FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "School admins can view their school status history"
ON public.list_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM material_lists ml
    WHERE ml.id = list_status_history.list_id
    AND is_school_admin(auth.uid(), ml.school_id)
  )
);

CREATE POLICY "Anyone can view status history for published lists"
ON public.list_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM material_lists ml
    WHERE ml.id = list_status_history.list_id
    AND ml.status IN ('published', 'official')
  )
);

-- Create unique partial index for official lists (only one official per school/grade/year)
CREATE UNIQUE INDEX idx_unique_official_list 
ON public.material_lists (school_id, grade_id, year) 
WHERE status = 'official';

-- Create index for status queries
CREATE INDEX idx_material_lists_status ON public.material_lists(status);

-- Create index for status history lookups
CREATE INDEX idx_list_status_history_list_id ON public.list_status_history(list_id);

-- Function to track status changes automatically
CREATE OR REPLACE FUNCTION public.track_list_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.list_status_history (
      list_id,
      previous_status,
      new_status,
      changed_by,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'promoted_by', NEW.promoted_by,
        'promoted_at', NEW.promoted_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for status tracking
CREATE TRIGGER track_material_list_status_change
AFTER UPDATE ON public.material_lists
FOR EACH ROW
EXECUTE FUNCTION public.track_list_status_change();

-- Update existing active lists to published status
UPDATE public.material_lists 
SET status = 'published' 
WHERE is_active = true AND status = 'draft';

-- Function to promote list to official (ensures only one official per school/grade/year)
CREATE OR REPLACE FUNCTION public.promote_list_to_official(
  _list_id uuid,
  _user_id uuid
)
RETURNS boolean AS $$
DECLARE
  _list_record RECORD;
BEGIN
  -- Get the list details
  SELECT * INTO _list_record FROM material_lists WHERE id = _list_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'List not found';
  END IF;
  
  -- Check if user has permission (admin or school admin)
  IF NOT (has_role(_user_id, 'admin'::app_role) OR is_school_admin(_user_id, _list_record.school_id)) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Demote any existing official list for this school/grade/year
  UPDATE material_lists 
  SET status = 'published', promoted_by = NULL, promoted_at = NULL
  WHERE school_id = _list_record.school_id 
    AND grade_id = _list_record.grade_id 
    AND year = _list_record.year
    AND status = 'official'
    AND id != _list_id;
  
  -- Promote the new list
  UPDATE material_lists 
  SET 
    status = 'official',
    promoted_by = _user_id,
    promoted_at = now()
  WHERE id = _list_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;