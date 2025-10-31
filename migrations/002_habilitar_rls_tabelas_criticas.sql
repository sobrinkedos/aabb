-- ============================================
-- Migração 002: Habilitar RLS em Tabelas Críticas
-- Database: aabb-producao (jtfdzjmravketpkwjkvp)
-- ============================================

-- IMPORTANTE: Execute esta migração em PRODUÇÃO
-- Esta migração habilita Row Level Security nas tabelas críticas

BEGIN;

-- 1. Habilitar RLS em bar_tables
ALTER TABLE bar_tables ENABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS em comanda_items
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS em balcao_order_items
ALTER TABLE balcao_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Criar política para bar_tables
DROP POLICY IF EXISTS "Usuários veem apenas mesas da própria empresa" ON bar_tables;
CREATE POLICY "Usuários veem apenas mesas da própria empresa"
ON bar_tables
FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM usuarios_empresa 
        WHERE user_id = auth.uid()
    )
);

-- 5. Criar política para comanda_items (via comandas)
DROP POLICY IF EXISTS "Usuários veem apenas itens de comandas da própria empresa" ON comanda_items;
CREATE POLICY "Usuários veem apenas itens de comandas da própria empresa"
ON comanda_items
FOR ALL
USING (
    comanda_id IN (
        SELECT id 
        FROM comandas 
        WHERE empresa_id IN (
            SELECT empresa_id 
            FROM usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    )
);

-- 6. Criar política para balcao_order_items (via balcao_orders)
DROP POLICY IF EXISTS "Usuários veem apenas itens de pedidos da própria empresa" ON balcao_order_items;
CREATE POLICY "Usuários veem apenas itens de pedidos da própria empresa"
ON balcao_order_items
FOR ALL
USING (
    balcao_order_id IN (
        SELECT id 
        FROM balcao_orders 
        WHERE empresa_id IN (
            SELECT empresa_id 
            FROM usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    )
);

COMMIT;

-- Verificação
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('bar_tables', 'comanda_items', 'balcao_order_items')
ORDER BY tablename;
