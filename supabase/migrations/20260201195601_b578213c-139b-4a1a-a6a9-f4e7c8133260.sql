-- Recreate refresh functions with explicit WHERE clause to avoid RLS issues
CREATE OR REPLACE FUNCTION public.refresh_popular_schools_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear existing cache with explicit WHERE
  DELETE FROM popular_schools_cache WHERE id IS NOT NULL;
  
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
  IF NOT EXISTS (SELECT 1 FROM popular_schools_cache LIMIT 1) THEN
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
  UPDATE popular_schools_cache SET updated_at = now() WHERE id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_popular_lists_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear existing cache with explicit WHERE
  DELETE FROM popular_lists_cache WHERE id IS NOT NULL;
  
  -- Insert top lists based on view events
  INSERT INTO popular_lists_cache (list_id, school_id, school_name, school_slug, grade_id, grade_name, total_views, rank_position)
  SELECT 
    ml.id,
    s.id,
    s.name,
    s.slug,
    g.id,
    g.name,
    COALESCE(lv.view_count, 0) as total_views,
    ROW_NUMBER() OVER (ORDER BY COALESCE(lv.view_count, 0) DESC) as rank_position
  FROM material_lists ml
  INNER JOIN schools s ON s.id = ml.school_id
  INNER JOIN grades g ON g.id = ml.grade_id
  LEFT JOIN (
    SELECT list_id, COUNT(*) as view_count
    FROM list_view_events
    GROUP BY list_id
  ) lv ON lv.list_id = ml.id
  WHERE ml.is_active = true
    AND s.is_active = true
    AND COALESCE(lv.view_count, 0) > 0
  ORDER BY COALESCE(lv.view_count, 0) DESC
  LIMIT 10;
  
  -- Update timestamp
  UPDATE popular_lists_cache SET updated_at = now() WHERE id IS NOT NULL;
END;
$$;