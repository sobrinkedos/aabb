-- ===============================================================================
-- SCRIPT SQL PARA ZERAR BANCO DE DADOS - PAINEL SUPABASE
-- ===============================================================================
-- ATENÇÃO: Este script irá deletar TODOS os dados do sistema!
-- Execute apenas em ambiente de desenvolvimento/teste
-- ===============================================================================

-- 1. LIMPAR TABELAS EM ORDEM CORRETA (respeitando dependências de FK)
-- ===============================================================================

-- Primeiro: Limpar tabelas que referenciam outras (dependentes)
-- ===============================================================================

-- Limpar permissões (referencia usuarios_empresa)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissoes_usuario') THEN
        DELETE FROM public.permissoes_usuario;
    END IF;
END $$;

-- Limpar pedidos (se existir - referencia customers, products)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DELETE FROM public.orders;
    END IF;
END $$;

-- Limpar funcionários bar (referencia profiles)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bar_employees') THEN
        DELETE FROM public.bar_employees;
    END IF;
END $$;

-- Limpar employees (referencia profiles - ESTE ESTAVA CAUSANDO O ERRO)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        DELETE FROM public.employees;
    END IF;
END $$;

-- Limpar usuários de empresa (referencia empresas e auth.users)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_empresa') THEN
        DELETE FROM public.usuarios_empresa;
    END IF;
END $$;

-- Limpar user_roles (se existir)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DELETE FROM public.user_roles;
    END IF;
END $$;

-- Limpar configurações (referencia empresas)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'configuracoes_empresa') THEN
        DELETE FROM public.configuracoes_empresa;
    END IF;
END $$;

-- Limpar logs (referencia empresas)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria') THEN
        DELETE FROM public.logs_auditoria;
    END IF;
END $$;

-- Segundo: Limpar tabelas base (que são referenciadas)
-- ===============================================================================

-- Limpar customers
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DELETE FROM public.customers;
    END IF;
END $$;

-- Limpar products
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        DELETE FROM public.products;
    END IF;
END $$;

-- Limpar profiles (era referenciado por employees)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DELETE FROM public.profiles;
    END IF;
END $$;

-- Limpar empresas (por último das tabelas principais)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas') THEN
        DELETE FROM public.empresas;
    END IF;
END $$;

-- ===============================================================================
-- 2. LIMPAR TABELA AUTH (REQUER SERVICE ROLE)
-- ===============================================================================

-- Limpar tokens de refresh
DELETE FROM auth.refresh_tokens;

-- Limpar sessões
DELETE FROM auth.sessions;

-- Limpar identidades
DELETE FROM auth.identities;

-- Limpar usuários
DELETE FROM auth.users;

-- ===============================================================================
-- 3. RESETAR SEQUÊNCIAS PARA COMEÇAR DO 1
-- ===============================================================================

-- Resetar sequences das tabelas public
SELECT setval(pg_get_serial_sequence('public.empresas', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas');
SELECT setval(pg_get_serial_sequence('public.usuarios_empresa', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_empresa');
SELECT setval(pg_get_serial_sequence('public.bar_employees', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bar_employees');
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');
SELECT setval(pg_get_serial_sequence('public.permissoes_usuario', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissoes_usuario');
SELECT setval(pg_get_serial_sequence('public.configuracoes_empresa', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'configuracoes_empresa');
SELECT setval(pg_get_serial_sequence('public.logs_auditoria', 'id'), 1, false) WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria');

-- ===============================================================================
-- 4. VERIFICAÇÃO FINAL - CONTAR REGISTROS RESTANTES
-- ===============================================================================

SELECT 
    'empresas' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.empresas
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas')

UNION ALL

SELECT 
    'usuarios_empresa' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.usuarios_empresa
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_empresa')

UNION ALL

SELECT 
    'bar_employees' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.bar_employees
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bar_employees')

UNION ALL

SELECT 
    'employees' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.employees
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')

UNION ALL

SELECT 
    'profiles' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.profiles
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')

UNION ALL

SELECT 
    'permissoes_usuario' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.permissoes_usuario
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissoes_usuario')

UNION ALL

SELECT 
    'configuracoes_empresa' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.configuracoes_empresa
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'configuracoes_empresa')

UNION ALL

SELECT 
    'logs_auditoria' as tabela, 
    COUNT(*) as registros_restantes 
FROM public.logs_auditoria
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria')

UNION ALL

SELECT 
    'auth.users' as tabela, 
    COUNT(*) as registros_restantes 
FROM auth.users

ORDER BY tabela;