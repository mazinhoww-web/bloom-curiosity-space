-- =============================================
-- MIGRAÇÃO 2: Sistema de Reivindicação de Escolas
-- =============================================

-- 1. Criar enum para status das requisições
CREATE TYPE public.claim_request_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Criar tabela de requisições de reivindicação
CREATE TABLE public.school_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Dados do solicitante
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  
  -- Status e workflow
  status public.claim_request_status NOT NULL DEFAULT 'pending',
  requested_role TEXT NOT NULL DEFAULT 'school_admin',
  
  -- Aprovação/Rejeição
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX idx_school_claim_requests_school_id ON public.school_claim_requests(school_id);
CREATE INDEX idx_school_claim_requests_user_id ON public.school_claim_requests(user_id);
CREATE INDEX idx_school_claim_requests_status ON public.school_claim_requests(status);
CREATE INDEX idx_school_claim_requests_pending ON public.school_claim_requests(school_id, status) WHERE status = 'pending';

-- 4. Habilitar RLS
ALTER TABLE public.school_claim_requests ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS
CREATE POLICY "Users can view their own claim requests"
ON public.school_claim_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create claim requests"
ON public.school_claim_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Platform admins can view all claim requests"
ON public.school_claim_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can update claim requests"
ON public.school_claim_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School admins can view their school claim requests"
ON public.school_claim_requests FOR SELECT
USING (public.is_school_admin(auth.uid(), school_id));

-- 6. Trigger para updated_at
CREATE TRIGGER update_school_claim_requests_updated_at
  BEFORE UPDATE ON public.school_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Função para verificar se um email é genérico
CREATE OR REPLACE FUNCTION public.is_generic_email(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  domain TEXT;
  generic_domains TEXT[] := ARRAY[
    'gmail.com', 'gmail.com.br', 'yahoo.com', 'yahoo.com.br',
    'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br',
    'live.com', 'live.com.br', 'msn.com', 'icloud.com', 'aol.com',
    'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com', 'gmx.com',
    'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'r7.com'
  ];
BEGIN
  domain := lower(split_part(email_address, '@', 2));
  RETURN domain = ANY(generic_domains);
END;
$$;

-- 8. Função para verificar se escola já tem admin aprovado
CREATE OR REPLACE FUNCTION public.school_has_admin(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE school_id = p_school_id
      AND role IN ('school_admin'::app_role, 'admin'::app_role)
  );
END;
$$;

-- 9. Função para aprovar requisição
CREATE OR REPLACE FUNCTION public.approve_claim_request(
  p_request_id UUID,
  p_role TEXT DEFAULT 'school_admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_admin_id UUID;
  v_role_enum app_role;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores da plataforma podem aprovar requisições';
  END IF;
  
  SELECT * INTO v_request
  FROM school_claim_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requisição não encontrada ou já processada';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_request.user_id AND school_id = v_request.school_id
  ) THEN
    RAISE EXCEPTION 'Usuário já possui vínculo com esta escola';
  END IF;
  
  v_role_enum := p_role::app_role;
  
  INSERT INTO user_roles (user_id, school_id, role)
  VALUES (v_request.user_id, v_request.school_id, v_role_enum);
  
  UPDATE school_claim_requests
  SET status = 'approved', requested_role = p_role, reviewed_by = v_admin_id, reviewed_at = now()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$;

-- 10. Função para rejeitar requisição
CREATE OR REPLACE FUNCTION public.reject_claim_request(
  p_request_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores da plataforma podem rejeitar requisições';
  END IF;
  
  UPDATE school_claim_requests
  SET status = 'rejected', reviewed_by = v_admin_id, reviewed_at = now(), rejection_reason = p_reason
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requisição não encontrada ou já processada';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 11. Função para listar escolas administradas por um usuário
CREATE OR REPLACE FUNCTION public.get_user_managed_schools(p_user_id UUID)
RETURNS TABLE (
  school_id UUID,
  school_name TEXT,
  school_slug TEXT,
  role app_role,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as school_id,
    s.name as school_name,
    s.slug as school_slug,
    ur.role,
    ur.created_at
  FROM user_roles ur
  JOIN schools s ON s.id = ur.school_id
  WHERE ur.user_id = p_user_id
    AND ur.role IN ('school_admin'::app_role, 'school_editor'::app_role)
    AND s.is_active = true
  ORDER BY ur.created_at DESC;
END;
$$;

-- 12. Função para obter status de requisição do usuário
CREATE OR REPLACE FUNCTION public.get_user_claim_status(p_user_id UUID, p_school_id UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  user_role TEXT,
  pending_request_id UUID,
  pending_since TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_pending_id UUID;
  v_pending_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT ur.role::TEXT INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
    AND ur.school_id = p_school_id
    AND ur.role IN ('school_admin'::app_role, 'school_editor'::app_role)
  LIMIT 1;
  
  IF v_role IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_role, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  SELECT scr.id, scr.created_at INTO v_pending_id, v_pending_date
  FROM school_claim_requests scr
  WHERE scr.user_id = p_user_id
    AND scr.school_id = p_school_id
    AND scr.status = 'pending'
  LIMIT 1;
  
  IF v_pending_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, v_pending_id, v_pending_date;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE;
END;
$$;