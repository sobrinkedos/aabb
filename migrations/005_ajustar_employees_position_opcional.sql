-- ============================================
-- Migração 005: Tornar position_id opcional em employees
-- Database: aabb-producao (jtfdzjmravketpkwjkvp)
-- ============================================

-- IMPORTANTE: Execute esta migração em PRODUÇÃO
-- Esta migração torna o campo position_id opcional para maior flexibilidade

BEGIN;

-- Tornar position_id nullable
ALTER TABLE employees 
ALTER COLUMN position_id DROP NOT NULL;

COMMIT;

-- Verificação
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name = 'position_id';
