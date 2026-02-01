-- Fix views to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures RLS policies from underlying tables are respected

-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.analytics_top_schools;
DROP VIEW IF EXISTS public.analytics_top_grades;
DROP VIEW IF EXISTS public.analytics_top_items;
DROP VIEW IF EXISTS public.analytics_store_conversion;
DROP VIEW IF EXISTS public.analytics_demand_by_region;
DROP VIEW IF EXISTS public.analytics_upload_funnel;
DROP VIEW IF EXISTS public.analytics_daily_summary;

-- Recreate views with SECURITY INVOKER
CREATE VIEW public.analytics_top_schools
WITH (security_invoker = true)
AS
SELECT 
  s.id AS school_id,
  s.name AS school_name,
  s.city,
  s.state,
  s.cep,
  COUNT(DISTINCT sv.id) AS total_views,
  COUNT(DISTINCT lv.id) AS total_list_views,
  COUNT(DISTINCT sc.id) AS total_store_clicks,
  COUNT(DISTINCT sv.session_id) AS unique_sessions,
  COUNT(DISTINCT lv.session_id) AS unique_list_sessions,
  (COUNT(DISTINCT sv.id) * 1 + COUNT(DISTINCT lv.id) * 3 + COUNT(DISTINCT sc.id) * 5) AS engagement_score
FROM schools s
LEFT JOIN school_view_events sv ON sv.school_id = s.id
LEFT JOIN list_view_events lv ON lv.school_id = s.id
LEFT JOIN store_click_events sc ON sc.school_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.city, s.state, s.cep
ORDER BY engagement_score DESC;

CREATE VIEW public.analytics_top_grades
WITH (security_invoker = true)
AS
SELECT 
  g.id AS grade_id,
  g.name AS grade_name,
  g.order_index,
  COUNT(DISTINCT lv.id) AS total_list_views,
  COUNT(DISTINCT lv.school_id) AS schools_with_lists,
  COUNT(DISTINCT lv.session_id) AS unique_sessions,
  COUNT(DISTINCT sc.id) AS total_store_clicks
FROM grades g
LEFT JOIN list_view_events lv ON lv.grade_id = g.id
LEFT JOIN store_click_events sc ON sc.list_id IN (
  SELECT ml.id FROM material_lists ml WHERE ml.grade_id = g.id
)
GROUP BY g.id, g.name, g.order_index
ORDER BY total_list_views DESC;

CREATE VIEW public.analytics_top_items
WITH (security_invoker = true)
AS
SELECT 
  mi.id AS item_id,
  mi.name AS item_name,
  mc.name AS category_name,
  COUNT(DISTINCT sc.id) AS total_clicks,
  COUNT(DISTINCT sc.session_id) AS unique_sessions,
  COUNT(DISTINCT sc.school_id) AS schools_clicked
FROM material_items mi
LEFT JOIN store_click_events sc ON sc.item_id = mi.id
LEFT JOIN material_categories mc ON mc.id = mi.category_id
WHERE sc.id IS NOT NULL
GROUP BY mi.id, mi.name, mc.name
ORDER BY total_clicks DESC;

CREATE VIEW public.analytics_store_conversion
WITH (security_invoker = true)
AS
SELECT 
  ps.id AS store_id,
  ps.name AS store_name,
  ps.logo_url,
  COUNT(DISTINCT sc.id) AS total_clicks,
  COUNT(DISTINCT sc.session_id) AS unique_sessions,
  COUNT(DISTINCT sc.school_id) AS schools_clicked,
  COUNT(DISTINCT sc.list_id) AS lists_clicked,
  COUNT(DISTINCT CASE WHEN sc.item_id IS NOT NULL THEN sc.id END) AS item_clicks,
  COUNT(DISTINCT CASE WHEN sc.item_id IS NULL THEN sc.id END) AS cart_clicks
FROM partner_stores ps
LEFT JOIN store_click_events sc ON sc.store_id = ps.id
WHERE ps.is_active = true
GROUP BY ps.id, ps.name, ps.logo_url
ORDER BY total_clicks DESC;

CREATE VIEW public.analytics_demand_by_region
WITH (security_invoker = true)
AS
SELECT 
  s.state,
  s.city,
  SUBSTRING(s.cep FROM 1 FOR 5) AS cep_prefix,
  COUNT(DISTINCT s.id) AS total_schools,
  COUNT(DISTINCT sv.id) AS total_school_views,
  COUNT(DISTINCT lv.id) AS total_list_views,
  COUNT(DISTINCT sc.id) AS total_store_clicks,
  COUNT(DISTINCT sv.session_id) AS unique_sessions
FROM schools s
LEFT JOIN school_view_events sv ON sv.school_id = s.id
LEFT JOIN list_view_events lv ON lv.school_id = s.id
LEFT JOIN store_click_events sc ON sc.school_id = s.id
WHERE s.is_active = true
GROUP BY s.state, s.city, SUBSTRING(s.cep FROM 1 FOR 5)
HAVING COUNT(DISTINCT sv.id) > 0 OR COUNT(DISTINCT lv.id) > 0
ORDER BY total_store_clicks DESC, total_list_views DESC;

CREATE VIEW public.analytics_upload_funnel
WITH (security_invoker = true)
AS
SELECT 
  DATE_TRUNC('day', ue.created_at) AS date,
  ue.event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ue.session_id) AS unique_sessions
FROM upload_events ue
GROUP BY DATE_TRUNC('day', ue.created_at), ue.event_type
ORDER BY date DESC, event_type;

CREATE VIEW public.analytics_daily_summary
WITH (security_invoker = true)
AS
SELECT 
  DATE_TRUNC('day', event_date) AS date,
  SUM(school_views) AS school_views,
  SUM(list_views) AS list_views,
  SUM(store_clicks) AS store_clicks,
  SUM(cep_searches) AS cep_searches,
  SUM(shares) AS shares
FROM (
  SELECT viewed_at AS event_date, 1 AS school_views, 0 AS list_views, 0 AS store_clicks, 0 AS cep_searches, 0 AS shares 
  FROM school_view_events
  UNION ALL
  SELECT viewed_at, 0, 1, 0, 0, 0 
  FROM list_view_events
  UNION ALL
  SELECT clicked_at, 0, 0, 1, 0, 0 
  FROM store_click_events
  UNION ALL
  SELECT searched_at, 0, 0, 0, 1, 0 
  FROM cep_search_events
  UNION ALL
  SELECT shared_at, 0, 0, 0, 0, 1 
  FROM share_events
) events
GROUP BY DATE_TRUNC('day', event_date)
ORDER BY date DESC;

COMMENT ON VIEW public.analytics_top_schools IS 'Top schools by engagement - admins only';
COMMENT ON VIEW public.analytics_top_grades IS 'Top grades by volume - admins only';
COMMENT ON VIEW public.analytics_top_items IS 'Most clicked items - admins only';
COMMENT ON VIEW public.analytics_store_conversion IS 'Store conversion metrics - admins only';
COMMENT ON VIEW public.analytics_demand_by_region IS 'Regional demand - admins only';
COMMENT ON VIEW public.analytics_upload_funnel IS 'Upload funnel - admins only';
COMMENT ON VIEW public.analytics_daily_summary IS 'Daily summary - admins only';