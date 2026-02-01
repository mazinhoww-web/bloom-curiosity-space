-- Create function to get distinct states efficiently
CREATE OR REPLACE FUNCTION public.get_distinct_school_states()
RETURNS TABLE(state text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.state
  FROM schools s
  WHERE s.is_active = true AND s.state IS NOT NULL
  ORDER BY s.state;
$$;

-- Create function to get distinct cities for a state efficiently
CREATE OR REPLACE FUNCTION public.get_distinct_school_cities(p_state text)
RETURNS TABLE(city text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.city
  FROM schools s
  WHERE s.is_active = true 
    AND s.state = p_state 
    AND s.city IS NOT NULL
  ORDER BY s.city;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_distinct_school_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_school_cities(text) TO anon, authenticated;