-- =====================================================
-- SCRIPT PARA LIMPAR MENU_ITENS E EMPRESAS
-- =====================================================
-- Este script remove apenas os registros das tabelas
-- menu_itens e empresas
-- ATENÇÃO: Limpar empresas pode afetar todo o sistema!
-- =====================================================

-- Verificar quantos registros existem antes
SELECT 
    'ANTES DA LIMPEZA' as status,
    'menu_itens' as tabela,
    COUNT(*) as total_registros
FROM menu_itens
UNION ALL
SELECT 
    'ANTES DA LIMPEZA' as status,
    'empresas' as tabela,
    COUNT(*) as total_registros
FROM empresas;

-- =====================================================
-- LIMPEZA DAS TABELAS
-- =====================================================

-- Limpar itens do menu
DELETE FROM menu_itens;

-- CUIDADO: Limpar empresas pode quebrar o sistema!
-- Descomente apenas se tiver certeza:
-- DELETE FROM empresas;

-- =====================================================
-- VERIFICAÇÃO APÓS LIMPEZA
-- =====================================================

SELECT 
    'APÓS LIMPEZA' as status,
    'menu_itens' as tabela,
    COUNT(*) as registros_restantes
FROM menu_itens
UNION ALL
SELECT 
    'APÓS LIMPEZA' as status,
    'empresas' as tabela,
    COUNT(*) as registros_restantes
FROM empresas;

-- Mensagem de confirmação
SELECT 'Limpeza de menu_itens concluída!' as resultado;