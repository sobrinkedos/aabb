-- ============================================
-- Script de Validação Pós-Migração
-- Execute após todas as migrações
-- ============================================

-- ============================================
-- 1. VERIFICAR RLS HABILITADO
-- ============================================
SELECT 
    '1. Verificação RLS' as secao,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESABILITADO'
    END as status_rls
FROM pg_tables
WHERE tablename IN (
    'bar_tables', 
    'comanda_items', 
    'balcao_order_items',
    'pdv_points',
    'cash_movements',
    'bank_reconciliation',
    'cash_audit_enhanced',
    'cash_reports_cache',
    'treasury_transfers',
    'discrepancy_handling',
    'cash_closing_receipts'
)
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR COLUNA empresa_id em bar_tables
-- ============================================
SELECT 
    '2. Verificação bar_tables' as secao,
    COUNT(*) as total_mesas,
    COUNT(empresa_id) as mesas_com_empresa,
    COUNT(DISTINCT empresa_id) as empresas_distintas,
    CASE 
        WHEN COUNT(*) = COUNT(empresa_id) THEN '✅ TODAS AS MESAS TÊM EMPRESA'
        ELSE '❌ EXISTEM MESAS SEM EMPRESA'
    END as status
FROM bar_tables;

-- ============================================
-- 3. VERIFICAR NOVAS TABELAS CRIADAS
-- ============================================
SELECT 
    '3. Verificação Novas Tabelas' as secao,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ CRIADA'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'pdv_points',
    'cash_movements',
    'bank_reconciliation',
    'cash_audit_enhanced',
    'cash_reports_cache',
    'treasury_transfers',
    'discrepancy_handling',
    'cash_closing_receipts'
)
ORDER BY table_name;

-- ============================================
-- 4. VERIFICAR FOREIGN KEYS
-- ============================================
SELECT 
    '4. Verificação Foreign Keys' as secao,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ OK' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
    'bar_tables',
    'cash_sessions',
    'pdv_points',
    'cash_movements',
    'bank_reconciliation'
)
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 5. VERIFICAR ÍNDICES CRIADOS
-- ============================================
SELECT 
    '5. Verificação Índices' as secao,
    tablename,
    indexname,
    '✅ CRIADO' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE 'idx_bar_tables%'
    OR indexname LIKE 'idx_pdv_points%'
    OR indexname LIKE 'idx_cash_movements%'
    OR indexname LIKE 'idx_bank_reconciliation%'
    OR indexname LIKE 'idx_cash_audit_enhanced%'
    OR indexname LIKE 'idx_cash_sessions_pdv%'
)
ORDER BY tablename, indexname;

-- ============================================
-- 6. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
    '6. Verificação Políticas RLS' as secao,
    schemaname,
    tablename,
    policyname,
    '✅ CRIADA' as status
FROM pg_policies
WHERE tablename IN (
    'bar_tables',
    'comanda_items',
    'balcao_order_items',
    'pdv_points',
    'cash_movements',
    'bank_reconciliation',
    'cash_audit_enhanced',
    'cash_reports_cache',
    'treasury_transfers',
    'discrepancy_handling',
    'cash_closing_receipts'
)
ORDER BY tablename, policyname;

-- ============================================
-- 7. VERIFICAR CONSTRAINTS
-- ============================================
SELECT 
    '7. Verificação Constraints' as secao,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    '✅ OK' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN (
    'bar_tables',
    'cash_sessions',
    'pdv_points',
    'cash_movements',
    'bank_reconciliation',
    'employees'
)
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================
-- 8. VERIFICAR DADOS EXISTENTES
-- ============================================
SELECT 
    '8. Verificação Dados Existentes' as secao,
    'empresas' as tabela,
    COUNT(*) as total_registros
FROM empresas
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'bar_tables',
    COUNT(*)
FROM bar_tables
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'menu_items',
    COUNT(*)
FROM menu_items
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'inventory_items',
    COUNT(*)
FROM inventory_items
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'comandas',
    COUNT(*)
FROM comandas
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'balcao_orders',
    COUNT(*)
FROM balcao_orders
UNION ALL
SELECT 
    '8. Verificação Dados Existentes',
    'cash_sessions',
    COUNT(*)
FROM cash_sessions
ORDER BY tabela;

-- ============================================
-- 9. VERIFICAR INTEGRIDADE REFERENCIAL
-- ============================================
SELECT 
    '9. Verificação Integridade' as secao,
    'bar_tables sem empresa' as verificacao,
    COUNT(*) as problemas,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA ENCONTRADO'
    END as status
FROM bar_tables
WHERE empresa_id IS NULL
UNION ALL
SELECT 
    '9. Verificação Integridade',
    'comandas sem empresa',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA ENCONTRADO'
    END
FROM comandas
WHERE empresa_id IS NULL
UNION ALL
SELECT 
    '9. Verificação Integridade',
    'menu_items sem empresa',
    COUNT(*),
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA ENCONTRADO'
    END
FROM menu_items
WHERE empresa_id IS NULL;

-- ============================================
-- 10. RESUMO FINAL
-- ============================================
SELECT 
    '10. RESUMO FINAL' as secao,
    'Total de tabelas com RLS' as metrica,
    COUNT(*) as valor
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
UNION ALL
SELECT 
    '10. RESUMO FINAL',
    'Total de políticas RLS',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
    '10. RESUMO FINAL',
    'Total de foreign keys',
    COUNT(*)
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
UNION ALL
SELECT 
    '10. RESUMO FINAL',
    'Total de índices customizados',
    COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- ============================================
-- MENSAGEM FINAL
-- ============================================
SELECT 
    '✅ VALIDAÇÃO CONCLUÍDA' as status,
    'Revise os resultados acima para garantir que tudo está correto' as mensagem;
