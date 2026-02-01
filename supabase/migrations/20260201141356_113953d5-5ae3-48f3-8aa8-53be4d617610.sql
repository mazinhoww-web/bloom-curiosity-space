
-- Create a view for store recommendation scores
-- Calculates recommendation based on real usage data

CREATE OR REPLACE VIEW public.store_recommendation_scores AS
WITH store_clicks AS (
  -- Aggregate clicks by store, school, and list
  SELECT 
    store_id,
    school_id,
    list_id,
    COUNT(*) FILTER (WHERE item_id IS NULL) as cart_clicks,  -- "Buy all" clicks
    COUNT(*) FILTER (WHERE item_id IS NOT NULL) as item_clicks,  -- Individual item clicks
    COUNT(DISTINCT session_id) as unique_sessions
  FROM store_click_events
  WHERE store_id IS NOT NULL
  GROUP BY store_id, school_id, list_id
),
list_views AS (
  -- Get list view counts for conversion calculation
  SELECT 
    list_id,
    school_id,
    COUNT(*) as views,
    COUNT(DISTINCT session_id) as unique_views
  FROM list_view_events
  GROUP BY list_id, school_id
),
store_scores AS (
  SELECT 
    sc.store_id,
    sc.school_id,
    sc.list_id,
    sc.cart_clicks,
    sc.item_clicks,
    sc.unique_sessions,
    COALESCE(lv.unique_views, 0) as list_views,
    -- Score calculation: cart_clicks * 3 + item_clicks * 1 + conversion_bonus
    -- Weights: cart clicks are 3x more valuable (shows purchase intent)
    (sc.cart_clicks * 3) + 
    (sc.item_clicks * 1) + 
    CASE 
      WHEN COALESCE(lv.unique_views, 0) > 0 
      THEN ROUND((sc.unique_sessions::numeric / lv.unique_views::numeric) * 10, 2)
      ELSE 0 
    END as score
  FROM store_clicks sc
  LEFT JOIN list_views lv ON sc.list_id = lv.list_id AND sc.school_id = lv.school_id
),
-- Global fallback scores (when no school/list specific data)
global_scores AS (
  SELECT 
    store_id,
    SUM(cart_clicks * 3 + item_clicks) as global_score,
    SUM(unique_sessions) as total_sessions
  FROM store_scores
  GROUP BY store_id
)
SELECT 
  ss.store_id,
  ss.school_id,
  ss.list_id,
  ss.cart_clicks,
  ss.item_clicks,
  ss.unique_sessions,
  ss.list_views,
  ss.score as context_score,
  COALESCE(gs.global_score, 0) as global_score,
  -- Final score: prioritize context-specific, fallback to global
  CASE 
    WHEN ss.score > 0 THEN ss.score
    ELSE COALESCE(gs.global_score, 0) / GREATEST(gs.total_sessions, 1)
  END as final_score
FROM store_scores ss
LEFT JOIN global_scores gs ON ss.store_id = gs.store_id;

-- Create a function to get recommended store for a list
CREATE OR REPLACE FUNCTION get_recommended_store(
  _list_id uuid,
  _school_id uuid DEFAULT NULL
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  score numeric,
  reason text,
  cart_clicks bigint,
  item_clicks bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH list_store_scores AS (
    -- First try to get scores specific to this list
    SELECT 
      srs.store_id,
      ps.name as store_name,
      srs.final_score as score,
      srs.cart_clicks,
      srs.item_clicks,
      srs.unique_sessions
    FROM store_recommendation_scores srs
    JOIN partner_stores ps ON ps.id = srs.store_id AND ps.is_active = true
    WHERE srs.list_id = _list_id
      AND (_school_id IS NULL OR srs.school_id = _school_id)
  ),
  school_store_scores AS (
    -- Fallback: scores for the school across all lists
    SELECT 
      srs.store_id,
      ps.name as store_name,
      SUM(srs.final_score) as score,
      SUM(srs.cart_clicks) as cart_clicks,
      SUM(srs.item_clicks) as item_clicks,
      SUM(srs.unique_sessions) as unique_sessions
    FROM store_recommendation_scores srs
    JOIN partner_stores ps ON ps.id = srs.store_id AND ps.is_active = true
    WHERE srs.school_id = _school_id
    GROUP BY srs.store_id, ps.name
  ),
  global_store_scores AS (
    -- Final fallback: global scores across all schools
    SELECT 
      srs.store_id,
      ps.name as store_name,
      SUM(srs.final_score) as score,
      SUM(srs.cart_clicks) as cart_clicks,
      SUM(srs.item_clicks) as item_clicks,
      SUM(srs.unique_sessions) as unique_sessions
    FROM store_recommendation_scores srs
    JOIN partner_stores ps ON ps.id = srs.store_id AND ps.is_active = true
    GROUP BY srs.store_id, ps.name
  ),
  combined_scores AS (
    -- Combine all sources with priority
    SELECT 
      COALESCE(lss.store_id, sss.store_id, gss.store_id) as store_id,
      COALESCE(lss.store_name, sss.store_name, gss.store_name) as store_name,
      COALESCE(lss.score, sss.score, gss.score, 0) as score,
      COALESCE(lss.cart_clicks, sss.cart_clicks, gss.cart_clicks, 0) as cart_clicks,
      COALESCE(lss.item_clicks, sss.item_clicks, gss.item_clicks, 0) as item_clicks,
      CASE 
        WHEN lss.store_id IS NOT NULL THEN 'list'
        WHEN sss.store_id IS NOT NULL THEN 'school'
        ELSE 'global'
      END as source
    FROM list_store_scores lss
    FULL OUTER JOIN school_store_scores sss ON lss.store_id = sss.store_id
    FULL OUTER JOIN global_store_scores gss ON COALESCE(lss.store_id, sss.store_id) = gss.store_id
  )
  SELECT 
    cs.store_id,
    cs.store_name,
    cs.score,
    CASE 
      WHEN cs.source = 'list' AND cs.cart_clicks > 0 
        THEN 'Mais escolhida para esta lista'
      WHEN cs.source = 'school' AND cs.cart_clicks > 0 
        THEN 'Mais escolhida por famílias desta escola'
      WHEN cs.cart_clicks > cs.item_clicks 
        THEN 'Preferida para compra completa'
      WHEN cs.item_clicks > 0 
        THEN 'Popular entre os pais'
      ELSE 'Loja parceira'
    END as reason,
    cs.cart_clicks,
    cs.item_clicks
  FROM combined_scores cs
  ORDER BY cs.score DESC
  LIMIT 1;
END;
$$;

-- Grant access
GRANT SELECT ON store_recommendation_scores TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_recommended_store TO authenticated, anon;
