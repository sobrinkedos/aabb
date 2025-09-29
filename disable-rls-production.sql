-- ========================================
-- DESABILITAR RLS TEMPORARIAMENTE - PRODUÇÃO
-- ========================================

-- Desabilitar RLS nas tabelas problemáticas
ALTER TABLE usuarios_empresa DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE comandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE bar_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE balcao_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE balcao_order_items DISABLE ROW LEVEL SECURITY;

-- Criar função get_low_stock_items
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

-- Criar view balcao_orders_with_details
CREATE OR REPLACE VIEW balcao_orders_with_details AS
SELECT 
    bo.id,
    bo.customer_name,
    bo.total,
    bo.status,
    bo.created_at,
    bo.updated_at,
    COALESCE(
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
        ) FILTER (WHERE boi.id IS NOT NULL),
        '[]'::json
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

-- Inserir empresa AABB se não existir
INSERT INTO empresas (
    id,
    nome,
    email_admin,
    status,
    created_at
)
SELECT 
    '9e445c5a-a382-444d-94f8-9d126ed6414e'::uuid,
    'AABB Garanhuns',
    'riltons@gmail.com',
    'ativo',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM empresas 
    WHERE id = '9e445c5a-a382-444d-94f8-9d126ed6414e'::uuid
);