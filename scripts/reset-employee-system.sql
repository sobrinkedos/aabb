-- =====================================================
-- SCRIPT PARA ZERAR SISTEMA DE FUNCIONÁRIOS
-- =====================================================
-- ATENÇÃO: Este script remove TODOS os dados das tabelas
-- relacionadas ao sistema de funcionários e usuários.
-- Execute apenas em ambiente de desenvolvimento/teste!
-- =====================================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- =====================================================
-- PASSO 1: Limpar tabelas dependentes primeiro
-- =====================================================

-- Limpar permissões de usuários
DELETE FROM permissoes_usuario;
TRUNCATE TABLE permissoes_usuario RESTART IDENTITY CASCADE;

-- Limpar resumos diários de caixa
DELETE FROM daily_cash_summary;
TRUNCATE TABLE daily_cash_summary RESTART IDENTITY CASCADE;

-- Limpar itens do menu
DELETE FROM menu_itens;
TRUNCATE TABLE menu_itens RESTART IDENTITY CASCADE;

-- Limpar empresas (CUIDADO: Remove TODOS os dados da empresa!)
DELETE FROM empresas;
TRUNCATE TABLE empresas RESTART IDENTITY CASCADE;

-- Limpar outras tabelas relacionadas a funcionários (se existirem)
-- Descomente conforme necessário:
-- DELETE FROM employee_shifts;
-- DELETE FROM employee_sales;
-- DELETE FROM employee_commissions;
-- DELETE FROM attendance_records;
-- DELETE FROM performance_metrics;

-- Limpar funcionários do bar
DELETE FROM bar_employees;
TRUNCATE TABLE bar_employees RESTART IDENTITY CASCADE;

-- Limpar usuários da empresa
DELETE FROM usuarios_empresa;
TRUNCATE TABLE usuarios_empresa RESTART IDENTITY CASCADE;

-- =====================================================
-- PASSO 2: Limpar usuários do Supabase Auth
-- =====================================================
-- CUIDADO: Isso remove TODOS os usuários do sistema!

-- Remover usuários da tabela auth.users (exceto admin se necessário)
-- Descomente a linha abaixo apenas se quiser remover TODOS os usuários
-- DELETE FROM auth.users WHERE email != 'admin@empresa.com';

-- Alternativa mais segura: remover apenas usuários que não são admin
DELETE FROM auth.users 
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM usuarios_empresa 
    WHERE tipo_usuario != 'administrador' 
    OR is_primeiro_usuario = false
);

-- =====================================================
-- PASSO 3: Limpar outras tabelas relacionadas (se existirem)
-- =====================================================

-- Limpar sessões ativas (opcional)
-- DELETE FROM auth.sessions;

-- Limpar tokens de refresh (opcional)
-- DELETE FROM auth.refresh_tokens;

-- =====================================================
-- PASSO 4: Resetar sequências e contadores
-- =====================================================

-- Resetar contadores de tentativas de login se necessário
-- (já feito com RESTART IDENTITY acima)

-- =====================================================
-- PASSO 5: Reabilitar verificações de chave estrangeira
-- =====================================================
SET session_replication_role = DEFAULT;

-- =====================================================
-- VERIFICAÇÃO: Contar registros restantes
-- =====================================================
SELECT 
    'permissoes_usuario' as tabela, 
    COUNT(*) as registros_restantes 
FROM permissoes_usuario
UNION ALL
SELECT 
    'bar_employees' as tabela, 
    COUNT(*) as registros_restantes 
FROM bar_employees
UNION ALL
SELECT 
    'usuarios_empresa' as tabela, 
    COUNT(*) as registros_restantes 
FROM usuarios_empresa
UNION ALL
SELECT 
    'daily_cash_summary' as tabela, 
    COUNT(*) as registros_restantes 
FROM daily_cash_summary
UNION ALL
SELECT 
    'menu_itens' as tabela, 
    COUNT(*) as registros_restantes 
FROM menu_itens
UNION ALL
SELECT 
    'empresas' as tabela, 
    COUNT(*) as registros_restantes 
FROM empresas
UNION ALL
SELECT 
    'auth.users' as tabela, 
    COUNT(*) as registros_restantes 
FROM auth.users;

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================
SELECT 'Sistema de funcionários resetado com sucesso!' as status;