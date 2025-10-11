-- Corrigir políticas RLS para tabela comandas
-- Garantir isolamento por empresa_id
-- Migração crítica para resolver erro 403 Forbidden ao criar comandas

-- Drop políticas existentes problemáticas
DROP POLICY IF EXISTS "comandas_select_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_delete_policy" ON public.comandas;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários só podem ver comandas da própria empresa
CREATE POLICY "comandas_empresa_select" ON public.comandas
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND bt.id = comandas.table_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Política para INSERT: usuários só podem criar comandas em mesas da própria empresa
CREATE POLICY "comandas_empresa_insert" ON public.comandas
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND bt.id = comandas.table_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Política para UPDATE: usuários só podem atualizar comandas da própria empresa
CREATE POLICY "comandas_empresa_update" ON public.comandas
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND bt.id = comandas.table_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND bt.id = comandas.table_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Política para DELETE: usuários só podem deletar comandas da própria empresa
CREATE POLICY "comandas_empresa_delete" ON public.comandas
FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND bt.id = comandas.table_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Verificar se a tabela comanda_items também precisa de correção
DROP POLICY IF EXISTS "comanda_items_select_policy" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_insert_policy" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_update_policy" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_delete_policy" ON public.comanda_items;

-- Habilitar RLS na tabela comanda_items
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;

-- Políticas para comanda_items baseadas na empresa da comanda
CREATE POLICY "comanda_items_empresa_select" ON public.comanda_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      JOIN public.comandas c ON c.table_id = bt.id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND c.id = comanda_items.comanda_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

CREATE POLICY "comanda_items_empresa_insert" ON public.comanda_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      JOIN public.comandas c ON c.table_id = bt.id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND c.id = comanda_items.comanda_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

CREATE POLICY "comanda_items_empresa_update" ON public.comanda_items
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      JOIN public.comandas c ON c.table_id = bt.id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND c.id = comanda_items.comanda_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
) WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      JOIN public.comandas c ON c.table_id = bt.id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND c.id = comanda_items.comanda_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

CREATE POLICY "comanda_items_empresa_delete" ON public.comanda_items
FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      JOIN public.bar_tables bt ON bt.empresa_id = ue.empresa_id
      JOIN public.comandas c ON c.table_id = bt.id
      WHERE ue.user_id = auth.uid() 
      AND ue.status = 'ativo'
      AND c.id = comanda_items.comanda_id
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Log de auditoria (caso a tabela exista)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    INSERT INTO public.audit_log (table_name, operation, details, created_at)
    VALUES (
      'comandas', 
      'POLICY_UPDATE', 
      'Corrigidas políticas RLS para comandas e comanda_items - isolamento por empresa_id via bar_tables',
      NOW()
    );
  END IF;
END $$;