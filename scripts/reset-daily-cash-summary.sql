-- =====================================================
-- SCRIPT PARA LIMPAR APENAS DAILY_CASH_SUMMARY
-- =====================================================
-- Este script remove apenas os registros da tabela
-- daily_cash_summary, mantendo todas as outras tabelas
-- =====================================================

-- Verificar quantos registros existem antes
SELECT 
    'ANTES DA LIMPEZA' as status,
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_registro,
    MAX(created_at) as ultimo_registro
FROM daily_cash_summary;

-- Limpar todos os registros da tabela
DELETE FROM daily_cash_summary;

-- Resetar a sequência se necessário
-- TRUNCATE TABLE daily_cash_summary RESTART IDENTITY;

-- Verificar se a limpeza foi bem-sucedida
SELECT 
    'APÓS LIMPEZA' as status,
    COUNT(*) as registros_restantes
FROM daily_cash_summary;

-- Mensagem de confirmação
SELECT 'Tabela daily_cash_summary limpa com sucesso!' as resultado;