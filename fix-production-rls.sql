-- ========================================
-- CORREÇÃO DE POLÍTICAS RLS - PRODUÇÃO
-- ========================================

-- Desabilitar RLS temporariamente para correção
ALTER TABLE usuarios_empresa DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE comandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE bar_tables DISABLE ROW LEVEL SECURITY;

-- Remover políticas problemáticas existentes
DROP POLICY IF EXISTS "usuarios_empresa_select_policy" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_insert_policy" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_update_policy" ON usuarios_empresa;
DROP POLICY IF EXISTS "usuarios_empresa_delete_policy" ON usuarios_empresa;

DROP POLICY IF EXISTS "empresas_select_policy" ON empresas;
DROP POLICY IF EXISTS "empresas_insert_policy" ON empresas;
DROP POLICY IF EXISTS "empresas_update_policy" ON empresas;

-- Criar políticas RLS simples e seguras
-- USUARIOS_EMPRESA
CREATE POLICY "usuarios_empresa_select_simple" ON usuarios_empresa
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM empresas e 
            WHERE e.id = usuarios_empresa.empresa_id 
            AND e.email_admin = auth.email()
        )
    );

CREATE POLICY "usuarios_empresa_insert_simple" ON usuarios_empresa
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM empresas e 
            WHERE e.id = empresa_id 
            AND e.email_admin = auth.email()
        )
    );

CREATE POLICY "usuarios_empresa_update_simple" ON usuarios_empresa
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM empresas e 
            WHERE e.id = usuarios_empresa.empresa_id 
            AND e.email_admin = auth.email()
        )
    );

-- EMPRESAS
CREATE POLICY "empresas_select_simple" ON empresas
    FOR SELECT USING (
        email_admin = auth.email() OR
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue 
            WHERE ue.empresa_id = empresas.id 
            AND ue.user_id = auth.uid()
        )
    );

-- MENU_ITEMS (acesso público para leitura)
CREATE POLICY "menu_items_select_public" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "menu_items_modify_admin" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue
            JOIN empresas e ON e.id = ue.empresa_id
            WHERE ue.user_id = auth.uid()
            AND (ue.tipo_usuario = 'administrador' OR e.email_admin = auth.email())
        )
    );

-- COMANDAS
CREATE POLICY "comandas_select_empresa" ON comandas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = comandas.empresa_id
        ) OR
        EXISTS (
            SELECT 1 FROM empresas e
            WHERE e.id = comandas.empresa_id
            AND e.email_admin = auth.email()
        )
    );

CREATE POLICY "comandas_modify_empresa" ON comandas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = comandas.empresa_id
        ) OR
        EXISTS (
            SELECT 1 FROM empresas e
            WHERE e.id = comandas.empresa_id
            AND e.email_admin = auth.email()
        )
    );

-- COMANDA_ITEMS
CREATE POLICY "comanda_items_select_empresa" ON comanda_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM comandas c
            JOIN usuarios_empresa ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = comanda_items.comanda_id
            AND ue.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM comandas c
            JOIN empresas e ON e.id = c.empresa_id
            WHERE c.id = comanda_items.comanda_id
            AND e.email_admin = auth.email()
        )
    );

CREATE POLICY "comanda_items_modify_empresa" ON comanda_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM comandas c
            JOIN usuarios_empresa ue ON ue.empresa_id = c.empresa_id
            WHERE c.id = comanda_items.comanda_id
            AND ue.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM comandas c
            JOIN empresas e ON e.id = c.empresa_id
            WHERE c.id = comanda_items.comanda_id
            AND e.email_admin = auth.email()
        )
    );

-- BAR_TABLES
CREATE POLICY "bar_tables_select_empresa" ON bar_tables
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bar_tables.empresa_id
        ) OR
        EXISTS (
            SELECT 1 FROM empresas e
            WHERE e.id = bar_tables.empresa_id
            AND e.email_admin = auth.email()
        )
    );

CREATE POLICY "bar_tables_modify_empresa" ON bar_tables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_empresa ue
            WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bar_tables.empresa_id
        ) OR
        EXISTS (
            SELECT 1 FROM empresas e
            WHERE e.id = bar_tables.empresa_id
            AND e.email_admin = auth.email()
        )
    );

-- Reabilitar RLS
ALTER TABLE usuarios_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_tables ENABLE ROW LEVEL SECURITY;

-- Criar função get_low_stock_items se não existir
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    id uuid,
    name text,
    current_stock numeric,
    min_stock numeric,
    unit text,
    category text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.name,
        i.current_stock,
        i.min_stock,
        i.unit,
        i.category
    FROM inventory_items i
    WHERE i.current_stock <= i.min_stock
    AND i.available_for_sale = true
    ORDER BY (i.current_stock / NULLIF(i.min_stock, 0)) ASC;
END;
$$;

-- Criar view balcao_orders_with_details se não existir
CREATE OR REPLACE VIEW balcao_orders_with_details AS
SELECT 
    bo.id,
    bo.customer_name,
    bo.total,
    bo.status,
    bo.created_at,
    bo.updated_at,
    json_agg(
        json_build_object(
            'id', boi.id,
            'quantity', boi.quantity,
            'price', boi.price,
            'menu_item', json_build_object(
                'id', mi.id,
                'name', mi.name,
                'category', mi.category
            )
        )
    ) as items
FROM balcao_orders bo
LEFT JOIN balcao_order_items boi ON boi.order_id = bo.id
LEFT JOIN menu_items mi ON mi.id = boi.menu_item_id
GROUP BY bo.id, bo.customer_name, bo.total, bo.status, bo.created_at, bo.updated_at;

-- Conceder permissões
GRANT SELECT ON balcao_orders_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_items() TO authenticated;

-- Inserir usuário administrador se não existir
INSERT INTO usuarios_empresa (
    user_id,
    empresa_id,
    cargo,
    tipo_usuario,
    status,
    created_at
)
SELECT 
    '02f69247-ca96-4356-bb9c-820f5fcaa761'::uuid,
    '9e445c5a-a382-444d-94f8-9d126ed6414e'::uuid,
    'Administrador',
    'administrador',
    'ativo',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios_empresa 
    WHERE user_id = '02f69247-ca96-4356-bb9c-820f5fcaa761'::uuid
);

COMMIT;