-- 1. Normalizar todos os CEPs existentes (remover hífens)
UPDATE schools 
SET cep = REPLACE(cep, '-', '')
WHERE cep LIKE '%-%';

-- 2. Criar função de normalização de CEP
CREATE OR REPLACE FUNCTION normalize_cep(input_cep text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(COALESCE(input_cep, ''), '[^0-9]', '', 'g');
$$;

-- 3. Criar função de busca otimizada com paginação
CREATE OR REPLACE FUNCTION search_schools(
  search_cep text DEFAULT NULL,
  search_name text DEFAULT NULL,
  filter_state text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  page_number int DEFAULT 0,
  page_size int DEFAULT 50
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
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_cep text;
BEGIN
  clean_cep := normalize_cep(search_cep);
  
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      s.id, s.name, s.slug, s.cep, s.address, 
      s.city, s.state, s.logo_url, s.is_active,
      COUNT(*) OVER() as total
    FROM schools s
    WHERE s.is_active = true
      AND (clean_cep = '' OR s.cep LIKE clean_cep || '%')
      AND (search_name IS NULL OR search_name = '' OR s.name ILIKE '%' || search_name || '%')
      AND (filter_state IS NULL OR filter_state = '' OR s.state = filter_state)
      AND (filter_city IS NULL OR filter_city = '' OR s.city = filter_city)
    ORDER BY 
      CASE WHEN clean_cep != '' THEN s.cep END ASC,
      s.name ASC
    LIMIT page_size
    OFFSET page_number * page_size
  )
  SELECT * FROM filtered;
END;
$$;

-- 4. Criar índice para busca por prefixo de CEP (se não existir)
CREATE INDEX IF NOT EXISTS idx_schools_cep_prefix ON schools (cep text_pattern_ops);

-- 5. Criar índice para busca por nome com trigram (se não existir)
CREATE INDEX IF NOT EXISTS idx_schools_name_trgm ON schools USING gin (name gin_trgm_ops);