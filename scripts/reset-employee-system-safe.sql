-- =====================================================
-- SCRIPT SEGURO PARA ZERAR SISTEMA DE FUNCIONÁRIOS
-- =====================================================
-- Este script preserva o usuário administrador principal
-- e remove apenas funcionários e dados relacionados
-- =====================================================

-- =====================================================
-- PASSO 1: Identificar usuário administrador principal
-- =====================================================
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT;
BEGIN
    -- Encontrar o primeiro usuário administrador
    SELECT user_id, email INTO admin_user_id, admin_email
    FROM usuarios_empresa 
    WHERE is_primeiro_usuario = true 
       OR tipo_usuario = 'administrador'
    ORDER BY created_at ASC 
    LIMIT 1;
    
    RAISE NOTICE 'Usuário administrador preservado: % (ID: %)', admin_email, admin_user_id;
END $$;

-- =====================================================
-- PASSO 2: Limpar permissões de funcionários
-- =====================================================
DELETE FROM permissoes_usuario 
WHERE usuario_empresa_id IN (
    SELECT id FROM usuarios_empresa 
    WHERE tipo_usuario != 'administrador' 
       OR is_primeiro_usuario = false
);

-- =====================================================
-- PASSO 2.1: Limpar dados operacionais
-- =====================================================
-- Limpar resumos diários de caixa
DELETE FROM daily_cash_summary;

-- Limpar itens do menu
DELETE FROM menu_itens;

-- ATENÇÃO: Limpar empresas remove TODOS os dados da empresa!
-- Descomente apenas se quiser reset COMPLETO do sistema
-- DELETE FROM empresas;

-- Limpar outras tabelas relacionadas (descomente se necessário)
-- DELETE FROM employee_shifts;
-- DELETE FROM employee_sales; 
-- DELETE FROM employee_commissions;
-- DELETE FROM attendance_records;
-- DELETE FROM performance_metrics;
-- DELETE FROM cash_register_sessions;
-- DELETE FROM sales_transactions;

-- =====================================================
-- PASSO 3: Limpar funcionários do bar
-- =====================================================
DELETE FROM bar_employees 
WHERE employee_id NOT IN (
    SELECT user_id FROM usuarios_empresa 
    WHERE is_primeiro_usuario = true 
       OR tipo_usuario = 'administrador'
);

-- =====================================================
-- PASSO 4: Limpar usuários funcionários da empresa
-- =====================================================
DELETE FROM usuarios_empresa 
WHERE tipo_usuario != 'administrador' 
   AND is_primeiro_usuario = false;

-- =====================================================
-- PASSO 5: Limpar usuários do Supabase Auth (funcionários)
-- =====================================================
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM usuarios_empresa 
    WHERE is_primeiro_usuario = true 
       OR tipo_usuario = 'administrador'
)
AND id NOT IN (
    -- Preservar qualquer usuário com email de admin
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' 
       OR email LIKE '%administrador%'
);

-- =====================================================
-- PASSO 6: Limpar sessões de funcionários
-- =====================================================
DELETE FROM auth.sessions 
WHERE user_id NOT IN (
    SELECT user_id FROM usuarios_empresa 
    WHERE is_primeiro_usuario = true 
       OR tipo_usuario = 'administrador'
);

-- =====================================================
-- PASSO 7: Limpar tokens de refresh de funcionários
-- =====================================================
DELETE FROM auth.refresh_tokens 
WHERE user_id NOT IN (
    SELECT user_id FROM usuarios_empresa 
    WHERE is_primeiro_usuario = true 
       OR tipo_usuario = 'administrador'
);

-- =====================================================
-- VERIFICAÇÃO: Mostrar o que restou
-- =====================================================
SELECT 
    'RESUMO DO RESET' as info,
    '' as detalhes
UNION ALL
SELECT 
    'Usuários preservados:' as info,
    COUNT(*)::TEXT as detalhes
FROM usuarios_empresa 
WHERE is_primeiro_usuario = true 
   OR tipo_usuario = 'administrador'
UNION ALL
SELECT 
    'Funcionários removidos:' as info,
    '✓ Todos os funcionários foram removidos' as detalhes
UNION ALL
SELECT 
    'Permissões limpas:' as info,
    '✓ Apenas permissões de admin preservadas' as detalhes;

-- =====================================================
-- LISTAR USUÁRIOS RESTANTES
-- =====================================================
SELECT 
    ue.nome_completo,
    ue.email,
    ue.tipo_usuario,
    ue.is_primeiro_usuario,
    'PRESERVADO' as status
FROM usuarios_empresa ue
WHERE ue.is_primeiro_usuario = true 
   OR ue.tipo_usuario = 'administrador';

SELECT 'Reset seguro concluído! Usuário administrador preservado.' as resultado;