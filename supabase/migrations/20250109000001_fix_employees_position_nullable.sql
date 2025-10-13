-- Migration: Tornar position_id nullable e criar registros padrão
-- Data: 2025-01-09
-- Objetivo: Permitir criação de funcionários sem position_id obrigatório

-- 1. Tornar position_id nullable na tabela employees
ALTER TABLE employees 
ALTER COLUMN position_id DROP NOT NULL;

-- 2. Criar department padrão se não existir
INSERT INTO departments (id, name, description, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Operacional',
  'Departamento operacional padrão',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar position padrão se não existir
INSERT INTO positions (id, title, description, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Funcionário',
  'Cargo padrão para funcionários',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Atualizar employees existentes sem position_id para usar o padrão
UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000001'
WHERE position_id IS NULL;

-- 5. Comentários
COMMENT ON COLUMN employees.position_id IS 'ID do cargo (position) - nullable para permitir criação sem cargo definido';
