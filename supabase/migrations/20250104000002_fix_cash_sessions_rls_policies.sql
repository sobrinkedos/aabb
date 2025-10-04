/*
  Fix Cash Sessions RLS Policies
  
  Problema: As políticas RLS da tabela cash_sessions também estão muito restritivas,
  usando funções que podem não existir ou estar causando problemas.
  
  Solução: Atualizar as políticas RLS para serem consistentes com as da tabela 
  cash_transactions e permitir operações normais do sistema de caixa.
*/

-- 1. Remover políticas antigas da tabela cash_sessions
DROP POLICY IF EXISTS "Funcionários podem ver suas próprias sessões" ON cash_sessions;
DROP POLICY IF EXISTS "Funcionários podem criar suas sessões" ON cash_sessions;
DROP POLICY IF EXISTS "Funcionários podem atualizar suas sessões" ON cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_strict_isolation" ON cash_sessions;

-- 2. Novas políticas RLS para cash_sessions

-- Política SELECT: Permite ver sessões da própria empresa ou do próprio usuário
CREATE POLICY "cash_sessions_select_policy" ON cash_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem ver todas as sessões
      is_admin_user() OR
      -- Usuários podem ver suas próprias sessões
      employee_id = auth.uid() OR
      -- Usuários podem ver sessões de sua empresa
      empresa_id = get_user_empresa_id_fallback() OR
      -- Service role pode ver tudo
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política INSERT: Permite criar sessões
CREATE POLICY "cash_sessions_insert_policy" ON cash_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem criar qualquer sessão
      is_admin_user() OR
      -- Usuários podem criar suas próprias sessões
      employee_id = auth.uid() OR
      -- Service role pode criar qualquer sessão
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política UPDATE: Permite atualizar sessões
CREATE POLICY "cash_sessions_update_policy" ON cash_sessions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem atualizar qualquer sessão
      is_admin_user() OR
      -- Usuários podem atualizar suas próprias sessões
      employee_id = auth.uid() OR
      -- Service role pode atualizar qualquer sessão
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem atualizar qualquer sessão
      is_admin_user() OR
      -- Usuários podem atualizar suas próprias sessões
      employee_id = auth.uid() OR
      -- Service role pode atualizar qualquer sessão
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política DELETE: Permite deletar sessões (apenas admins)
CREATE POLICY "cash_sessions_delete_policy" ON cash_sessions
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- Apenas administradores ou service role podem deletar
      is_admin_user() OR
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- 3. Comentários explicativos
COMMENT ON POLICY "cash_sessions_select_policy" ON cash_sessions IS 
'Permite leitura de sessões para usuários autenticados da mesma empresa, donos da sessão ou administradores';

COMMENT ON POLICY "cash_sessions_insert_policy" ON cash_sessions IS 
'Permite criação de sessões para administradores, donos da sessão ou service role';

COMMENT ON POLICY "cash_sessions_update_policy" ON cash_sessions IS 
'Permite atualização de sessões para administradores, donos da sessão ou service role';

COMMENT ON POLICY "cash_sessions_delete_policy" ON cash_sessions IS 
'Permite exclusão de sessões apenas para administradores ou service role';