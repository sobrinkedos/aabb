-- SCRIPT PARA DESABILITAR RLS TEMPORARIAMENTE EM INVENTORY_CATEGORIES
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Desabilitar RLS temporariamente
ALTER TABLE inventory_categories DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se a coluna empresa_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_categories' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE inventory_categories ADD COLUMN empresa_id UUID;
        COMMENT ON COLUMN inventory_categories.empresa_id IS 'ID da empresa proprietária da categoria';
    END IF;
END $$;

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'inventory_categories' 
ORDER BY ordinal_position;

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_categorias FROM inventory_categories;

-- 5. Verificar empresas disponíveis
SELECT id, nome FROM empresas LIMIT 5;

-- 6. Se necessário, criar a tabela do zero
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- 7. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_inventory_categories_empresa_id ON inventory_categories(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_is_active ON inventory_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_name ON inventory_categories(name);

-- 8. Comentários
COMMENT ON TABLE inventory_categories IS 'Categorias para organização dos itens de inventário';

-- 9. Inserir categorias padrão se não existirem
INSERT INTO inventory_categories (name, description, color, icon, empresa_id)
SELECT 
    'Bebidas', 'Bebidas em geral', '#3B82F6', 'wine', 
    (SELECT id FROM empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM inventory_categories WHERE name = 'Bebidas')
AND EXISTS (SELECT 1 FROM empresas);

INSERT INTO inventory_categories (name, description, color, icon, empresa_id)
SELECT 
    'Alimentos', 'Produtos alimentícios', '#10B981', 'utensils', 
    (SELECT id FROM empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM inventory_categories WHERE name = 'Alimentos')
AND EXISTS (SELECT 1 FROM empresas);

-- 10. Verificar resultado final
SELECT * FROM inventory_categories;