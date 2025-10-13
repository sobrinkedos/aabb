/*
  # CORREÇÃO URGENTE: Usuários Sem Permissões de Acesso
  
  Este script corrige a situação crítica de usuários sem permissões no sistema,
  conforme reportado pelo usuário Teste20.
  
  MEMÓRIA DO PROJETO: É obrigatório garantir que durante a criação de qualquer usuário 
  sejam inseridos registros válidos na tabela `permissoes_usuario`.
*/

-- ========================================================================
-- 1. DIAGNÓSTICO: IDENTIFICAR USUÁRIOS SEM PERMISSÕES
-- ========================================================================

DO $$
DECLARE
    v_total_usuarios INTEGER;
    v_usuarios_sem_permissoes INTEGER;
    v_usuarios_com_permissoes INTEGER;
BEGIN
    RAISE NOTICE '🔍 === DIAGNÓSTICO DE USUÁRIOS SEM PERMISSÕES ===';
    
    -- Total de usuários com acesso ao sistema
    SELECT COUNT(*) INTO v_total_usuarios
    FROM usuarios_empresa ue
    WHERE ue.tem_acesso_sistema = true
    AND ue.user_id IS NOT NULL
    AND ue.status = 'ativo';
    
    -- Usuários SEM permissões
    SELECT COUNT(*) INTO v_usuarios_sem_permissoes
    FROM usuarios_empresa ue
    LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
    WHERE ue.tem_acesso_sistema = true
    AND ue.user_id IS NOT NULL
    AND ue.status = 'ativo'
    AND pu.id IS NULL;
    
    -- Usuários COM permissões
    v_usuarios_com_permissoes := v_total_usuarios - v_usuarios_sem_permissoes;
    
    RAISE NOTICE '📊 RESULTADOS DO DIAGNÓSTICO:';
    RAISE NOTICE '   👥 Total de usuários: %', v_total_usuarios;
    RAISE NOTICE '   ✅ Com permissões: %', v_usuarios_com_permissoes;
    RAISE NOTICE '   ❌ SEM permissões: %', v_usuarios_sem_permissoes;
    
    IF v_usuarios_sem_permissoes > 0 THEN
        RAISE NOTICE '🚨 PROBLEMA CRÍTICO: % usuários sem permissões!', v_usuarios_sem_permissoes;
    ELSE
        RAISE NOTICE '✅ Todos os usuários têm permissões configuradas';
    END IF;
    
END $$;

-- ========================================================================
-- 2. LISTAR USUÁRIOS SEM PERMISSÕES (PARA DEBUG)
-- ========================================================================

RAISE NOTICE '📋 === USUÁRIOS SEM PERMISSÕES ===';

SELECT 
    '🔍 USUÁRIO SEM PERMISSÕES' as tipo,
    ue.id as usuario_empresa_id,
    ue.nome_completo,
    ue.email,
    ue.cargo,
    ue.tipo_usuario,
    ue.papel,
    ue.created_at,
    COUNT(pu.id) as total_permissoes
FROM usuarios_empresa ue
LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
WHERE ue.tem_acesso_sistema = true
AND ue.user_id IS NOT NULL
AND ue.status = 'ativo'
GROUP BY ue.id, ue.nome_completo, ue.email, ue.cargo, ue.tipo_usuario, ue.papel, ue.created_at
HAVING COUNT(pu.id) = 0
ORDER BY ue.created_at DESC;

-- ========================================================================
-- 3. CORREÇÃO: CRIAR PERMISSÕES BÁSICAS PARA FUNCIONÁRIOS
-- ========================================================================

DO $$
DECLARE
    v_usuarios_corrigidos INTEGER := 0;
    v_permissoes_criadas INTEGER := 0;
    funcionario_record RECORD;
BEGIN
    RAISE NOTICE '🔧 === CRIANDO PERMISSÕES BÁSICAS PARA FUNCIONÁRIOS ===';
    
    -- Para cada funcionário sem permissões
    FOR funcionario_record IN 
        SELECT ue.id, ue.nome_completo, ue.email, ue.tipo_usuario, ue.papel
        FROM usuarios_empresa ue
        LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
        WHERE ue.tem_acesso_sistema = true
        AND ue.user_id IS NOT NULL
        AND ue.status = 'ativo'
        AND pu.id IS NULL
    LOOP
        RAISE NOTICE '👤 Corrigindo usuário: % (ID: %)', funcionario_record.nome_completo, funcionario_record.id;
        
        -- Determinar permissões baseadas no perfil
        IF funcionario_record.tipo_usuario = 'administrador' OR funcionario_record.papel IN ('SUPER_ADMIN', 'ADMIN') THEN
            -- Administradores: permissões completas
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes)
            SELECT 
                funcionario_record.id,
                modulo_nome,
                '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'::jsonb
            FROM (
                VALUES 
                    ('dashboard'), ('monitor_bar'), ('atendimento_bar'), 
                    ('monitor_cozinha'), ('gestao_caixa'), ('clientes'), 
                    ('funcionarios'), ('socios'), ('configuracoes'), ('relatorios')
            ) AS modulos(modulo_nome);
            
            v_permissoes_criadas := v_permissoes_criadas + 10;
            RAISE NOTICE '   ✅ Permissões de ADMINISTRADOR criadas (10 módulos)';
            
        ELSE
            -- Funcionários: permissões básicas conforme especificação
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes)
            SELECT 
                funcionario_record.id,
                modulo_nome,
                CASE 
                    WHEN modulo_nome = 'dashboard' THEN 
                        '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'atendimento_bar' THEN 
                        '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'gestao_caixa' THEN 
                        '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'clientes' THEN 
                        '{"visualizar": true, "criar": true, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'monitor_cozinha' THEN 
                        '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    ELSE 
                        '{"visualizar": false, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                END as permissoes
            FROM (
                VALUES 
                    ('dashboard'), ('atendimento_bar'), ('gestao_caixa'), 
                    ('clientes'), ('monitor_cozinha')
            ) AS modulos(modulo_nome);
            
            v_permissoes_criadas := v_permissoes_criadas + 5;
            RAISE NOTICE '   ✅ Permissões de FUNCIONÁRIO criadas (5 módulos básicos)';
        END IF;
        
        v_usuarios_corrigidos := v_usuarios_corrigidos + 1;
    END LOOP;
    
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA:';
    RAISE NOTICE '   👥 Usuários corrigidos: %', v_usuarios_corrigidos;
    RAISE NOTICE '   🔐 Permissões criadas: %', v_permissoes_criadas;
    
END $$;

-- ========================================================================
-- 4. CRIAR/ATUALIZAR TRIGGER PARA NOVOS USUÁRIOS
-- ========================================================================

RAISE NOTICE '🔧 === CRIANDO TRIGGER PARA NOVOS USUÁRIOS ===';

-- Função para criar permissões automaticamente
CREATE OR REPLACE FUNCTION public.criar_permissoes_automaticas()
RETURNS TRIGGER AS $
BEGIN
    -- Só executar para usuários com acesso ao sistema
    IF NEW.tem_acesso_sistema = true AND NEW.user_id IS NOT NULL THEN
        
        -- Se é primeiro usuário (SUPER_ADMIN), criar permissões completas
        IF NEW.is_primeiro_usuario = true OR NEW.papel = 'SUPER_ADMIN' THEN
            INSERT INTO public.permissoes_usuario (usuario_empresa_id, modulo, permissoes)
            SELECT 
                NEW.id,
                modulo,
                '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'::jsonb
            FROM (
                VALUES 
                    ('dashboard'), ('monitor_bar'), ('atendimento_bar'), 
                    ('monitor_cozinha'), ('gestao_caixa'), ('clientes'), 
                    ('funcionarios'), ('socios'), ('configuracoes'), ('relatorios')
            ) AS modulos(modulo)
            ON CONFLICT (usuario_empresa_id, modulo) DO NOTHING;
            
        -- Se é administrador (mas não primeiro usuário)
        ELSIF NEW.tipo_usuario = 'administrador' OR NEW.papel = 'ADMIN' THEN
            INSERT INTO public.permissoes_usuario (usuario_empresa_id, modulo, permissoes)
            SELECT 
                NEW.id,
                modulo,
                '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'::jsonb
            FROM (
                VALUES 
                    ('dashboard'), ('monitor_bar'), ('atendimento_bar'), 
                    ('monitor_cozinha'), ('gestao_caixa'), ('clientes'), 
                    ('funcionarios'), ('socios'), ('configuracoes'), ('relatorios')
            ) AS modulos(modulo)
            ON CONFLICT (usuario_empresa_id, modulo) DO NOTHING;
            
        -- Para funcionários: permissões básicas limitadas (conforme memória do projeto)
        ELSE
            INSERT INTO public.permissoes_usuario (usuario_empresa_id, modulo, permissoes)
            SELECT 
                NEW.id,
                modulo_nome,
                CASE 
                    WHEN modulo_nome = 'dashboard' THEN 
                        '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'atendimento_bar' THEN 
                        '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'gestao_caixa' THEN 
                        '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'clientes' THEN 
                        '{"visualizar": true, "criar": true, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    WHEN modulo_nome = 'monitor_cozinha' THEN 
                        '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                    ELSE 
                        '{"visualizar": false, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
                END as permissoes
            FROM (
                VALUES 
                    ('dashboard'), ('atendimento_bar'), ('gestao_caixa'), 
                    ('clientes'), ('monitor_cozinha')
            ) AS modulos(modulo_nome)
            ON CONFLICT (usuario_empresa_id, modulo) DO NOTHING;
        END IF;
        
        -- Log da criação de permissões
        INSERT INTO public.logs_auditoria (empresa_id, usuario_id, acao, recurso, detalhes)
        VALUES (
            NEW.empresa_id,
            NEW.user_id,
            'PERMISSOES_CRIADAS_AUTOMATICAMENTE',
            'permissoes_usuario',
            jsonb_build_object(
                'usuario_empresa_id', NEW.id, 
                'email', NEW.email,
                'tipo_usuario', NEW.tipo_usuario,
                'papel', NEW.papel
            )
        );
        
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Criar o trigger (removendo se já existir)
DROP TRIGGER IF EXISTS trigger_criar_permissoes_automaticas ON public.usuarios_empresa;
CREATE TRIGGER trigger_criar_permissoes_automaticas
    AFTER INSERT ON public.usuarios_empresa
    FOR EACH ROW 
    EXECUTE FUNCTION public.criar_permissoes_automaticas();

RAISE NOTICE '✅ Trigger criado: trigger_criar_permissoes_automaticas';

-- ========================================================================
-- 5. VERIFICAÇÃO FINAL
-- ========================================================================

DO $$
DECLARE
    v_usuarios_restantes INTEGER;
    v_total_permissoes INTEGER;
BEGIN
    RAISE NOTICE '📊 === VERIFICAÇÃO FINAL ===';
    
    -- Verificar se ainda há usuários sem permissões
    SELECT COUNT(*) INTO v_usuarios_restantes
    FROM usuarios_empresa ue
    LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
    WHERE ue.tem_acesso_sistema = true
    AND ue.user_id IS NOT NULL
    AND ue.status = 'ativo'
    AND pu.id IS NULL;
    
    -- Total de permissões no sistema
    SELECT COUNT(*) INTO v_total_permissoes
    FROM permissoes_usuario;
    
    RAISE NOTICE '📈 RESULTADOS:';
    RAISE NOTICE '   ❌ Usuários ainda sem permissões: %', v_usuarios_restantes;
    RAISE NOTICE '   🔐 Total de permissões no sistema: %', v_total_permissoes;
    
    IF v_usuarios_restantes = 0 THEN
        RAISE NOTICE '🎉 ✅ SUCESSO! Todos os usuários agora têm permissões!';
        RAISE NOTICE '🛡️  ✅ Trigger criado para novos usuários!';
        RAISE NOTICE '📋 ✅ Conformidade com especificação do projeto!';
    ELSE
        RAISE NOTICE '⚠️  Ainda há usuários sem permissões. Verifique manualmente.';
    END IF;
    
END $$;

-- ========================================================================
-- 6. MOSTRAR PERMISSÕES CRIADAS PARA TESTE20 (SE EXISTIR)
-- ========================================================================

SELECT 
    '🔍 PERMISSÕES DO TESTE20' as tipo,
    ue.nome_completo,
    ue.email,
    pu.modulo,
    pu.permissoes
FROM usuarios_empresa ue
JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
WHERE ue.email ILIKE '%teste20%' 
   OR ue.nome_completo ILIKE '%teste20%'
ORDER BY pu.modulo;

RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA! Usuários podem agora acessar o sistema com permissões adequadas.';