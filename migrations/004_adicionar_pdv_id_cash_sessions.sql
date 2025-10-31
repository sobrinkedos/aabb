-- ============================================
-- Migração 004: Adicionar pdv_id em cash_sessions
-- Database: aabb-producao (jtfdzjmravketpkwjkvp)
-- ============================================

-- IMPORTANTE: Esta coluna já existe em PRODUÇÃO
-- Execute apenas se necessário verificar/recriar

BEGIN;

-- Verificar se a coluna já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cash_sessions' 
        AND column_name = 'pdv_id'
    ) THEN
        -- Adicionar coluna pdv_id
        ALTER TABLE cash_sessions 
        ADD COLUMN pdv_id UUID REFERENCES pdv_points(id) ON DELETE SET NULL;
        
        -- Criar índice
        CREATE INDEX idx_cash_sessions_pdv_id ON cash_sessions(pdv_id);
        
        RAISE NOTICE 'Coluna pdv_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna pdv_id já existe';
    END IF;
END $$;

COMMIT;

-- Verificação
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cash_sessions'
AND column_name = 'pdv_id';
