-- =============================================
-- MIGRAÇÃO 1: Adicionar novos valores ao enum app_role
-- =============================================
-- Nota: Novos valores de enum precisam ser commitados antes de usar

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_editor';