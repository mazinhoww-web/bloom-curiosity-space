
# Plano: Refatorar Busca de Escolas para Performance e Confiabilidade

## Resumo Executivo
A busca por escolas está falhando devido a uma incompatibilidade de formato: os CEPs no banco estão salvos como `01003-001` (com hífen), mas a busca remove o hífen e procura por `01003001` - que nunca vai encontrar. Vou criar uma solução robusta que normaliza os dados e cria um endpoint otimizado.

---

## Diagnóstico do Problema

### Problema 1: Incompatibilidade de Formato de CEP
```
Banco de dados:  "01003-001" (com hífen)
Busca usuário:   "01003001"  (sem hífen)
Resultado:       0 escolas encontradas
```

### Problema 2: Busca Ineficiente
- `ilike("cep", "%01003%")` ignora o índice btree
- 181.000+ registros sendo escaneados a cada busca

### Problema 3: Falta de Cache
- Mesma busca executada múltiplas vezes sem reuso

---

## Solução Proposta

### Fase 1: Normalização dos Dados

**1.1 Migration: Normalizar CEPs no banco**

Remover hífens de todos os CEPs existentes para formato `XXXXXXXX`:
```sql
UPDATE schools 
SET cep = REPLACE(cep, '-', '')
WHERE cep LIKE '%-%';
```

**1.2 Criar função de normalização no banco**
```sql
CREATE OR REPLACE FUNCTION normalize_cep(input_cep text)
RETURNS text AS $$
BEGIN
  RETURN regexp_replace(input_cep, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Fase 2: Função RPC Otimizada

**2.1 Criar função `search_schools` no PostgreSQL**

```sql
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
  city text,
  state text,
  total_count bigint
) AS $$
DECLARE
  clean_cep text;
BEGIN
  -- Normalizar CEP de entrada
  clean_cep := regexp_replace(COALESCE(search_cep, ''), '[^0-9]', '', 'g');
  
  RETURN QUERY
  WITH filtered AS (
    SELECT s.*, COUNT(*) OVER() as total
    FROM schools s
    WHERE s.is_active = true
      -- Filtro por CEP (match exato ou prefixo)
      AND (clean_cep = '' OR s.cep LIKE clean_cep || '%')
      -- Filtro por nome (trigram)
      AND (search_name IS NULL OR s.name ILIKE '%' || search_name || '%')
      -- Filtro por estado
      AND (filter_state IS NULL OR s.state = filter_state)
      -- Filtro por cidade  
      AND (filter_city IS NULL OR s.city = filter_city)
    ORDER BY 
      CASE WHEN clean_cep != '' THEN s.cep END ASC,
      s.name ASC
    LIMIT page_size
    OFFSET page_number * page_size
  )
  SELECT 
    f.id, f.name, f.slug, f.cep, f.city, f.state, f.total
  FROM filtered f;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Fase 3: Utilitários Frontend

**3.1 Atualizar `src/lib/school-utils.ts`**

Adicionar funções de normalização:
```typescript
// Normaliza CEP para apenas números (8 dígitos)
export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8);
}

// Formata CEP para exibição (XXXXX-XXX)
export function formatCep(cep: string): string {
  const clean = normalizeCep(cep);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

// Verifica se é busca por CEP (5+ dígitos numéricos)
export function isCepSearch(query: string): boolean {
  return normalizeCep(query).length >= 5;
}
```

### Fase 4: Hook de Busca Otimizado

**4.1 Criar `src/hooks/use-school-search.ts`**

```typescript
export function useSchoolSearch(options: SearchOptions) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Debounce de 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(options.query);
    }, 300);
    return () => clearTimeout(timer);
  }, [options.query]);
  
  return useQuery({
    queryKey: ['schools-search', debouncedQuery, options.filters, options.page],
    queryFn: async () => {
      // Só busca com 5+ dígitos de CEP ou 2+ caracteres de nome
      const cleanCep = normalizeCep(debouncedQuery);
      const isCep = cleanCep.length >= 5;
      
      if (!isCep && debouncedQuery.length < 2 && !options.filters.state) {
        return { schools: [], total: 0 };
      }
      
      const { data, error } = await supabase.rpc('search_schools', {
        search_cep: isCep ? cleanCep : null,
        search_name: isCep ? null : debouncedQuery,
        filter_state: options.filters.state || null,
        filter_city: options.filters.city || null,
        page_number: options.page,
        page_size: options.pageSize
      });
      
      if (error) throw error;
      
      return {
        schools: data,
        total: data[0]?.total_count || 0
      };
    },
    staleTime: 30000, // Cache por 30 segundos
    enabled: debouncedQuery.length >= 2 || !!options.filters.state
  });
}
```

### Fase 5: Atualizar Componentes

**5.1 Refatorar `src/pages/Schools.tsx`**

- Usar o novo hook `useSchoolSearch`
- Debounce de 300ms no input
- Mensagens claras de estado (carregando, sem resultados, erro)
- Mínimo de 5 dígitos para busca por CEP

**5.2 Refatorar `src/pages/admin/Schools.tsx`**

- Mesma lógica do Schools.tsx
- Usar RPC function otimizada

**5.3 Refatorar `src/components/upload/SchoolSelectStep.tsx`**

- Usar o novo hook
- Mínimo 5 dígitos de CEP ou 2 caracteres de nome

**5.4 Refatorar `src/components/landing/HeroSearch.tsx`**

- Formatar CEP enquanto digita
- Só habilitar busca com 5+ dígitos

---

## Arquivos a Serem Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx.sql` | **Criar** - Migration para normalizar CEPs e criar função RPC |
| `src/lib/school-utils.ts` | **Editar** - Adicionar funções normalizeCep, formatCep, isCepSearch |
| `src/hooks/use-school-search.ts` | **Criar** - Hook centralizado de busca |
| `src/pages/Schools.tsx` | **Editar** - Usar novo hook, debounce, mensagens |
| `src/pages/admin/Schools.tsx` | **Editar** - Usar novo hook |
| `src/components/upload/SchoolSelectStep.tsx` | **Editar** - Usar novo hook |
| `src/components/landing/HeroSearch.tsx` | **Editar** - Validação de CEP |

---

## Fluxo Visual da Busca

```text
┌──────────────────────────────────────────────────────────────────┐
│                     USUÁRIO DIGITA CEP                           │
│                       "01003-001"                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  DEBOUNCE 300ms NO FRONTEND                      │
│              (evita requisições a cada tecla)                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               NORMALIZAÇÃO: normalizeCep()                       │
│              "01003-001" → "01003001"                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               VALIDAÇÃO: isCepSearch()                           │
│            length >= 5 dígitos? → SIM                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   RPC: search_schools                            │
│     SELECT * FROM schools WHERE cep LIKE '01003001%'             │
│                   (usa índice btree)                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  RESULTADOS PAGINADOS                            │
│              + CACHE 30s via React Query                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Métricas de Sucesso

| Métrica | Antes | Depois (Meta) |
|---------|-------|---------------|
| TTFB busca por CEP | > 2s | < 300ms |
| Resultados CEP exato | 0 | Correto |
| Requisições duplicadas | Sim | Não (cache) |
| Busca por prefixo | Falha | Funciona |

---

## Detalhes Técnicos

### Migration SQL Completa

```sql
-- 1. Normalizar todos os CEPs existentes
UPDATE schools 
SET cep = REPLACE(cep, '-', '')
WHERE cep LIKE '%-%';

-- 2. Criar função de normalização
CREATE OR REPLACE FUNCTION normalize_cep(input_cep text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(COALESCE(input_cep, ''), '[^0-9]', '', 'g');
$$;

-- 3. Criar função de busca otimizada
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
```

### Tipos TypeScript Atualizados

A função RPC retorna:
```typescript
interface SchoolSearchResult {
  id: string;
  name: string;
  slug: string;
  cep: string;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  is_active: boolean;
  total_count: number;
}
```

---

## Ordem de Implementação

1. **Migration** - Normalizar CEPs e criar função RPC
2. **Utilitários** - Funções de normalização no frontend
3. **Hook** - useSchoolSearch centralizado
4. **Componentes** - Atualizar todos os pontos de busca
5. **Testes** - Validar CEP completo, parcial, inexistente
