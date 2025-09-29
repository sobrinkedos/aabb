-- Criar tabela inventory_categories se não existir
-- Esta migração cria a tabela de categorias de inventário com estrutura adequada

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.inventory_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hexadecimal
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    empresa_id UUID REFERENCES public.empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_inventory_categories_empresa_id ON public.inventory_categories(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_is_active ON public.inventory_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_name ON public.inventory_categories(name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_inventory_categories_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_categories_updated_at_trigger
    BEFORE UPDATE ON public.inventory_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_categories_updated_at();

-- Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE public.inventory_categories DISABLE ROW LEVEL SECURITY;

-- Comentários
COMMENT ON TABLE public.inventory_categories IS 'Categorias para organização dos itens de inventário';
COMMENT ON COLUMN public.inventory_categories.name IS 'Nome da categoria';
COMMENT ON COLUMN public.inventory_categories.description IS 'Descrição opcional da categoria';
COMMENT ON COLUMN public.inventory_categories.color IS 'Cor da categoria em hexadecimal';
COMMENT ON COLUMN public.inventory_categories.icon IS 'Ícone da categoria (nome do ícone)';
COMMENT ON COLUMN public.inventory_categories.is_active IS 'Se a categoria está ativa';
COMMENT ON COLUMN public.inventory_categories.empresa_id IS 'ID da empresa proprietária da categoria';

-- Inserir algumas categorias padrão se a tabela estiver vazia
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