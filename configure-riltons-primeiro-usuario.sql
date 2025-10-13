/*
  # Configurar riltons@gmail.com como Primeiro Usuário
  
  Este script configura o usuário riltons@gmail.com como primeiro usuário da empresa
  para ativar os triggers automáticos que criam:
  - public.configuracoes_empresa (todas as categorias)
  - public.permissoes_usuario (todos os módulos com permissões completas)
  - public.logs_auditoria (log da criação do primeiro usuário)
*/

-- ========================================================================
-- 1. VERIFICAR DADOS ATUAIS DO USUÁRIO RILTONS
-- ========================================================================

DO $$
DECLARE
    v_user_exists BOOLEAN := FALSE;
    v_empresa_exists BOOLEAN := FALSE;
    v_usuarios_empresa_exists BOOLEAN := FALSE;
    v_user_id UUID;
    v_empresa_id UUID;
    v_usuarios_empresa_id UUID;
BEGIN
    RAISE NOTICE '🔍 === VERIFICANDO DADOS ATUAIS DO USUÁRIO RILTONS ===';
    
    -- Verificar se existe no auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'riltons@gmail.com') INTO v_user_exists;
    
    IF v_user_exists THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'riltons@gmail.com';
        RAISE NOTICE '✅ Usuário encontrado no auth.users - ID: %', v_user_id;
    ELSE
        RAISE NOTICE '❌ Usuário NÃO encontrado no auth.users';
    END IF;
    
    -- Verificar se existe empresa
    SELECT EXISTS(SELECT 1 FROM public.empresas LIMIT 1) INTO v_empresa_exists;
    
    IF v_empresa_exists THEN
        SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
        RAISE NOTICE '✅ Empresa encontrada - ID: %', v_empresa_id;
    ELSE
        RAISE NOTICE '❌ Nenhuma empresa encontrada';
    END IF;
    
    -- Verificar se existe em usuarios_empresa
    IF v_user_exists THEN
        SELECT EXISTS(
            SELECT 1 FROM public.usuarios_empresa 
            WHERE user_id = v_user_id OR email = 'riltons@gmail.com'
        ) INTO v_usuarios_empresa_exists;
        
        IF v_usuarios_empresa_exists THEN
            SELECT id INTO v_usuarios_empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = v_user_id OR email = 'riltons@gmail.com'
            LIMIT 1;
            RAISE NOTICE '✅ Usuário encontrado em usuarios_empresa - ID: %', v_usuarios_empresa_id;
        ELSE
            RAISE NOTICE '❌ Usuário NÃO encontrado em usuarios_empresa';
        END IF;
    END IF;
END $$;

-- ========================================================================
-- 2. CRIAR EMPRESA SE NÃO EXISTIR
-- ========================================================================

INSERT INTO public.empresas (
    nome, 
    cnpj, 
    email_admin, 
    telefone, 
    plano, 
    status,
    configuracoes
)
SELECT 
    'AABB Garanhuns',
    '12.345.678/0001-90',
    'riltons@gmail.com',
    '(87) 99999-9999',
    'premium',
    'ativo',
    '{"tema": "claro", "primeira_configuracao": true}'
WHERE NOT EXISTS (SELECT 1 FROM public.empresas LIMIT 1);

-- ========================================================================
-- 3. CRIAR USUÁRIO AUTH SE NÃO EXISTIR
-- ========================================================================

-- Nota: Este usuário deve ser criado através do Supabase Auth Dashboard ou via código
-- Aqui apenas verificamos se existe

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
BEGIN
    -- Obter IDs necessários
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'riltons@gmail.com';
    SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️  ATENÇÃO: O usuário riltons@gmail.com precisa ser criado no Supabase Auth primeiro!';
        RAISE NOTICE '   Use o Supabase Dashboard ou o código da aplicação para criar o usuário.';
        RETURN;
    END IF;
    
    IF v_empresa_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhuma empresa encontrada no sistema!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Prosseguindo com user_id: % e empresa_id: %', v_user_id, v_empresa_id;
END $$;

-- ========================================================================
-- 4. LIMPAR DADOS EXISTENTES PARA RECONFIGURAÇÃO
-- ========================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
    v_usuarios_empresa_id UUID;
BEGIN
    -- Obter IDs
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'riltons@gmail.com';
    SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RETURN;
    END IF;
    
    RAISE NOTICE '🧹 === LIMPANDO DADOS EXISTENTES PARA RECONFIGURAÇÃO ===';
    
    -- Obter ID do registro em usuarios_empresa se existir
    SELECT id INTO v_usuarios_empresa_id 
    FROM public.usuarios_empresa 
    WHERE user_id = v_user_id AND empresa_id = v_empresa_id;
    
    -- Limpar configurações existentes da empresa
    DELETE FROM public.configuracoes_empresa WHERE empresa_id = v_empresa_id;
    RAISE NOTICE '🗑️  Configurações da empresa removidas';
    
    -- Limpar permissões existentes do usuário
    IF v_usuarios_empresa_id IS NOT NULL THEN
        DELETE FROM public.permissoes_usuario WHERE usuario_empresa_id = v_usuarios_empresa_id;
        RAISE NOTICE '🗑️  Permissões do usuário removidas';
    END IF;
    
    -- Limpar logs de auditoria relacionados
    DELETE FROM public.logs_auditoria 
    WHERE empresa_id = v_empresa_id 
    AND (usuario_id = v_user_id OR acao = 'PRIMEIRO_USUARIO_CRIADO');
    RAISE NOTICE '🗑️  Logs de auditoria relacionados removidos';
    
    -- Remover registro existente de usuarios_empresa para recriar
    DELETE FROM public.usuarios_empresa 
    WHERE user_id = v_user_id AND empresa_id = v_empresa_id;
    RAISE NOTICE '🗑️  Registro existente em usuarios_empresa removido';
    
END $$;

-- ========================================================================
-- 5. CRIAR/ATUALIZAR REGISTRO COMO PRIMEIRO USUÁRIO
-- ========================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
    v_new_usuario_id UUID;
BEGIN
    -- Obter IDs necessários
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'riltons@gmail.com';
    SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RAISE NOTICE '❌ Não é possível prosseguir sem user_id e empresa_id válidos';
        RETURN;
    END IF;
    
    RAISE NOTICE '👤 === CRIANDO RILTONS COMO PRIMEIRO USUÁRIO ===';
    
    -- Inserir como primeiro usuário (isso ativará todos os triggers)
    INSERT INTO public.usuarios_empresa (
        user_id,
        empresa_id,
        nome_completo,
        email,
        telefone,
        cargo,
        tipo_usuario,
        papel,
        is_primeiro_usuario,
        status,
        senha_provisoria,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_empresa_id,
        'Rilton Silva',
        'riltons@gmail.com',
        '(87) 99999-9999',
        'Diretor Geral',
        'administrador',
        'SUPER_ADMIN',
        TRUE,  -- 🔥 ISSO ATIVA TODOS OS TRIGGERS AUTOMÁTICOS
        'ativo',
        FALSE,
        NOW(),
        NOW()
    ) RETURNING id INTO v_new_usuario_id;
    
    RAISE NOTICE '✅ Usuário criado como PRIMEIRO USUÁRIO - ID: %', v_new_usuario_id;
    RAISE NOTICE '🚀 Triggers automáticos foram ativados!';
    
END $$;

-- ========================================================================
-- 6. VERIFICAR RESULTADOS DOS TRIGGERS AUTOMÁTICOS
-- ========================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
    v_config_count INTEGER;
    v_permission_count INTEGER;
    v_log_count INTEGER;
BEGIN
    -- Obter IDs
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'riltons@gmail.com';
    SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL OR v_empresa_id IS NULL THEN
        RETURN;
    END IF;
    
    RAISE NOTICE '📊 === VERIFICANDO RESULTADOS DOS TRIGGERS ===';
    
    -- Verificar configurações criadas
    SELECT COUNT(*) INTO v_config_count 
    FROM public.configuracoes_empresa 
    WHERE empresa_id = v_empresa_id;
    
    RAISE NOTICE '⚙️  Configurações criadas: % registros', v_config_count;
    
    -- Verificar permissões criadas
    SELECT COUNT(*) INTO v_permission_count 
    FROM public.permissoes_usuario pu
    JOIN public.usuarios_empresa ue ON ue.id = pu.usuario_empresa_id
    WHERE ue.user_id = v_user_id AND ue.empresa_id = v_empresa_id;
    
    RAISE NOTICE '🔐 Permissões criadas: % registros', v_permission_count;
    
    -- Verificar logs criados
    SELECT COUNT(*) INTO v_log_count 
    FROM public.logs_auditoria 
    WHERE empresa_id = v_empresa_id 
    AND usuario_id = v_user_id 
    AND acao = 'PRIMEIRO_USUARIO_CRIADO';
    
    RAISE NOTICE '📝 Logs de auditoria criados: % registros', v_log_count;
    
    -- Resumo final
    IF v_config_count >= 5 AND v_permission_count >= 10 AND v_log_count >= 1 THEN
        RAISE NOTICE '🎉 === SUCESSO! TODOS OS TRIGGERS FUNCIONARAM CORRETAMENTE ===';
        RAISE NOTICE '✅ riltons@gmail.com configurado como primeiro usuário';
        RAISE NOTICE '✅ Configurações da empresa criadas automaticamente';
        RAISE NOTICE '✅ Permissões completas atribuídas automaticamente';
        RAISE NOTICE '✅ Log de auditoria registrado automaticamente';
    ELSE
        RAISE NOTICE '⚠️  Alguns triggers podem não ter funcionado corretamente';
        RAISE NOTICE '   Verifique os dados manualmente';
    END IF;
    
END $$;

-- ========================================================================
-- 7. MOSTRAR DETALHES DOS DADOS CRIADOS
-- ========================================================================

-- Mostrar configurações criadas
SELECT 
    '📋 CONFIGURAÇÕES CRIADAS' as tipo,
    categoria,
    configuracoes
FROM public.configuracoes_empresa ce
JOIN public.empresas e ON e.id = ce.empresa_id
ORDER BY categoria;

-- Mostrar permissões criadas
SELECT 
    '🔐 PERMISSÕES CRIADAS' as tipo,
    pu.modulo,
    pu.permissoes
FROM public.permissoes_usuario pu
JOIN public.usuarios_empresa ue ON ue.id = pu.usuario_empresa_id
JOIN auth.users u ON u.id = ue.user_id
WHERE u.email = 'riltons@gmail.com'
ORDER BY pu.modulo;

-- Mostrar logs criados
SELECT 
    '📝 LOGS CRIADOS' as tipo,
    la.acao,
    la.recurso,
    la.detalhes,
    la.created_at
FROM public.logs_auditoria la
JOIN auth.users u ON u.id = la.usuario_id
WHERE u.email = 'riltons@gmail.com'
AND la.acao = 'PRIMEIRO_USUARIO_CRIADO'
ORDER BY la.created_at DESC;

-- Status final do usuário
SELECT 
    '👤 STATUS FINAL DO USUÁRIO' as tipo,
    ue.nome_completo,
    ue.email,
    ue.papel,
    ue.is_primeiro_usuario,
    ue.status,
    e.nome as empresa_nome
FROM public.usuarios_empresa ue
JOIN public.empresas e ON e.id = ue.empresa_id
JOIN auth.users u ON u.id = ue.user_id
WHERE u.email = 'riltons@gmail.com';