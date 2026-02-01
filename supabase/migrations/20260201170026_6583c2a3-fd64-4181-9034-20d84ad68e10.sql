-- Adicionar coluna school_id à tabela user_roles para suportar school_admin
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- Índice para performance da função is_school_admin
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON public.user_roles(school_id);

-- Índices para buscas em 180k escolas
CREATE INDEX IF NOT EXISTS idx_schools_state_city ON public.schools(state, city);
CREATE INDEX IF NOT EXISTS idx_schools_active_name ON public.schools(is_active, name);
CREATE INDEX IF NOT EXISTS idx_schools_cep ON public.schools(cep);

-- Atualizar estatísticas do PostgreSQL
ANALYZE public.schools;
ANALYZE public.user_roles;