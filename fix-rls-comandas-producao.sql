-- ============================================================================
-- FIX RLS POLÍTICAS - TABELA COMANDAS (PRODUÇÃO)
-- ============================================================================
-- Este script corrige as políticas RLS da tabela comandas para permitir
-- que usuários autenticados possam criar, ler, atualizar e deletar comandas
-- ============================================================================

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar comandas" ON comandas;
DROP POLICY IF EXISTS "Usuários autenticados podem criar comandas" ON comandas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar comandas" ON comandas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar comandas" ON comandas;
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON comandas;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON comandas;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON comandas;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON comandas;

-- 2. Garantir que RLS está habilitado
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas permissivas para usuários autenticados
-- SELECT: Permitir visualizar todas as comandas
CREATE POLICY "comandas_select_policy"
ON comandas
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Permitir criar comandas
CREATE POLICY "comandas_insert_policy"
ON comandas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir atualizar comandas
CREATE POLICY "comandas_update_policy"
ON comandas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Permitir deletar comandas
CREATE POLICY "comandas_delete_policy"
ON comandas
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comandas'
ORDER BY policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'comandas';

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
-- 1. Acesse o Supabase Dashboard de PRODUÇÃO
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- 4. Verifique os resultados das queries de verificação
-- 5. Teste criar uma comanda novamente
-- ============================================================================
