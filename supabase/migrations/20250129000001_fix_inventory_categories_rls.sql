/*
  # Correção da tabela inventory_categories
  
  Esta migração corrige a tabela inventory_categories:
  - Desabilita RLS temporariamente para desenvolvimento
  - Garante que a estrutura da tabela está correta
  - Adiciona dados padrão se necessário
*/

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.inventory_categories (
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

-- 2. Verificar se a coluna empresa_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_categories' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE public.inventory_categories ADD COLUMN empresa_id UUID;
        COMMENT ON COLUMN public.inventory_categories.empresa_id IS 'ID da empresa proprietária da categoria';
    END IF;
END $$;

-- 3. Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE public.inventory_categories DISABLE ROW LEVEL SECURITY;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_inventory_categories_empresa_id ON public.inventory_categories(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_is_active ON public.inventory_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_name ON public.inventory_categories(name);

-- 5. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_inventory_categories_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_categories_updated_at_trigger ON public.inventory_categories;
CREATE TRIGGER update_inventory_categories_updated_at_trigger
    BEFORE UPDATE ON public.inventory_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_categories_updated_at();

-- 6. Comentários
COMMENT ON TABLE public.inventory_categories IS 'Categorias para organização dos itens de inventário';
COMMENT ON COLUMN public.inventory_categories.name IS 'Nome da categoria';
COMMENT ON COLUMN public.inventory_categories.description IS 'Descrição opcional da categoria';
COMMENT ON COLUMN public.inventory_categories.color IS 'Cor da categoria em hexadecimal';
COMMENT ON COLUMN public.inventory_categories.icon IS 'Ícone da categoria (nome do ícone)';
COMMENT ON COLUMN public.inventory_categories.is_active IS 'Se a categoria está ativa';

-- 7. Inserir categorias padrão se não existirem e houver empresas
INSERT INTO public.inventory_categories (name, description, color, icon, empresa_id)
SELECT 
    'Bebidas', 'Bebidas em geral', '#3B82F6', 'wine', 
    (SELECT id FROM public.empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_categories WHERE name = 'Bebidas')
AND EXISTS (SELECT 1 FROM public.empresas);

INSERT INTO public.inventory_categories (name, description, color, icon, empresa_id)
SELECT 
    'Alimentos', 'Produtos alimentícios', '#10B981', 'utensils', 
    (SELECT id FROM public.empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_categories WHERE name = 'Alimentos')
AND EXISTS (SELECT 1 FROM public.empresas);

INSERT INTO public.inventory_categories (name, description, color, icon, empresa_id)
SELECT 
    'Limpeza', 'Produtos de limpeza', '#F59E0B', 'spray-can', 
    (SELECT id FROM public.empresas LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_categories WHERE name = 'Limpeza')
AND EXISTS (SELECT 1 FROM public.empresas);