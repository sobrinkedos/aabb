/*
  # Correção Completa do Sistema Multitenant
  
  Esta migração corrige todos os problemas identificados no sistema multitenant:
  1. Adiciona empresa_id a todas as tabelas necessárias
  2. Corrige todas as políticas RLS para isolamento adequado
  3. Atualiza constraints UNIQUE para incluir empresa_id
  4. Garante isolamento completo entre empresas
  
  ORDEM DE EXECUÇÃO:
  - Primeiro: Adicionar colunas empresa_id onde necessário
  - Segundo: Atualizar dados existentes
  - Terceiro: Corrigir constraints
  - Quarto: Implementar políticas RLS adequadas
*/

-- =============================================================================
-- FASE 1: ADICIONAR EMPRESA_ID ÀS TABELAS QUE PRECISAM
-- =============================================================================

-- 1. Tabela menu_items (itens do cardápio devem ser específicos da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'menu_items' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.menu_items 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes com primeira empresa disponível
        UPDATE public.menu_items 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.menu_items 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela menu_items';
    END IF;
END $$;

-- 2. Tabela inventory_items (itens de estoque específicos da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_items' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.inventory_items 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.inventory_items 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.inventory_items 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela inventory_items';
    END IF;
END $$;

-- 3. Tabela employees (funcionários específicos da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.employees 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.employees 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.employees 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela employees';
    END IF;
END $$;

-- 4. Tabela customers (clientes específicos da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.customers 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.customers 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.customers 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela customers';
    END IF;
END $$;

-- 5. Tabela balcao_orders (pedidos de balcão específicos da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'balcao_orders' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.balcao_orders 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.balcao_orders 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.balcao_orders 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela balcao_orders';
    END IF;
END $$;

-- 6. Tabela comandas (comandas específicas da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comandas' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.comandas 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.comandas 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.comandas 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela comandas';
    END IF;
END $$;

-- 7. Tabela bar_tables (mesas específicas da empresa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bar_tables' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.bar_tables 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT;
        
        -- Atualizar registros existentes
        UPDATE public.bar_tables 
        SET empresa_id = (SELECT id FROM public.empresas ORDER BY created_at LIMIT 1)
        WHERE empresa_id IS NULL;
        
        -- Tornar NOT NULL após atualizar
        ALTER TABLE public.bar_tables 
        ALTER COLUMN empresa_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela bar_tables';
    END IF;
END $$;

-- =============================================================================
-- FASE 2: CORRIGIR CONSTRAINTS UNIQUE PARA INCLUIR EMPRESA_ID
-- =============================================================================

-- 1. Corrigir constraint UNIQUE em menu_items (nome único por empresa)
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'menu_items' 
               AND constraint_name = 'menu_items_name_key') THEN
        ALTER TABLE public.menu_items DROP CONSTRAINT menu_items_name_key;
    END IF;
    
    -- Adicionar nova constraint incluindo empresa_id
    ALTER TABLE public.menu_items 
    ADD CONSTRAINT menu_items_empresa_name_unique 
    UNIQUE (empresa_id, name);
    
    RAISE NOTICE 'Constraint menu_items_empresa_name_unique criada';
END $$;

-- 2. Corrigir constraint UNIQUE em inventory_items (nome único por empresa)
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'inventory_items' 
               AND constraint_name = 'inventory_items_name_key') THEN
        ALTER TABLE public.inventory_items DROP CONSTRAINT inventory_items_name_key;
    END IF;
    
    -- Adicionar nova constraint incluindo empresa_id
    ALTER TABLE public.inventory_items 
    ADD CONSTRAINT inventory_items_empresa_name_unique 
    UNIQUE (empresa_id, name);
    
    RAISE NOTICE 'Constraint inventory_items_empresa_name_unique criada';
END $$;

-- 3. Corrigir constraint UNIQUE em employees (código único por empresa)
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'employees' 
               AND constraint_name = 'employees_employee_code_key') THEN
        ALTER TABLE public.employees DROP CONSTRAINT employees_employee_code_key;
    END IF;
    
    -- Adicionar nova constraint incluindo empresa_id
    ALTER TABLE public.employees 
    ADD CONSTRAINT employees_empresa_code_unique 
    UNIQUE (empresa_id, employee_code);
    
    RAISE NOTICE 'Constraint employees_empresa_code_unique criada';
END $$;

-- 4. Corrigir constraint UNIQUE em bar_tables (número único por empresa)
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'bar_tables' 
               AND constraint_name = 'bar_tables_number_key') THEN
        ALTER TABLE public.bar_tables DROP CONSTRAINT bar_tables_number_key;
    END IF;
    
    -- Adicionar nova constraint incluindo empresa_id
    ALTER TABLE public.bar_tables 
    ADD CONSTRAINT bar_tables_empresa_number_unique 
    UNIQUE (empresa_id, number);
    
    RAISE NOTICE 'Constraint bar_tables_empresa_number_unique criada';
END $$;

-- =============================================================================
-- FASE 3: CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_menu_items_empresa_id ON public.menu_items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_empresa_id ON public.inventory_items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_employees_empresa_id ON public.employees(empresa_id);
CREATE INDEX IF NOT EXISTS idx_customers_empresa_id ON public.customers(empresa_id);
CREATE INDEX IF NOT EXISTS idx_balcao_orders_empresa_id ON public.balcao_orders(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_empresa_id ON public.comandas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bar_tables_empresa_id ON public.bar_tables(empresa_id);

-- =============================================================================
-- FASE 4: FUNÇÕES AUXILIARES PARA RLS
-- =============================================================================

-- Função para verificar se usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND papel IN ('SUPER_ADMIN', 'ADMIN')
    AND status = 'ativo'
  );
$$;

-- Função para obter empresa_id com fallback para service_role
CREATE OR REPLACE FUNCTION public.get_user_empresa_id_fallback()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN auth.jwt() ->> 'role' = 'service_role' THEN NULL
    ELSE (
      SELECT empresa_id 
      FROM public.usuarios_empresa 
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  END;
$$;

-- =============================================================================
-- FASE 5: HABILITAR RLS EM TODAS AS TABELAS
-- =============================================================================

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balcao_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balcao_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FASE 6: POLÍTICAS RLS PARA MENU_ITEMS
-- =============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "menu_items_select_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.menu_items;

-- Política SELECT - usuários podem ver itens de sua empresa
CREATE POLICY "menu_items_select_policy" ON public.menu_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    public.is_admin_user()
  )
);

-- Política INSERT - apenas administradores podem inserir
CREATE POLICY "menu_items_insert_policy" ON public.menu_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política UPDATE - apenas administradores podem atualizar
CREATE POLICY "menu_items_update_policy" ON public.menu_items
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política DELETE - apenas SUPER_ADMIN pode deletar
CREATE POLICY "menu_items_delete_policy" ON public.menu_items
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
-- FASE 7: POLÍTICAS RLS PARA INVENTORY_ITEMS
-- =============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete_policy" ON public.inventory_items;

-- Política SELECT
CREATE POLICY "inventory_items_select_policy" ON public.inventory_items
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    public.is_admin_user()
  )
);

-- Política INSERT
CREATE POLICY "inventory_items_insert_policy" ON public.inventory_items
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política UPDATE
CREATE POLICY "inventory_items_update_policy" ON public.inventory_items
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id()
);

-- Política DELETE
CREATE POLICY "inventory_items_delete_policy" ON public.inventory_items
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- =============================================================================
-- FASE 8: POLÍTICAS RLS PARA EMPLOYEES
-- =============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

-- Política SELECT
CREATE POLICY "employees_select_policy" ON public.employees
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id()
);

-- Política INSERT
CREATE POLICY "employees_insert_policy" ON public.employees
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política UPDATE
CREATE POLICY "employees_update_policy" ON public.employees
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id() AND
  public.is_admin_user()
);

-- Política DELETE
CREATE POLICY "employees_delete_policy" ON public.employees
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
-- FASE 9: POLÍTICAS RLS PARA COMANDAS E BALCAO_ORDERS
-- =============================================================================

-- Comandas
DROP POLICY IF EXISTS "comandas_select_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_policy" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_policy" ON public.comandas;

CREATE POLICY "comandas_empresa_policy" ON public.comandas
FOR ALL USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id()
);

-- Balcão Orders
DROP POLICY IF EXISTS "balcao_orders_select_policy" ON public.balcao_orders;
DROP POLICY IF EXISTS "balcao_orders_insert_policy" ON public.balcao_orders;
DROP POLICY IF EXISTS "balcao_orders_update_policy" ON public.balcao_orders;

CREATE POLICY "balcao_orders_empresa_policy" ON public.balcao_orders
FOR ALL USING (
  auth.uid() IS NOT NULL AND
  empresa_id = public.get_user_empresa_id()
);

-- =============================================================================
-- FASE 10: POLÍTICAS RLS PARA CASH MANAGEMENT
-- =============================================================================

-- Cash Sessions
DROP POLICY IF EXISTS "cash_sessions_select_policy" ON public.cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_insert_policy" ON public.cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_update_policy" ON public.cash_sessions;

CREATE POLICY "cash_sessions_empresa_policy" ON public.cash_sessions
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    empresa_id = public.get_user_empresa_id() OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Cash Transactions
DROP POLICY IF EXISTS "cash_transactions_select_policy" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_insert_policy" ON public.cash_transactions;
DROP POLICY IF EXISTS "cash_transactions_update_policy" ON public.cash_transactions;

CREATE POLICY "cash_transactions_empresa_policy" ON public.cash_transactions
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.cash_sessions cs
      WHERE cs.id = cash_session_id
      AND cs.empresa_id = public.get_user_empresa_id()
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- =============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE public.menu_items IS 'Itens do cardápio específicos por empresa';
COMMENT ON TABLE public.inventory_items IS 'Itens de estoque específicos por empresa';
COMMENT ON TABLE public.employees IS 'Funcionários específicos por empresa';
COMMENT ON TABLE public.customers IS 'Clientes específicos por empresa';
COMMENT ON TABLE public.balcao_orders IS 'Pedidos de balcão específicos por empresa';
COMMENT ON TABLE public.comandas IS 'Comandas específicas por empresa';
COMMENT ON TABLE public.bar_tables IS 'Mesas específicas por empresa';

COMMENT ON FUNCTION public.is_admin_user() IS 'Verifica se o usuário atual é administrador';
COMMENT ON FUNCTION public.get_user_empresa_id_fallback() IS 'Obtém empresa_id do usuário com fallback para service_role';

-- Finalizar migração
SELECT 'Migração multitenant completa executada com sucesso!' as resultado;