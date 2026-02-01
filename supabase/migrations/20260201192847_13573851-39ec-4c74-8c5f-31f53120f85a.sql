-- Create a cache table for popular schools (lightweight, pre-computed)
CREATE TABLE IF NOT EXISTS public.popular_schools_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  slug text NOT NULL,
  city text,
  state text,
  total_views bigint DEFAULT 0,
  total_list_views bigint DEFAULT 0,
  rank_position integer NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_popular_schools_cache_rank ON popular_schools_cache(rank_position);

-- Enable RLS
ALTER TABLE public.popular_schools_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can view cached popular schools
CREATE POLICY "Anyone can view popular schools cache"
ON public.popular_schools_cache FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage popular schools cache"
ON public.popular_schools_cache FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a cache table for popular lists
CREATE TABLE IF NOT EXISTS public.popular_lists_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES material_lists(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  school_slug text NOT NULL,
  grade_id uuid NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  grade_name text NOT NULL,
  total_views bigint DEFAULT 0,
  rank_position integer NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_popular_lists_cache_rank ON popular_lists_cache(rank_position);

-- Enable RLS
ALTER TABLE public.popular_lists_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can view cached popular lists
CREATE POLICY "Anyone can view popular lists cache"
ON public.popular_lists_cache FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage popular lists cache"
ON public.popular_lists_cache FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to refresh popular schools cache
CREATE OR REPLACE FUNCTION public.refresh_popular_schools_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM popular_schools_cache;
  
  -- Insert top 10 schools based on view events (fast query)
  INSERT INTO popular_schools_cache (school_id, school_name, slug, city, state, total_views, total_list_views, rank_position)
  SELECT 
    s.id,
    s.name,
    s.slug,
    s.city,
    s.state,
    COALESCE(sv.view_count, 0) as total_views,
    COALESCE(lv.view_count, 0) as total_list_views,
    ROW_NUMBER() OVER (ORDER BY COALESCE(sv.view_count, 0) + COALESCE(lv.view_count, 0) DESC) as rank_position
  FROM schools s
  LEFT JOIN (
    SELECT school_id, COUNT(*) as view_count
    FROM school_view_events
    GROUP BY school_id
  ) sv ON sv.school_id = s.id
  LEFT JOIN (
    SELECT school_id, COUNT(*) as view_count
    FROM list_view_events
    GROUP BY school_id
  ) lv ON lv.school_id = s.id
  WHERE s.is_active = true
    AND (COALESCE(sv.view_count, 0) + COALESCE(lv.view_count, 0)) > 0
  ORDER BY (COALESCE(sv.view_count, 0) + COALESCE(lv.view_count, 0)) DESC
  LIMIT 10;
  
  -- If no events exist, insert random active schools
  IF NOT EXISTS (SELECT 1 FROM popular_schools_cache) THEN
    INSERT INTO popular_schools_cache (school_id, school_name, slug, city, state, total_views, total_list_views, rank_position)
    SELECT 
      s.id,
      s.name,
      s.slug,
      s.city,
      s.state,
      0,
      0,
      ROW_NUMBER() OVER (ORDER BY s.name)
    FROM schools s
    WHERE s.is_active = true
    ORDER BY RANDOM()
    LIMIT 6;
  END IF;
  
  -- Update timestamp
  UPDATE popular_schools_cache SET updated_at = now();
END;
$$;

-- Create function to refresh popular lists cache
CREATE OR REPLACE FUNCTION public.refresh_popular_lists_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM popular_lists_cache;
  
  -- Insert top lists based on view events
  INSERT INTO popular_lists_cache (list_id, school_id, school_name, school_slug, grade_id, grade_name, total_views, rank_position)
  SELECT 
    lve.list_id,
    s.id as school_id,
    s.name as school_name,
    s.slug as school_slug,
    g.id as grade_id,
    g.name as grade_name,
    COUNT(*) as total_views,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position
  FROM list_view_events lve
  JOIN material_lists ml ON ml.id = lve.list_id AND ml.is_active = true
  JOIN schools s ON s.id = ml.school_id AND s.is_active = true
  JOIN grades g ON g.id = ml.grade_id
  GROUP BY lve.list_id, s.id, s.name, s.slug, g.id, g.name
  ORDER BY COUNT(*) DESC
  LIMIT 10;
  
  -- Update timestamp
  UPDATE popular_lists_cache SET updated_at = now();
END;
$$;

-- Create a combined function to refresh both caches
CREATE OR REPLACE FUNCTION public.refresh_popular_content_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_popular_schools_cache();
  PERFORM refresh_popular_lists_cache();
END;
$$;

-- Initial population of caches
SELECT refresh_popular_content_cache();