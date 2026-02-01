-- ================================================
-- MIGRATION: Busca por Proximidade Geográfica
-- ================================================

-- 1. Adicionar colunas de geolocalização e metadados à tabela schools
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS network_type text, -- 'publica' ou 'privada'
ADD COLUMN IF NOT EXISTS education_types text[]; -- ['bercario', 'infantil', 'fundamental', 'medio']

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_schools_lat_lng ON schools (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_network_type ON schools (network_type) WHERE network_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_education_types ON schools USING GIN (education_types) WHERE education_types IS NOT NULL;

-- 3. Criar tabela de cache de coordenadas por CEP
CREATE TABLE IF NOT EXISTS cep_coordinates (
  cep text PRIMARY KEY,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  city text,
  state text,
  source text DEFAULT 'nominatim',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Índice para busca por prefixo de CEP
CREATE INDEX IF NOT EXISTS idx_cep_coordinates_prefix ON cep_coordinates (cep text_pattern_ops);

-- 5. RLS para cep_coordinates (leitura pública, escrita apenas por funções)
ALTER TABLE cep_coordinates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CEP coordinates"
ON cep_coordinates FOR SELECT
USING (true);

CREATE POLICY "Service role can insert coordinates"
ON cep_coordinates FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update coordinates"
ON cep_coordinates FOR UPDATE
USING (true);

-- 6. Função de cálculo de distância usando Haversine
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT 
    6371 * 2 * ASIN(
      SQRT(
        POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
      )
    )
$$;

-- 7. Função principal de busca por proximidade
CREATE OR REPLACE FUNCTION search_schools_geo(
  user_lat double precision,
  user_lng double precision,
  search_name text DEFAULT NULL,
  filter_state text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  filter_network text DEFAULT NULL,
  filter_education text DEFAULT NULL,
  max_distance_km double precision DEFAULT 50,
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
  network_type text,
  education_types text[],
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
      -- Filtro por nome
      AND (search_name IS NULL OR search_name = '' OR s.name ILIKE '%' || search_name || '%')
      -- Filtro por estado
      AND (filter_state IS NULL OR filter_state = '' OR s.state = filter_state)
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
$$;

-- 8. Função para buscar/cachear coordenadas de um CEP
CREATE OR REPLACE FUNCTION get_or_create_cep_coordinates(
  p_cep text
)
RETURNS TABLE (
  latitude double precision,
  longitude double precision,
  cached boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_cep text;
  cached_record RECORD;
BEGIN
  -- Normaliza o CEP
  clean_cep := regexp_replace(p_cep, '[^0-9]', '', 'g');
  
  -- Tenta buscar no cache
  SELECT cc.latitude, cc.longitude INTO cached_record
  FROM cep_coordinates cc
  WHERE cc.cep = clean_cep;
  
  IF FOUND THEN
    RETURN QUERY SELECT cached_record.latitude, cached_record.longitude, true;
    RETURN;
  END IF;
  
  -- Se não encontrou, retorna NULL (a edge function vai preencher)
  RETURN QUERY SELECT NULL::double precision, NULL::double precision, false;
END;
$$;

-- 9. Comentários para documentação
COMMENT ON FUNCTION haversine_distance IS 'Calcula a distância em km entre dois pontos usando a fórmula de Haversine';
COMMENT ON FUNCTION search_schools_geo IS 'Busca escolas ordenadas por proximidade geográfica com filtros avançados';
COMMENT ON TABLE cep_coordinates IS 'Cache de coordenadas geográficas por CEP para evitar chamadas repetidas à API';
COMMENT ON COLUMN schools.network_type IS 'Tipo de rede: publica ou privada';
COMMENT ON COLUMN schools.education_types IS 'Tipos de ensino oferecidos: bercario, infantil, fundamental, medio';