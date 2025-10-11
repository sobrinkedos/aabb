-- ========================================
-- CORREÇÃO URGENTE DO DEADLOCK RLS
-- ========================================
-- PROBLEMA: get_user_empresa_id() não consegue acessar usuarios_empresa
-- porque a tabela está protegida por RLS que usa a própria função

-- ========================================
-- ETAPA 1: CORRIGIR A FUNÇÃO get_user_empresa_id
-- ========================================

-- Recriar a função com SECURITY DEFINER para bypassar RLS
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  empresa_uuid UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar empresa_id diretamente (SECURITY DEFINER bypassa RLS)
  SELECT empresa_id INTO empresa_uuid
  FROM usuarios_empresa 
  WHERE user_id = auth.uid()
    AND status = 'ativo'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN empresa_uuid;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar NULL
    RETURN NULL;
END;
$$;

-- ========================================
-- ETAPA 2: POLÍTICAS RLS SIMPLIFICADAS E SEGURAS
-- ========================================

-- USUARIOS_EMPRESA: Remover políticas conflitantes
DROP POLICY IF EXISTS "Usuários podem ver colegas da mesma empresa" ON usuarios_empresa;
DROP POLICY IF EXISTS "Administradores podem gerenciar usuários da empresa" ON usuarios_empresa;
DROP POLICY IF EXISTS "Usuários podem ver baseado na hierarquia" ON usuarios_empresa;
DROP POLICY IF EXISTS "Inserção baseada em hierarquia" ON usuarios_empresa;
DROP POLICY IF EXISTS "Atualização baseada em hierarquia" ON usuarios_empresa;
DROP POLICY IF EXISTS "Exclusão baseada em hierarquia" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_select_policy" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_update_policy" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_registro_publico" ON usuarios_empresa;

-- Política simples para SELECT (permite ver usuários da mesma empresa)
CREATE POLICY "usuarios_empresa_select_simple" ON usuarios_empresa
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Próprio usuário pode se ver
      user_id = auth.uid() OR
      -- Usuários da mesma empresa (função já corrigida)
      empresa_id = get_user_empresa_id() OR
      -- Service role tem acesso total
      current_setting('role') = 'service_role'
    )
  );

-- Política para INSERT (registro e administração)
CREATE POLICY "usuarios_empresa_insert_simple" ON usuarios_empresa
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Inserção própria durante registro
      user_id = auth.uid() OR
      -- Admins podem inserir na mesma empresa
      (empresa_id = get_user_empresa_id() AND 
       EXISTS (SELECT 1 FROM usuarios_empresa WHERE user_id = auth.uid() AND papel IN ('SUPER_ADMIN', 'ADMIN'))) OR
      -- Service role tem acesso total
      current_setting('role') = 'service_role'
    )
  );

-- Política para UPDATE (administração)
CREATE POLICY "usuarios_empresa_update_simple" ON usuarios_empresa
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Próprio usuário pode se atualizar (limitado)
      user_id = auth.uid() OR
      -- Admins podem atualizar na mesma empresa
      (empresa_id = get_user_empresa_id() AND 
       EXISTS (SELECT 1 FROM usuarios_empresa WHERE user_id = auth.uid() AND papel IN ('SUPER_ADMIN', 'ADMIN'))) OR
      -- Service role tem acesso total
      current_setting('role') = 'service_role'
    )
  );

-- ========================================
-- ETAPA 3: PERMISSOES_USUARIO SIMPLIFICADA
-- ========================================

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Usuários podem ver permissões da mesma empresa" ON permissoes_usuario;
DROP POLICY IF EXISTS "Administradores podem gerenciar permissões da empresa" ON permissoes_usuario;
DROP POLICY IF EXISTS "Permissões baseadas em hierarquia" ON permissoes_usuario;

-- Política simples para permissões
CREATE POLICY "permissoes_usuario_simple" ON permissoes_usuario
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      -- Usuário pode ver/editar suas próprias permissões
      EXISTS (SELECT 1 FROM usuarios_empresa WHERE id = permissoes_usuario.usuario_empresa_id AND user_id = auth.uid()) OR
      -- Admins podem gerenciar permissões da empresa
      EXISTS (
        SELECT 1 FROM usuarios_empresa ue1, usuarios_empresa ue2 
        WHERE ue1.user_id = auth.uid() 
        AND ue1.papel IN ('SUPER_ADMIN', 'ADMIN')
        AND ue2.id = permissoes_usuario.usuario_empresa_id
        AND ue1.empresa_id = ue2.empresa_id
      ) OR
      -- Service role tem acesso total
      current_setting('role') = 'service_role'
    )
  );

-- ========================================
-- ETAPA 4: EMPRESAS SIMPLIFICADA
-- ========================================

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Usuários podem ver apenas sua empresa" ON empresas;
DROP POLICY IF EXISTS "Administradores podem atualizar sua empresa" ON empresas;
DROP POLICY IF EXISTS "Administradores podem ver dados atualizados da empresa" ON empresas;
DROP POLICY IF EXISTS "empresas_registro_publico" ON empresas;

-- Política simples para empresas
CREATE POLICY "empresas_access_simple" ON empresas
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      -- Usuários podem ver/editar sua empresa
      id = get_user_empresa_id() OR
      -- Service role tem acesso total
      current_setting('role') = 'service_role'
    )
  );

-- ========================================
-- ETAPA 5: LOGS DE VALIDAÇÃO
-- ========================================

-- Função para testar se a correção funcionou
CREATE OR REPLACE FUNCTION test_rls_fix()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
  empresa_id UUID;
  test_result TEXT;
BEGIN
  -- Verificar se consegue contar usuários
  SELECT COUNT(*) INTO user_count FROM usuarios_empresa;
  
  -- Verificar se a função get_user_empresa_id funciona
  SELECT get_user_empresa_id() INTO empresa_id;
  
  test_result := format(
    'RLS FIX TEST RESULTS:
    - Total users accessible: %s
    - get_user_empresa_id() returns: %s
    - Function working: %s',
    COALESCE(user_count::text, 'ERROR'),
    COALESCE(empresa_id::text, 'NULL'),
    CASE WHEN empresa_id IS NOT NULL THEN 'YES' ELSE 'NO' END
  );
  
  RETURN test_result;
END;
$$;

-- ========================================
-- INFORMAÇÕES DE EXECUÇÃO
-- ========================================

-- Para executar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para SQL Editor
-- 3. Cole e execute este script completo
-- 4. Teste com: SELECT test_rls_fix();

-- ========================================
-- ROLLBACK EM CASO DE PROBLEMAS
-- ========================================

-- Se algo der errado, desabilite RLS temporariamente:
-- ALTER TABLE usuarios_empresa DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE permissoes_usuario DISABLE ROW LEVEL SECURITY;  
-- ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- Depois reabilite e ajuste as políticas conforme necessário.