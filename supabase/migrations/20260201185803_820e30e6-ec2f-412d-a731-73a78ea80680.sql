-- RLS policy for user_roles - users can see their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own roles' AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can manage all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all roles' AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Admins can manage all roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Update material_lists RLS to allow school admins to manage their school's lists
DROP POLICY IF EXISTS "School admins can manage their school lists" ON public.material_lists;
CREATE POLICY "School admins can manage their school lists"
ON public.material_lists
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.is_school_admin(auth.uid(), school_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.is_school_admin(auth.uid(), school_id)
);

-- Update material_items RLS for school admins
DROP POLICY IF EXISTS "School admins can manage their school items" ON public.material_items;
CREATE POLICY "School admins can manage their school items"
ON public.material_items
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM public.material_lists ml
    WHERE ml.id = list_id
    AND public.is_school_admin(auth.uid(), ml.school_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM public.material_lists ml
    WHERE ml.id = list_id
    AND public.is_school_admin(auth.uid(), ml.school_id)
  )
);