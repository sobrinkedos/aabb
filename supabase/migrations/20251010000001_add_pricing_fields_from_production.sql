-- Migração: Adicionar campos de precificação avançada do projeto de produção
-- Data: 2025-01-10
-- Descrição: Adiciona campos de precificação (cost_per_serving, margin_percentage, pricing_method) 
--            às tabelas menu_items e inventory_items para sincronizar com o projeto de produção

-- =====================================================
-- 1. ADICIONAR CAMPOS À TABELA menu_items
-- =====================================================

-- Adicionar campo cost_per_serving (custo por porção)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS cost_per_serving NUMERIC(10,2) NULL;

COMMENT ON COLUMN public.menu_items.cost_per_serving IS 'Custo por porção/unidade servida';

-- Adicionar campo margin_percentage (margem de lucro em percentual)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2) NULL;

COMMENT ON COLUMN public.menu_items.margin_percentage IS 'Margem de lucro em percentual';

-- Adicionar campo pricing_method (método de precificação)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS pricing_method VARCHAR(20) DEFAULT 'margin' 
CHECK (pricing_method IN ('margin', 'fixed_price'));

COMMENT ON COLUMN public.menu_items.pricing_method IS 'Método de precificação: margin (margem) ou fixed_price (preço fixo)';

-- =====================================================
-- 2. ADICIONAR CAMPOS À TABELA inventory_items
-- =====================================================

-- Adicionar campo sale_price (preço de venda fixo)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2) NULL;

COMMENT ON COLUMN public.inventory_items.sale_price IS 'Preço de venda fixo definido pelo usuário';

-- Adicionar campo margin_percentage (margem de lucro em percentual)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2) NULL;

COMMENT ON COLUMN public.inventory_items.margin_percentage IS 'Margem de lucro em percentual (ex: 50 para 50%)';

-- Adicionar campo pricing_method (método de precificação)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS pricing_method VARCHAR(20) DEFAULT 'margin' 
CHECK (pricing_method IN ('margin', 'fixed_price'));

COMMENT ON COLUMN public.inventory_items.pricing_method IS 'Método de precificação: margin (margem) ou fixed_price (preço fixo)';

-- =====================================================
-- 3. CRIAR FUNÇÃO PARA CALCULAR PREÇO BASEADO NA MARGEM
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_price_with_margin(
    cost NUMERIC,
    margin_percent NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    IF cost IS NULL OR margin_percent IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calcula o preço aplicando a margem
    -- Exemplo: custo R$ 10 com margem de 50% = R$ 15
    RETURN ROUND(cost * (1 + (margin_percent / 100)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_price_with_margin IS 'Calcula o preço de venda aplicando uma margem percentual sobre o custo';

-- =====================================================
-- 4. CRIAR FUNÇÃO PARA CALCULAR MARGEM A PARTIR DO PREÇO
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_margin_from_price(
    cost NUMERIC,
    sale_price NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    IF cost IS NULL OR sale_price IS NULL OR cost = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Calcula a margem percentual
    -- Exemplo: custo R$ 10, preço R$ 15 = 50% de margem
    RETURN ROUND(((sale_price - cost) / cost) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_margin_from_price IS 'Calcula a margem percentual a partir do custo e preço de venda';

-- =====================================================
-- 5. CRIAR VIEW PARA ANÁLISE DE PRECIFICAÇÃO
-- =====================================================

CREATE OR REPLACE VIEW menu_items_pricing_analysis AS
SELECT 
    mi.id,
    mi.name,
    mi.price AS current_price,
    mi.cost_per_serving,
    mi.margin_percentage,
    mi.pricing_method,
    CASE 
        WHEN mi.pricing_method = 'margin' AND mi.cost_per_serving IS NOT NULL AND mi.margin_percentage IS NOT NULL 
        THEN calculate_price_with_margin(mi.cost_per_serving, mi.margin_percentage)
        ELSE mi.price
    END AS calculated_price,
    CASE 
        WHEN mi.cost_per_serving IS NOT NULL AND mi.price IS NOT NULL
        THEN calculate_margin_from_price(mi.cost_per_serving, mi.price)
        ELSE NULL
    END AS actual_margin_percentage,
    mi.category,
    mi.available,
    mi.empresa_id
FROM public.menu_items mi;

COMMENT ON VIEW menu_items_pricing_analysis IS 'View para análise de precificação dos itens do cardápio';

-- =====================================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_menu_items_pricing_method 
ON public.menu_items(pricing_method) 
WHERE pricing_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_pricing_method 
ON public.inventory_items(pricing_method) 
WHERE pricing_method IS NOT NULL;

-- =====================================================
-- 7. MENSAGEM DE SUCESSO
-- =====================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Campos de precificação adicionados às tabelas menu_items e inventory_items';
    RAISE NOTICE 'Funções de cálculo de preço e margem criadas';
    RAISE NOTICE 'View de análise de precificação criada: menu_items_pricing_analysis';
END $$;
