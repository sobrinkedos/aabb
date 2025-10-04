/*
  Fix Menu Items RLS Policies
  
  Problema: As políticas RLS da tabela menu_items estão muito restritivas,
  impedindo inserções normais de itens do menu.
  
  Causa: As políticas dependem de funções que podem estar falhando ou
  não funcionando corretamente com o sistema atual de autenticação.
  
  Solução: Atualizar as políticas RLS para usar as mesmas funções auxiliares
  criadas para as tabelas de caixa, mantendo a segurança multitenancy.
*/

-- 1. Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "menu_items_empresa_isolation" ON menu_items;
DROP POLICY IF EXISTS "menu_items_optimized_access" ON menu_items;

-- 2. Novas políticas RLS flexíveis para menu_items

-- Política SELECT: Permite ver itens do menu da própria empresa
CREATE POLICY "menu_items_select_policy" ON menu_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem ver todos os itens
      is_admin_user() OR
      -- Usuários podem ver itens de sua empresa
      empresa_id = get_user_empresa_id_fallback() OR
      -- Service role pode ver tudo
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política INSERT: Permite inserir itens do menu
CREATE POLICY "menu_items_insert_policy" ON menu_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem inserir qualquer item
      is_admin_user() OR
      -- Usuários podem inserir se o empresa_id corresponde ao deles
      empresa_id = get_user_empresa_id_fallback() OR
      -- Service role pode inserir qualquer item
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política UPDATE: Permite atualizar itens do menu
CREATE POLICY "menu_items_update_policy" ON menu_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem atualizar qualquer item
      is_admin_user() OR
      -- Usuários podem atualizar itens de sua empresa
      empresa_id = get_user_empresa_id_fallback() OR
      -- Service role pode atualizar qualquer item
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Administradores podem atualizar qualquer item
      is_admin_user() OR
      -- Usuários podem atualizar itens de sua empresa
      empresa_id = get_user_empresa_id_fallback() OR
      -- Service role pode atualizar qualquer item
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- Política DELETE: Permite deletar itens do menu (apenas admins)
CREATE POLICY "menu_items_delete_policy" ON menu_items
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- Apenas administradores ou service role podem deletar
      is_admin_user() OR
      (auth.jwt() ->> 'role')::text = 'service_role'
    )
  );

-- 3. Comentários explicativos
COMMENT ON POLICY "menu_items_select_policy" ON menu_items IS 
'Permite leitura de itens do menu para usuários autenticados da mesma empresa ou administradores';

COMMENT ON POLICY "menu_items_insert_policy" ON menu_items IS 
'Permite inserção de itens do menu para administradores, usuários da empresa ou service role';

COMMENT ON POLICY "menu_items_update_policy" ON menu_items IS 
'Permite atualização de itens do menu para administradores, usuários da empresa ou service role';

COMMENT ON POLICY "menu_items_delete_policy" ON menu_items IS 
'Permite exclusão de itens do menu apenas para administradores ou service role';