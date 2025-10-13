-- ===============================================================================
-- SCRIPT PARA ZERAR COMPLETAMENTE O BANCO DE DADOS
-- ===============================================================================
-- ATENÇÃO: Este script irá deletar TODOS os dados do sistema!
-- Execute apenas em ambiente de desenvolvimento/teste
-- ===============================================================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- ===============================================================================
-- 1. LIMPAR TABELAS RELACIONADAS A FUNCIONÁRIOS
-- ===============================================================================

-- Deletar funcionários do bar
DELETE FROM public.bar_employees;
TRUNCATE TABLE public.bar_employees RESTART IDENTITY CASCADE;

-- Deletar usuários de empresa
DELETE FROM public.usuarios_empresa;
TRUNCATE TABLE public.usuarios_empresa RESTART IDENTITY CASCADE;

-- Deletar permissões de usuário
DELETE FROM public.permissoes_usuario;
TRUNCATE TABLE public.permissoes_usuario RESTART IDENTITY CASCADE;

-- ===============================================================================
-- 2. LIMPAR TABELAS DE CONFIGURAÇÃO
-- ===============================================================================

-- Deletar configurações de empresa
DELETE FROM public.configuracoes_empresa;
TRUNCATE TABLE public.configuracoes_empresa RESTART IDENTITY CASCADE;

-- Deletar logs de auditoria
DELETE FROM public.logs_auditoria;
TRUNCATE TABLE public.logs_auditoria RESTART IDENTITY CASCADE;

-- ===============================================================================
-- 3. LIMPAR TABELAS DE EMPRESA
-- ===============================================================================

-- Deletar empresas
DELETE FROM public.empresas;
TRUNCATE TABLE public.empresas RESTART IDENTITY CASCADE;

-- ===============================================================================
-- 4. LIMPAR TABELAS DE PERFIL
-- ===============================================================================

-- Deletar profiles
DELETE FROM public.profiles;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- ===============================================================================
-- 5. LIMPAR TABELA AUTH (USUÁRIOS DE AUTENTICAÇÃO)
-- ===============================================================================
-- ATENÇÃO: Isso irá deletar TODOS os usuários do sistema

-- Deletar refresh tokens
DELETE FROM auth.refresh_tokens;

-- Deletar sessões
DELETE FROM auth.sessions;

-- Deletar identidades
DELETE FROM auth.identities;

-- Deletar usuários do auth
DELETE FROM auth.users;

-- Resetar sequências da tabela auth
ALTER SEQUENCE IF EXISTS auth.refresh_tokens_id_seq RESTART WITH 1;

-- ===============================================================================
-- 6. LIMPAR OUTRAS TABELAS RELACIONADAS (se existirem)
-- ===============================================================================

-- Deletar roles de usuário (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DELETE FROM public.user_roles;
        TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- Deletar clientes (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DELETE FROM public.customers;
        TRUNCATE TABLE public.customers RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- Deletar pedidos (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DELETE FROM public.orders;
        TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- Deletar produtos (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        DELETE FROM public.products;
        TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- ===============================================================================
-- 7. REABILITAR VERIFICAÇÕES DE CHAVE ESTRANGEIRA
-- ===============================================================================

SET session_replication_role = DEFAULT;

-- ===============================================================================
-- 8. VERIFICAÇÃO FINAL
-- ===============================================================================

-- Contar registros remanescentes
DO $$
DECLARE
    r RECORD;
    table_count INTEGER;
    total_records INTEGER := 0;
BEGIN
    RAISE NOTICE '===============================================================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL - CONTAGEM DE REGISTROS APÓS LIMPEZA';
    RAISE NOTICE '===============================================================================';
    
    -- Verificar tabelas public
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I.%I', r.schemaname, r.tablename) INTO table_count;
        total_records := total_records + table_count;
        
        IF table_count > 0 THEN
            RAISE NOTICE 'ATENÇÃO: %.% ainda tem % registros', r.schemaname, r.tablename, table_count;
        ELSE
            RAISE NOTICE 'OK: %.% está vazia', r.schemaname, r.tablename;
        END IF;
    END LOOP;
    
    -- Verificar auth.users
    SELECT COUNT(*) INTO table_count FROM auth.users;
    total_records := total_records + table_count;
    
    IF table_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: auth.users ainda tem % usuários', table_count;
    ELSE
        RAISE NOTICE 'OK: auth.users está vazia';
    END IF;
    
    RAISE NOTICE '===============================================================================';
    IF total_records = 0 THEN
        RAISE NOTICE '✅ SUCESSO: Banco de dados completamente zerado!';
        RAISE NOTICE '✅ Total de registros: %', total_records;
    ELSE
        RAISE NOTICE '⚠️  ATENÇÃO: Ainda existem % registros no banco', total_records;
    END IF;
    RAISE NOTICE '===============================================================================';
END $$;

-- ===============================================================================
-- 9. RESETAR SEQUÊNCIAS AUTOMÁTICAS
-- ===============================================================================

-- Resetar sequências para começar do 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_schema, sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I.%I RESTART WITH 1', r.sequence_schema, r.sequence_name);
        RAISE NOTICE 'Sequência resetada: %.%', r.sequence_schema, r.sequence_name;
    END LOOP;
END $$;

-- ===============================================================================
-- 10. MENSAGEM FINAL
-- ===============================================================================

DO $$
BEGIN
    RAISE NOTICE ' ';
    RAISE NOTICE '🗑️  LIMPEZA COMPLETA EXECUTADA COM SUCESSO!';
    RAISE NOTICE ' ';
    RAISE NOTICE '📋 O que foi deletado:';
    RAISE NOTICE '   • Todos os funcionários (bar_employees)';
    RAISE NOTICE '   • Todos os usuários de empresa (usuarios_empresa)';
    RAISE NOTICE '   • Todas as permissões (permissoes_usuario)';
    RAISE NOTICE '   • Todas as empresas (empresas)';
    RAISE NOTICE '   • Todos os perfis (profiles)';
    RAISE NOTICE '   • Todos os usuários Auth (auth.users)';
    RAISE NOTICE '   • Todas as sessões e tokens';
    RAISE NOTICE '   • Todos os logs de auditoria';
    RAISE NOTICE '   • Todas as configurações';
    RAISE NOTICE ' ';
    RAISE NOTICE '🚀 Agora você pode:';
    RAISE NOTICE '   1. Registrar novas empresas';
    RAISE NOTICE '   2. Criar novos administradores';
    RAISE NOTICE '   3. Testar o isolamento entre empresas';
    RAISE NOTICE '   4. Verificar se o problema foi resolvido';
    RAISE NOTICE ' ';
    RAISE NOTICE '⚠️  LEMBRE-SE: Execute os testes de segurança após recriar os dados!';
    RAISE NOTICE ' ';
END $$;