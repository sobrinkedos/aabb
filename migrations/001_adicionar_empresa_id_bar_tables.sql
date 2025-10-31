-- ============================================
-- Migração 001: Adicionar empresa_id em bar_tables
-- Database: aabb-producao (jtfdzjmravketpkwjkvp)
-- ============================================

-- IMPORTANTE: Execute esta migração em PRODUÇÃO
-- Esta migração adiciona a coluna empresa_id e atualiza os dados existentes

BEGIN;

-- 1. Adicionar coluna empresa_id (nullable inicialmente)
ALTER TABLE bar_tables 
ADD COLUMN IF NOT EXISTS empresa_id UUID;

-- 2. Atualizar registros existentes com a empresa padrão
-- ATENÇÃO: Substitua o UUID abaixo pelo ID da empresa correta
UPDATE bar_tables 
SET empresa_id = '23573c38-d2b2-4737-acbe-e902323efba0'
WHERE empresa_id IS NULL;

-- 3. Tornar a coluna obrigatória
ALTER TABLE bar_tables 
ALTER COLUMN empresa_id SET NOT NULL;

-- 4. Adicionar foreign key
ALTER TABLE bar_tables
ADD CONSTRAINT bar_tables_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_bar_tables_empresa_id 
ON bar_tables(empresa_id);

COMMIT;

-- Verificação
SELECT 
    'bar_tables' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM bar_tables;
