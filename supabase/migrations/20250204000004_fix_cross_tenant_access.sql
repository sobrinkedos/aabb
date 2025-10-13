/*
  # CORREÇÃO URGENTE: Falha Crítica de Isolamento Multitenant
  
  PROBLEMA IDENTIFICADO: 
  - Usuários conseguem ver produtos de outras empresas
  - Política RLS "menu_items_select_public" permite acesso total
  - Filtros empresa_id comentados no código frontend
  
  CORREÇÃO IMEDIATA:
  - Substituir política pública por política restritiva
  - Garantir isolamento total por empresa_id
  - Adicionar verificações de segurança adicionais
*/

-- =============================================================================
-- CORREÇÃO URGENTE: POLÍTICAS RLS PARA MENU_ITEMS
-- =============================================================================

-- 1. REMOVER POLÍTICA INSEGURA
DROP POLICY IF EXISTS "menu_items_select_public" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_modify_admin" ON public.menu_items;

-- 2. IMPLEMENTAR POLÍTICAS SEGURAS COM ISOLAMENTO TOTAL

-- Política SELECT: Apenas itens da própria empresa
CREATE POLICY "menu_items_empresa_select" ON public.menu_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Usuários podem ver apenas itens de sua empresa
    empresa_id = public.get_user_empresa_id() OR
    -- Service role pode ver tudo (para administração sistema)
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Política INSERT: Apenas administradores da empresa
CREATE POLICY "menu_items_empresa_insert" ON public.menu_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política UPDATE: Apenas administradores da empresa
CREATE POLICY "menu_items_empresa_update" ON public.menu_items
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
) WITH CHECK (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política DELETE: Apenas SUPER_ADMIN da empresa
CREATE POLICY "menu_items_empresa_delete" ON public.menu_items
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND papel = 'SUPER_ADMIN'
    AND status = 'ativo'
  )
);

-- =============================================================================
-- CORREÇÃO PARA OUTRAS TABELAS CRÍTICAS
-- =============================================================================

-- 3. INVENTORY_ITEMS - Garantir isolamento
DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete_policy" ON public.inventory_items;

CREATE POLICY "inventory_items_empresa_policy" ON public.inventory_items
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- 4. COMANDAS - Garantir isolamento
DROP POLICY IF EXISTS "comandas_select_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_select_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_modify_empresa" ON public.comandas;

CREATE POLICY "comandas_empresa_policy" ON public.comandas
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- 5. BALCAO_ORDERS - Garantir isolamento
DROP POLICY IF EXISTS "balcao_orders_select_policy" ON public.balcao_orders;
DROP POLICY IF EXISTS "balcao_orders_insert_policy" ON public.balcao_orders;
DROP POLICY IF EXISTS "balcao_orders_update_policy" ON public.balcao_orders;

CREATE POLICY "balcao_orders_empresa_policy" ON public.balcao_orders
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- 6. EMPLOYEES - Garantir isolamento
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

CREATE POLICY "employees_empresa_policy" ON public.employees
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- 7. CUSTOMERS - Garantir isolamento
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

CREATE POLICY "customers_empresa_policy" ON public.customers
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- =============================================================================
-- VERIFICAÇÃO DE SEGURANÇA ADICIONAL
-- =============================================================================

-- Função para detectar tentativas de acesso cross-tenant em menu_items
CREATE OR REPLACE FUNCTION public.audit_menu_items_access()
RETURNS TRIGGER AS $$
DECLARE
  user_empresa_id UUID;
  item_empresa_id UUID;
BEGIN
  -- Obter empresa do usuário
  SELECT empresa_id INTO user_empresa_id
  FROM public.usuarios_empresa 
  WHERE user_id = auth.uid() AND status = 'ativo'
  LIMIT 1;
  
  -- Obter empresa do item
  IF TG_OP = 'DELETE' THEN
    item_empresa_id := OLD.empresa_id;
  ELSE
    item_empresa_id := NEW.empresa_id;
  END IF;
  
  -- Se empresas diferentes, registrar tentativa suspeita
  IF user_empresa_id IS NOT NULL AND item_empresa_id IS NOT NULL 
     AND user_empresa_id != item_empresa_id THEN
    
    INSERT INTO public.logs_auditoria (
      empresa_id,
      usuario_id,
      acao,
      recurso,
      detalhes,
      ip_address
    ) VALUES (
      user_empresa_id,
      auth.uid(),
      'TENTATIVA_ACESSO_CROSS_TENANT_MENU',
      'menu_items',
      jsonb_build_object(
        'operacao', TG_OP,
        'item_id', COALESCE(NEW.id, OLD.id),
        'empresa_usuario', user_empresa_id,
        'empresa_item', item_empresa_id,
        'item_name', COALESCE(NEW.name, OLD.name)
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_menu_items_access ON public.menu_items;
CREATE TRIGGER trigger_audit_menu_items_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_menu_items_access();

-- =============================================================================
-- FUNÇÃO DE VERIFICAÇÃO IMEDIATA
-- =============================================================================

-- Função para verificar se há vazamento de dados entre empresas
CREATE OR REPLACE FUNCTION public.verificar_vazamento_dados()
RETURNS TABLE (
  tabela TEXT,
  problema TEXT,
  registros_afetados BIGINT,
  detalhes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se há menu_items sem empresa_id
  RETURN QUERY
  SELECT 
    'menu_items'::TEXT,
    'Itens sem empresa_id'::TEXT,
    COUNT(*),
    'Itens do menu não vinculados a empresa específica'::TEXT
  FROM public.menu_items
  WHERE empresa_id IS NULL
  HAVING COUNT(*) > 0;
  
  -- Verificar se há usuários vendo itens de outras empresas (simulação)
  RETURN QUERY
  SELECT 
    'acesso_cross_tenant'::TEXT,
    'Possível vazamento detectado'::TEXT,
    COUNT(*),
    'Verificar logs de auditoria para tentativas cross-tenant'::TEXT
  FROM public.logs_auditoria
  WHERE acao = 'TENTATIVA_ACESSO_CROSS_TENANT_MENU'
  AND created_at > NOW() - INTERVAL '1 day'
  HAVING COUNT(*) > 0;
  
  RETURN;
END;
$$;

-- =============================================================================
-- APLICAR CORREÇÕES EM DADOS EXISTENTES
-- =============================================================================

-- Atualizar menu_items sem empresa_id para empresa padrão (se necessário)
DO $$
DECLARE
  empresa_padrao_id UUID;
BEGIN
  -- Buscar primeira empresa ativa
  SELECT id INTO empresa_padrao_id
  FROM public.empresas 
  WHERE status = 'ativo'
  ORDER BY created_at
  LIMIT 1;
  
  IF empresa_padrao_id IS NOT NULL THEN
    -- Atualizar itens sem empresa
    UPDATE public.menu_items 
    SET empresa_id = empresa_padrao_id
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE 'Atualizados % itens para empresa padrão: %', 
      (SELECT COUNT(*) FROM public.menu_items WHERE empresa_id = empresa_padrao_id),
      empresa_padrao_id;
  END IF;
END $$;

-- =============================================================================
-- LOGS E VALIDAÇÃO FINAL
-- =============================================================================

-- Registrar correção no log
INSERT INTO public.logs_auditoria (
  empresa_id,
  usuario_id,
  acao,
  recurso,
  detalhes
) 
SELECT 
  id,
  NULL,
  'CORRECAO_ISOLAMENTO_APLICADA',
  'menu_items',
  jsonb_build_object(
    'migracao', '20250204000004_fix_cross_tenant_access',
    'timestamp', NOW()
  )
FROM public.empresas
WHERE status = 'ativo';

-- Verificar se a correção foi aplicada
SELECT 'CORREÇÃO APLICADA - Verificando isolamento...' as status;

-- Executar verificação de vazamento
SELECT * FROM public.verificar_vazamento_dados();

-- Exibir políticas RLS ativas para menu_items
SELECT 
  'POLÍTICAS RLS ATIVAS PARA MENU_ITEMS:' as info,
  policyname,
  cmd,
  qual as condicao
FROM pg_policies 
WHERE tablename = 'menu_items' 
AND schemaname = 'public';