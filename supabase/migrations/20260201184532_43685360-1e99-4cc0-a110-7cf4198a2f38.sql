-- Create view for popular CEPs based on search events
CREATE OR REPLACE VIEW popular_ceps AS
SELECT 
  cep,
  COUNT(*) as search_count,
  MAX(searched_at) as last_searched
FROM cep_search_events
WHERE LENGTH(cep) >= 5
GROUP BY cep
ORDER BY search_count DESC, last_searched DESC;

-- Create function to get CEP suggestions based on prefix
CREATE OR REPLACE FUNCTION get_cep_suggestions(
  cep_prefix text,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  cep text,
  city text,
  state text,
  school_count bigint,
  search_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_prefix text;
BEGIN
  -- Normalize the input prefix
  clean_prefix := regexp_replace(COALESCE(cep_prefix, ''), '[^0-9]', '', 'g');
  
  -- Return empty if prefix too short
  IF LENGTH(clean_prefix) < 2 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH cep_stats AS (
    -- Get distinct CEPs from schools with their city/state
    SELECT DISTINCT ON (s.cep)
      s.cep,
      s.city,
      s.state
    FROM schools s
    WHERE s.is_active = true
      AND s.cep LIKE clean_prefix || '%'
    ORDER BY s.cep
  ),
  school_counts AS (
    -- Count schools per CEP
    SELECT 
      s.cep,
      COUNT(*) as cnt
    FROM schools s
    WHERE s.is_active = true
      AND s.cep LIKE clean_prefix || '%'
    GROUP BY s.cep
  ),
  search_stats AS (
    -- Get search counts for CEPs
    SELECT 
      e.cep,
      COUNT(*) as cnt
    FROM cep_search_events e
    WHERE e.cep LIKE clean_prefix || '%'
    GROUP BY e.cep
  )
  SELECT 
    cs.cep,
    cs.city,
    cs.state,
    COALESCE(sc.cnt, 0) as school_count,
    COALESCE(ss.cnt, 0) as search_count
  FROM cep_stats cs
  LEFT JOIN school_counts sc ON sc.cep = cs.cep
  LEFT JOIN search_stats ss ON ss.cep = cs.cep
  ORDER BY 
    COALESCE(ss.cnt, 0) DESC,  -- Most searched first
    COALESCE(sc.cnt, 0) DESC,  -- Then most schools
    cs.cep ASC                  -- Then by CEP
  LIMIT max_results;
END;
$$;

-- Create enhanced search function with proximity scoring
CREATE OR REPLACE FUNCTION search_schools_by_proximity(
  user_cep text,
  page_number int DEFAULT 0,
  page_size int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  cep text,
  address text,
  city text,
  state text,
  logo_url text,
  is_active boolean,
  proximity_score int,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_cep text;
  cep_5 text;
  cep_4 text;
  user_city text;
  user_state text;
BEGIN
  -- Normalize the input CEP
  clean_cep := regexp_replace(COALESCE(user_cep, ''), '[^0-9]', '', 'g');
  
  -- Return empty if CEP too short
  IF LENGTH(clean_cep) < 5 THEN
    RETURN;
  END IF;
  
  -- Extract prefixes for matching
  cep_5 := SUBSTRING(clean_cep FROM 1 FOR 5);
  cep_4 := SUBSTRING(clean_cep FROM 1 FOR 4);
  
  -- Get city/state from a school with matching CEP prefix
  SELECT s.city, s.state INTO user_city, user_state
  FROM schools s
  WHERE s.cep LIKE cep_5 || '%'
    AND s.is_active = true
  LIMIT 1;
  
  RETURN QUERY
  WITH scored_schools AS (
    SELECT 
      s.id, s.name, s.slug, s.cep, s.address, 
      s.city, s.state, s.logo_url, s.is_active,
      CASE 
        WHEN s.cep = clean_cep THEN 100
        WHEN s.cep LIKE cep_5 || '%' THEN 80
        WHEN s.cep LIKE cep_4 || '%' THEN 60
        WHEN user_city IS NOT NULL AND s.city = user_city THEN 40
        WHEN user_state IS NOT NULL AND s.state = user_state THEN 20
        ELSE 0
      END as score,
      COUNT(*) OVER() as total
    FROM schools s
    WHERE s.is_active = true
      AND (
        s.cep LIKE cep_4 || '%'
        OR (user_city IS NOT NULL AND s.city = user_city)
        OR (user_state IS NOT NULL AND s.state = user_state)
      )
  )
  SELECT 
    ss.id, ss.name, ss.slug, ss.cep, ss.address,
    ss.city, ss.state, ss.logo_url, ss.is_active,
    ss.score as proximity_score,
    ss.total as total_count
  FROM scored_schools ss
  ORDER BY ss.score DESC, ss.name ASC
  LIMIT LEAST(page_size, 50)  -- Never more than 50
  OFFSET page_number * page_size;
END;
$$;