-- Fix Security Definer View issues by explicitly setting SECURITY INVOKER
-- This ensures RLS policies of the querying user are enforced, not the view creator

-- Recreate ai_provider_stats with SECURITY INVOKER
DROP VIEW IF EXISTS public.ai_provider_stats;
CREATE VIEW public.ai_provider_stats 
WITH (security_invoker = true)
AS
SELECT 
  DATE(created_at) as date,
  function_name,
  provider,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  COUNT(*) FILTER (WHERE fallback_used = true) as fallback_count,
  AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) as avg_response_time_ms
FROM public.ai_provider_metrics
GROUP BY DATE(created_at), function_name, provider
ORDER BY date DESC, total_calls DESC;

-- Recreate popular_ceps with SECURITY INVOKER
DROP VIEW IF EXISTS public.popular_ceps;
CREATE VIEW public.popular_ceps
WITH (security_invoker = true)
AS
SELECT 
  cep,
  COUNT(*) as search_count,
  MAX(searched_at) as last_searched
FROM public.cep_search_events
GROUP BY cep
ORDER BY search_count DESC;

-- Recreate store_recommendation_scores with SECURITY INVOKER
DROP VIEW IF EXISTS public.store_recommendation_scores;
CREATE VIEW public.store_recommendation_scores
WITH (security_invoker = true)
AS
SELECT 
  sc.store_id,
  sc.school_id,
  sc.list_id,
  COUNT(DISTINCT sc.session_id) as unique_sessions,
  COUNT(DISTINCT lv.id) as list_views,
  COUNT(DISTINCT CASE WHEN sc.item_id IS NOT NULL THEN sc.id END) as item_clicks,
  COUNT(DISTINCT CASE WHEN sc.item_id IS NULL THEN sc.id END) as cart_clicks,
  -- Context score (specific to this list/school)
  (COUNT(DISTINCT CASE WHEN sc.item_id IS NULL THEN sc.id END) * 3 + 
   COUNT(DISTINCT CASE WHEN sc.item_id IS NOT NULL THEN sc.id END) * 1) as context_score,
  -- Global score (across all schools)
  (SELECT COUNT(*) FROM store_click_events WHERE store_id = sc.store_id) as global_score,
  -- Final combined score
  (COUNT(DISTINCT CASE WHEN sc.item_id IS NULL THEN sc.id END) * 3 + 
   COUNT(DISTINCT CASE WHEN sc.item_id IS NOT NULL THEN sc.id END) * 1 +
   (SELECT COUNT(*) FROM store_click_events WHERE store_id = sc.store_id) * 0.1) as final_score
FROM store_click_events sc
LEFT JOIN list_view_events lv ON lv.list_id = sc.list_id
GROUP BY sc.store_id, sc.school_id, sc.list_id;