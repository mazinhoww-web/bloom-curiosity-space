-- =====================================================
-- FIX: Busca por CEP com filtro geográfico hierárquico
-- =====================================================
-- PROBLEMA ANTERIOR:
-- A função search_schools_geo usava apenas distância geométrica
-- sem verificar se as escolas estavam no mesmo estado/região.
-- Isso fazia CEP de MT retornar escolas do RJ.
--
-- SOLUÇÃO:
-- Nova função que implementa hierarquia de proximidade:
-- 1. CEP exato
-- 2. CEP com mesmo prefixo de 5 dígitos (mesma região)
-- 3. CEP com mesmo prefixo de 4 dígitos (mesma sub-região)
-- 4. Mesma cidade
-- 5. Mesmo estado
-- 6. Nunca retorna escolas de outro estado se houver no mesmo
-- =====================================================

-- Função auxiliar para extrair estado do CEP (baseado na faixa)
CREATE OR REPLACE FUNCTION public.get_state_from_cep(cep text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  clean_cep text;
  prefix int;
BEGIN
  clean_cep := regexp_replace(cep, '[^0-9]', '', 'g');
  
  IF length(clean_cep) < 1 THEN
    RETURN NULL;
  END IF;
  
  prefix := substring(clean_cep, 1, 1)::int;
  
  -- Faixas de CEP por região (primeiro dígito)
  -- 0xxxx, 1xxxx = SP
  -- 2xxxx = RJ, ES
  -- 3xxxx = MG
  -- 4xxxx = BA, SE
  -- 5xxxx = PE, AL, PB, RN
  -- 6xxxx = CE, PI, MA, PA, AP, AM, RR, AC
  -- 7xxxx = DF, GO, TO, MT, MS, RO
  -- 8xxxx = PR, SC
  -- 9xxxx = RS
  
  CASE prefix
    WHEN 0, 1 THEN RETURN 'SP';
    WHEN 2 THEN RETURN CASE WHEN substring(clean_cep, 1, 2)::int >= 29 THEN 'ES' ELSE 'RJ' END;
    WHEN 3 THEN RETURN 'MG';
    WHEN 4 THEN RETURN CASE WHEN substring(clean_cep, 1, 2)::int >= 49 THEN 'SE' ELSE 'BA' END;
    WHEN 5 THEN RETURN 'PE'; -- Simplificado
    WHEN 6 THEN RETURN 'CE'; -- Simplificado
    WHEN 7 THEN 
      CASE substring(clean_cep, 1, 2)::int
        WHEN 70, 71, 72, 73 THEN RETURN 'DF';
        WHEN 74, 75, 76 THEN RETURN 'GO';
        WHEN 77 THEN RETURN 'TO';
        WHEN 78 THEN RETURN 'MT';
        WHEN 79 THEN RETURN 'MS';
        ELSE RETURN 'GO';
      END CASE;
    WHEN 8 THEN RETURN CASE WHEN substring(clean_cep, 1, 2)::int >= 88 THEN 'SC' ELSE 'PR' END;
    WHEN 9 THEN RETURN 'RS';
    ELSE RETURN NULL;
  END CASE;
END;
$function$;

-- Nova função de busca com hierarquia de proximidade por CEP
CREATE OR REPLACE FUNCTION public.search_schools_by_cep_hierarchy(
  user_cep text,
  user_city text DEFAULT NULL,
  user_state text DEFAULT NULL,
  filter_network text DEFAULT NULL,
  filter_education text DEFAULT NULL,
  page_number integer DEFAULT 0,
  page_size integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  cep text,
  address text,
  city text,
  state text,
  logo_url text,
  network_type text,
  education_types text[],
  proximity_rank integer,
  proximity_label text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  clean_cep text;
  cep_prefix5 text;
  cep_prefix4 text;
  cep_prefix3 text;
  search_city text;
  search_state text;
BEGIN
  -- Normalizar CEP (remover caracteres não numéricos)
  clean_cep := regexp_replace(COALESCE(user_cep, ''), '[^0-9]', '', 'g');
  
  -- Validar CEP
  IF length(clean_cep) < 5 THEN
    RAISE EXCEPTION 'CEP deve ter pelo menos 5 dígitos';
  END IF;
  
  -- Extrair prefixos
  cep_prefix5 := substring(clean_cep, 1, 5);
  cep_prefix4 := substring(clean_cep, 1, 4);
  cep_prefix3 := substring(clean_cep, 1, 3);
  
  -- Usar cidade/estado passados ou tentar inferir do cache
  search_city := user_city;
  search_state := user_state;
  
  -- Se não temos estado, tentar buscar do cache de coordenadas
  IF search_state IS NULL THEN
    SELECT cc.state, cc.city INTO search_state, search_city
    FROM cep_coordinates cc
    WHERE cc.cep = clean_cep
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  WITH ranked_schools AS (
    SELECT 
      s.id, s.name, s.slug, s.cep, s.address, 
      s.city, s.state, s.logo_url, s.network_type, s.education_types,
      CASE 
        WHEN s.cep = clean_cep THEN 1                                    -- CEP exato
        WHEN s.cep LIKE cep_prefix5 || '%' THEN 2                        -- Mesmo prefixo 5
        WHEN s.cep LIKE cep_prefix4 || '%' THEN 3                        -- Mesmo prefixo 4
        WHEN s.cep LIKE cep_prefix3 || '%' THEN 4                        -- Mesmo prefixo 3
        WHEN search_city IS NOT NULL AND s.city = search_city THEN 5     -- Mesma cidade
        WHEN search_state IS NOT NULL AND s.state = search_state THEN 6  -- Mesmo estado
        ELSE 99                                                           -- Outros (não deve retornar)
      END as prox_rank,
      CASE 
        WHEN s.cep = clean_cep THEN 'CEP exato'
        WHEN s.cep LIKE cep_prefix5 || '%' THEN 'Região próxima'
        WHEN s.cep LIKE cep_prefix4 || '%' THEN 'Área próxima'
        WHEN s.cep LIKE cep_prefix3 || '%' THEN 'Sub-região'
        WHEN search_city IS NOT NULL AND s.city = search_city THEN 'Mesma cidade'
        WHEN search_state IS NOT NULL AND s.state = search_state THEN 'Mesmo estado'
        ELSE 'Distante'
      END as prox_label
    FROM schools s
    WHERE s.is_active = true
      -- REGRA CRÍTICA: Só retorna escolas do mesmo estado ou região do CEP
      AND (
        s.cep LIKE cep_prefix3 || '%'                                    -- Mesma região de CEP
        OR (search_city IS NOT NULL AND s.city = search_city)            -- Mesma cidade
        OR (search_state IS NOT NULL AND s.state = search_state)         -- Mesmo estado
      )
      -- Filtros opcionais
      AND (filter_network IS NULL OR filter_network = '' OR s.network_type = filter_network)
      AND (filter_education IS NULL OR filter_education = '' OR filter_education = ANY(s.education_types))
  ),
  paginated AS (
    SELECT 
      rs.*,
      COUNT(*) OVER() as total
    FROM ranked_schools rs
    ORDER BY rs.prox_rank ASC, rs.name ASC
    LIMIT LEAST(page_size, 100)
    OFFSET page_number * page_size
  )
  SELECT 
    p.id, p.name, p.slug, p.cep, p.address,
    p.city, p.state, p.logo_url, p.network_type, p.education_types,
    p.prox_rank as proximity_rank,
    p.prox_label as proximity_label,
    p.total as total_count
  FROM paginated p;
END;
$function$;

-- Atualizar a função search_schools para incluir filtro por estado
CREATE OR REPLACE FUNCTION public.search_schools(
  search_cep text DEFAULT NULL,
  search_name text DEFAULT NULL,
  filter_state text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  page_number integer DEFAULT 0,
  page_size integer DEFAULT 50
)
RETURNS TABLE(
  id uuid, 
  name text, 
  slug text, 
  cep text, 
  address text, 
  city text, 
  state text, 
  logo_url text, 
  is_active boolean, 
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  clean_cep text;
  cep_prefix5 text;
  cep_prefix4 text;
  cep_prefix3 text;
BEGIN
  clean_cep := normalize_cep(search_cep);
  cep_prefix5 := substring(clean_cep, 1, 5);
  cep_prefix4 := substring(clean_cep, 1, 4);
  cep_prefix3 := substring(clean_cep, 1, 3);
  
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      s.id, s.name, s.slug, s.cep, s.address, 
      s.city, s.state, s.logo_url, s.is_active,
      CASE 
        WHEN s.cep = clean_cep THEN 1
        WHEN s.cep LIKE cep_prefix5 || '%' THEN 2
        WHEN s.cep LIKE cep_prefix4 || '%' THEN 3
        WHEN s.cep LIKE cep_prefix3 || '%' THEN 4
        ELSE 5
      END as prox_rank,
      COUNT(*) OVER() as total
    FROM schools s
    WHERE s.is_active = true
      -- Filtro por CEP com hierarquia
      AND (clean_cep = '' OR s.cep LIKE cep_prefix3 || '%')
      -- Filtro por nome
      AND (search_name IS NULL OR search_name = '' OR s.name ILIKE '%' || search_name || '%')
      -- Filtro por estado
      AND (filter_state IS NULL OR filter_state = '' OR s.state = filter_state)
      -- Filtro por cidade
      AND (filter_city IS NULL OR filter_city = '' OR s.city = filter_city)
    ORDER BY 
      prox_rank ASC,
      s.name ASC
    LIMIT LEAST(page_size, 100)
    OFFSET page_number * page_size
  )
  SELECT 
    f.id, f.name, f.slug, f.cep, f.address, 
    f.city, f.state, f.logo_url, f.is_active, 
    f.total
  FROM filtered f;
END;
$function$;

-- Atualizar search_schools_geo para filtrar por estado quando disponível
CREATE OR REPLACE FUNCTION public.search_schools_geo(
  user_lat double precision,
  user_lng double precision,
  search_name text DEFAULT NULL,
  filter_state text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  filter_network text DEFAULT NULL,
  filter_education text DEFAULT NULL,
  max_distance_km double precision DEFAULT 50,
  page_number integer DEFAULT 0,
  page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  cep text,
  address text,
  city text,
  state text,
  logo_url text,
  network_type text,
  education_types text[],
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_state_from_coords text;
BEGIN
  -- Tentar identificar o estado baseado nas coordenadas do cache
  SELECT cc.state INTO user_state_from_coords
  FROM cep_coordinates cc
  WHERE cc.latitude IS NOT NULL 
    AND cc.longitude IS NOT NULL
    AND haversine_distance(user_lat, user_lng, cc.latitude, cc.longitude) < 50
  ORDER BY haversine_distance(user_lat, user_lng, cc.latitude, cc.longitude)
  LIMIT 1;
  
  RETURN QUERY
  WITH schools_with_distance AS (
    SELECT 
      s.id, s.name, s.slug, s.cep, s.address, 
      s.city, s.state, s.logo_url, s.network_type, s.education_types,
      s.latitude, s.longitude,
      CASE 
        WHEN s.latitude IS NOT NULL AND s.longitude IS NOT NULL 
        THEN haversine_distance(user_lat, user_lng, s.latitude, s.longitude)
        ELSE NULL
      END as dist_km
    FROM schools s
    WHERE s.is_active = true
      -- CRÍTICO: Priorizar mesmo estado se identificado
      AND (
        filter_state IS NOT NULL AND filter_state != '' AND s.state = filter_state
        OR filter_state IS NULL AND user_state_from_coords IS NOT NULL AND s.state = user_state_from_coords
        OR (filter_state IS NULL AND user_state_from_coords IS NULL)
      )
      -- Filtro por nome
      AND (search_name IS NULL OR search_name = '' OR s.name ILIKE '%' || search_name || '%')
      -- Filtro por cidade
      AND (filter_city IS NULL OR filter_city = '' OR s.city = filter_city)
      -- Filtro por rede
      AND (filter_network IS NULL OR filter_network = '' OR s.network_type = filter_network)
      -- Filtro por tipo de ensino
      AND (filter_education IS NULL OR filter_education = '' OR filter_education = ANY(s.education_types))
  ),
  filtered AS (
    SELECT 
      swd.*,
      COUNT(*) OVER() as total
    FROM schools_with_distance swd
    WHERE swd.dist_km IS NULL OR swd.dist_km <= max_distance_km
    ORDER BY 
      CASE WHEN swd.dist_km IS NOT NULL THEN swd.dist_km ELSE 9999999 END ASC,
      swd.name ASC
    LIMIT LEAST(page_size, 50)
    OFFSET page_number * page_size
  )
  SELECT 
    f.id, f.name, f.slug, f.cep, f.address,
    f.city, f.state, f.logo_url, f.network_type, f.education_types,
    f.latitude, f.longitude, 
    ROUND(f.dist_km::numeric, 2)::double precision as distance_km,
    f.total as total_count
  FROM filtered f;
END;
$function$;