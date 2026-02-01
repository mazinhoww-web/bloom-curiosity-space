-- Create function to check if user is school_admin for a specific school
-- Using plpgsql to handle enum casting properly
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'school_admin'
      AND school_id = _school_id
  );
END;
$$;

-- Create function to get school_id for a school_admin
CREATE OR REPLACE FUNCTION public.get_school_admin_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_school_id uuid;
BEGIN
  SELECT ur.school_id INTO result_school_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role::text = 'school_admin'
  LIMIT 1;
  
  RETURN result_school_id;
END;
$$;

-- RLS: Allow school_admin to manage their own school's lists
CREATE POLICY "School admins can manage their school lists"
ON public.material_lists
FOR ALL
USING (is_school_admin(auth.uid(), school_id))
WITH CHECK (is_school_admin(auth.uid(), school_id));

-- RLS: Allow school_admin to manage items in their school's lists
CREATE POLICY "School admins can manage their school items"
ON public.material_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.material_lists ml
    WHERE ml.id = material_items.list_id
    AND is_school_admin(auth.uid(), ml.school_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.material_lists ml
    WHERE ml.id = material_items.list_id
    AND is_school_admin(auth.uid(), ml.school_id)
  )
);

-- RLS: School admin can view their own school
CREATE POLICY "School admins can view their school"
ON public.schools
FOR SELECT
USING (is_school_admin(auth.uid(), id));

-- RLS: School admin can update their own school
CREATE POLICY "School admins can update their school"
ON public.schools
FOR UPDATE
USING (is_school_admin(auth.uid(), id));