-- =====================================================
-- SCRIPT DE TESTE - MIGRAÇÃO CAIXA AVANÇADO
-- =====================================================
-- Este script valida que todas as tabelas, índices,
-- triggers e views foram criados corretamente
-- =====================================================

-- 1. VERIFICAR TABELAS CRIADAS
SELECT 
  'Tabelas Criadas' as tipo,
  COUNT(*) as total,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as detalhes
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'pdv_points', 
  'cash_movements', 
  'bank_reconciliation', 
  'cash_audit_enhanced', 
  'cash_reports_cache'
);

-- 2. VERIFICAR COLUNAS ADICIONADAS EM CASH_SESSIONS
SELECT 
  'Colunas Cash Sessions' as tipo,
  COUNT(*) as total,
  STRING_AGG(column_name, ', ' ORDER BY column_name) as detalhes
FROM information_schema.columns 
WHERE table_name = 'cash_sessions' 
AND column_name IN ('pdv_id', 'supervisor_approval_id');

-- 3. VERIFICAR COLUNAS ADICIONADAS EM CASH_TRANSACTIONS
SELECT 
  'Colunas Cash Transactions' as tipo,
  COUNT(*) as total,
  STRING_AGG(column_name, ', ' ORDER BY column_name) as detalhes
FROM information_schema.columns 
WHERE table_name = 'cash_transactions' 
AND column_name IN ('reference_number', 'receipt_number', 'customer_name');

-- 4. VERIFICAR ÍNDICES CRIADOS
SELECT 
  'Índices Criados' as tipo,
  COUNT(*) as total,
  STRING_AGG(indexname, ', ' ORDER BY indexname) as detalhes
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%cash%' 
OR indexname LIKE 'idx_%pdv%' 
OR indexname LIKE 'idx_%bank%';

-- 5. VERIFICAR TRIGGERS
SELECT 
  'Triggers Criados' as tipo,
  COUNT(*) as total,
  STRING_AGG(trigger_name, ', ' ORDER BY trigger_name) as detalhes
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (
  trigger_name LIKE '%pdv%' 
  OR trigger_name LIKE '%audit%' 
  OR trigger_name LIKE '%bank%'
  OR trigger_name LIKE '%cash%'
);

-- 6. VERIFICAR FUNÇÕES
SELECT 
  'Funções Criadas' as tipo,
  COUNT(*) as total,
  STRING_AGG(routine_name, ', ' ORDER BY routine_name) as detalhes
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
  routine_name LIKE '%cash%' 
  OR routine_name LIKE '%pdv%' 
  OR routine_name LIKE '%audit%'
  OR routine_name LIKE '%bank%'
  OR routine_name LIKE '%risk%'
);

-- 7. VERIFICAR VIEWS MATERIALIZADAS
SELECT 
  'Views Materializadas' as tipo,
  COUNT(*) as total,
  STRING_AGG(matviewname, ', ' ORDER BY matviewname) as detalhes
FROM pg_matviews 
WHERE schemaname = 'public' 
AND matviewname LIKE 'mv_%';

-- 8. VERIFICAR RLS HABILITADO
SELECT 
  'RLS Habilitado' as tipo,
  COUNT(*) as total,
  STRING_AGG(tablename, ', ' ORDER BY tablename) as detalhes
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'pdv_points', 
  'cash_movements', 
  'bank_reconciliation', 
  'cash_audit_enhanced', 
  'cash_reports_cache'
)
AND rowsecurity = true;

-- 9. VERIFICAR POLÍTICAS RLS
SELECT 
  'Políticas RLS' as tipo,
  COUNT(*) as total,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as detalhes
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'pdv_points', 
  'cash_movements', 
  'bank_reconciliation', 
  'cash_audit_enhanced', 
  'cash_reports_cache'
);

-- 10. VERIFICAR CONSTRAINTS
SELECT 
  'Constraints' as tipo,
  COUNT(*) as total,
  STRING_AGG(constraint_name, ', ' ORDER BY constraint_name) as detalhes
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN (
  'pdv_points', 
  'cash_movements', 
  'bank_reconciliation', 
  'cash_audit_enhanced', 
  'cash_reports_cache'
)
AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK');

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT 
  '=== RESUMO DA MIGRAÇÃO ===' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('pdv_points', 'cash_movements', 'bank_reconciliation', 'cash_audit_enhanced', 'cash_reports_cache')
  ) as tabelas_criadas,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND (indexname LIKE 'idx_%cash%' OR indexname LIKE 'idx_%pdv%' OR indexname LIKE 'idx_%bank%')
  ) as indices_criados,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_schema = 'public' 
   AND (trigger_name LIKE '%audit%' OR trigger_name LIKE '%pdv%' OR trigger_name LIKE '%bank%')
  ) as triggers_criados,
  (SELECT COUNT(*) FROM pg_matviews 
   WHERE schemaname = 'public' 
   AND matviewname LIKE 'mv_%'
  ) as views_materializadas,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('pdv_points', 'cash_movements', 'bank_reconciliation', 'cash_audit_enhanced', 'cash_reports_cache')
  ) as politicas_rls;

-- =====================================================
-- TESTE DE INSERÇÃO (OPCIONAL - COMENTADO)
-- =====================================================
-- Descomente para testar inserção de dados

/*
-- Inserir PDV de teste
INSERT INTO pdv_points (empresa_id, name, location, description)
VALUES (
  (SELECT id FROM empresas LIMIT 1),
  'PDV Teste - Balcão Principal',
  'Área de Atendimento',
  'PDV criado para testes da migração'
)
RETURNING id, name, location, is_active, created_at;

-- Verificar PDV criado
SELECT * FROM pdv_points WHERE name LIKE '%Teste%';

-- Limpar dados de teste
DELETE FROM pdv_points WHERE name LIKE '%Teste%';
*/
