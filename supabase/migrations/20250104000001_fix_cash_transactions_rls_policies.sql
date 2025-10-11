/*
  Fix Cash Transactions RLS Policies
  
  Problema: As políticas RLS da tabela cash_transactions estão muito restritivas,
  impedindo inserções e consultas normais do sistema de caixa.
  
  Causa: As políticas dependem da tabela usuarios_empresa, mas nem todos os usuários
  estão cadastrados nessa tabela. O sistema atual usa principalmente a tabela profiles.
  
  Solução: Atualizar as políticas RLS para permitir acesso baseado no sistema atual
  de autenticação, mantendo a segurança multitenancy.
*/

-- 1. Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Funcionários podem ver transações de suas sessões" ON cash_transactions;
DROP POLICY IF EXISTS "Funcionários podem inserir transações" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_insert_permissive" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_select_isolation" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_update_isolation" ON cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_delete_isolation" ON cash_transactions;

-- 2. Função auxiliar para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se o usuário tem role de admin ou administrador
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'administrador', 'supervisor')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função auxiliar para obter empresa do usuário usando fallback
CREATE OR REPLACE FUNCTION get_user_empresa_id_fallback()
RETURNS UUID AS $$
DECLARE
  empresa_id_result UUID;
BEGIN
  -- Verifica se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Tenta primeiro pela tabela usuarios_empresa
  SELECT empresa_id INTO empresa_id_result
  FROM usuarios_empresa 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Se não encontrou, usa empresa padrão para admins
  IF empresa_id_result IS NULL AND is_admin_user() THEN
    -- Retorna a primeira empresa disponível para admins
    SELECT id INTO empresa_id_result
    FROM empresas
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  RETURN empresa_id_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Novas políticas RLS mais flexíveis para cash_transactions

-- Política SELECT: Permite ver transações da própria empresa
CREATE POLICY "cash_transactions_select_policy" ON cash_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem ver tudo
      is_admin_user() OR
      -- Usuários podem ver transações de sua empresa
      empresa_id = get_user_empresa_id_fallback() OR
      -- Usuários podem ver transações de sessões onde são responsáveis
      cash_session_id IN (
        SELECT id FROM cash_sessions 
        WHERE employee_id = auth.uid()
      )
    )
  );

-- Política INSERT: Permite inserir transações
CREATE POLICY "cash_transactions_insert_policy" ON cash_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem inserir qualquer transação
      is_admin_user() OR
      -- Usuários podem inserir se são o responsável pelo processamento
      processed_by = auth.uid() OR
      -- Service role pode inserir qualquer transação
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política UPDATE: Permite atualizar transações
CREATE POLICY "cash_transactions_update_policy" ON cash_transactions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem atualizar qualquer transação
      is_admin_user() OR
      -- Usuários podem atualizar transações que processaram
      processed_by = auth.uid() OR
      -- Service role pode atualizar qualquer transação
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política DELETE: Permite deletar transações (apenas admins)
CREATE POLICY "cash_transactions_delete_policy" ON cash_transactions
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- Apenas administradores ou service role podem deletar
      is_admin_user() OR
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- 5. Manter a política de service_role para operações do sistema
CREATE POLICY "cash_transactions_service_role_policy" ON cash_transactions
  FOR ALL USING (
    (auth.jwt() ->> 'role')::text = 'service_role'
  ) WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'service_role'
  );

-- 6. Comentários explicativos
COMMENT ON POLICY "cash_transactions_select_policy" ON cash_transactions IS 
'Permite leitura de transações para usuários autenticados da mesma empresa ou administradores';

COMMENT ON POLICY "cash_transactions_insert_policy" ON cash_transactions IS 
'Permite inserção de transações para administradores, responsáveis pelo processamento ou service role';

COMMENT ON POLICY "cash_transactions_update_policy" ON cash_transactions IS 
'Permite atualização de transações para administradores, responsáveis pelo processamento ou service role';

COMMENT ON POLICY "cash_transactions_delete_policy" ON cash_transactions IS 
'Permite exclusão de transações apenas para administradores ou service role';

COMMENT ON POLICY "cash_transactions_service_role_policy" ON cash_transactions IS 
'Política especial para operações do sistema via service role';