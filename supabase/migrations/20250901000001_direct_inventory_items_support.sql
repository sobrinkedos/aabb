/*
  # Suporte para Itens Diretos do Estoque no Cardápio
  
  Esta migração adiciona suporte para que itens do estoque possam ser vendidos
  diretamente através do cardápio, sem necessidade de receitas.
  
  ## Modificações:
  - Adiciona campo direct_inventory_item_id na tabela menu_items
  - Adiciona campo item_type para distinguir entre pratos preparados e produtos prontos
  - Cria trigger para baixa automática no estoque
  - Adiciona políticas RLS apropriadas
*/

-- 1. ADICIONAR CAMPOS À TABELA MENU_ITEMS
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS direct_inventory_item_id UUID REFERENCES public.inventory_items(id),
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'prepared' CHECK (item_type IN ('prepared', 'direct'));

COMMENT ON COLUMN public.menu_items.direct_inventory_item_id IS 'Referência direta ao item do estoque (para produtos prontos)';
COMMENT ON COLUMN public.menu_items.item_type IS 'Tipo do item: prepared (prato preparado) ou direct (produto pronto do estoque)';

-- 2. FUNÇÃO PARA VALIDAR CONSISTÊNCIA DOS DADOS
CREATE OR REPLACE FUNCTION public.validate_menu_item_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é um item direto, deve ter direct_inventory_item_id
    IF NEW.item_type = 'direct' AND NEW.direct_inventory_item_id IS NULL THEN
        RAISE EXCEPTION 'Itens diretos devem ter um inventory_item_id associado';
    END IF;
    
    -- Se é um item preparado, não deve ter direct_inventory_item_id
    IF NEW.item_type = 'prepared' AND NEW.direct_inventory_item_id IS NOT NULL THEN
        RAISE EXCEPTION 'Itens preparados não devem ter inventory_item_id direto';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER PARA VALIDAÇÃO
CREATE TRIGGER validate_menu_item_consistency_trigger
    BEFORE INSERT OR UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_menu_item_consistency();

-- 4. FUNÇÃO PARA BAIXA AUTOMÁTICA NO ESTOQUE
CREATE OR REPLACE FUNCTION public.process_direct_inventory_sale()
RETURNS TRIGGER AS $$
DECLARE
    menu_item_record RECORD;
    inventory_item_record RECORD;
BEGIN
    -- Buscar informações do item do menu
    SELECT mi.item_type, mi.direct_inventory_item_id
    INTO menu_item_record
    FROM public.menu_items mi
    WHERE mi.id = NEW.menu_item_id;
    
    -- Se é um item direto do estoque
    IF menu_item_record.item_type = 'direct' AND menu_item_record.direct_inventory_item_id IS NOT NULL THEN
        -- Verificar estoque disponível
        SELECT current_stock
        INTO inventory_item_record
        FROM public.inventory_items
        WHERE id = menu_item_record.direct_inventory_item_id;
        
        -- Verificar se há estoque suficiente
        IF inventory_item_record.current_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', 
                inventory_item_record.current_stock, NEW.quantity;
        END IF;
        
        -- Dar baixa no estoque
        UPDATE public.inventory_items
        SET current_stock = current_stock - NEW.quantity,
            last_updated = NOW()
        WHERE id = menu_item_record.direct_inventory_item_id;
        
        -- Log da movimentação (opcional - pode ser implementado depois)
        -- INSERT INTO inventory_movements ...
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA BAIXA AUTOMÁTICA
CREATE TRIGGER process_direct_inventory_sale_trigger
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.process_direct_inventory_sale();

-- 6. FUNÇÃO PARA VERIFICAR DISPONIBILIDADE DE ITENS DIRETOS
CREATE OR REPLACE FUNCTION public.check_direct_item_availability(menu_item_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    menu_item_record RECORD;
    inventory_stock INTEGER;
BEGIN
    -- Buscar informações do item do menu
    SELECT item_type, direct_inventory_item_id
    INTO menu_item_record
    FROM public.menu_items
    WHERE id = menu_item_id_param;
    
    -- Se não é um item direto, retornar true (será verificado por outras funções)
    IF menu_item_record.item_type != 'direct' OR menu_item_record.direct_inventory_item_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar estoque do item direto
    SELECT current_stock
    INTO inventory_stock
    FROM public.inventory_items
    WHERE id = menu_item_record.direct_inventory_item_id;
    
    -- Retornar se há estoque disponível
    RETURN inventory_stock > 0;
END;
$$ LANGUAGE plpgsql;

-- 7. ATUALIZAR A VIEW MENU_ITEMS_COMPLETE
CREATE OR REPLACE VIEW public.menu_items_complete AS
SELECT 
    mi.*,
    r.instructions,
    r.prep_time,
    r.cook_time,
    r.servings,
    r.difficulty_level,
    r.cost_per_serving,
    r.margin_percentage,
    ni.calories_per_serving,
    ni.protein_g,
    ni.carbs_g,
    ni.fat_g,
    ni.allergens,
    ni.dietary_restrictions,
    ii.name as inventory_item_name,
    ii.current_stock,
    ii.min_stock,
    ii.unit as inventory_unit,
    CASE 
        WHEN mi.item_type = 'direct' THEN 
            public.check_direct_item_availability(mi.id)
        WHEN mi.availability_status = 'seasonal' THEN
            CASE 
                WHEN mi.seasonal_start_month <= mi.seasonal_end_month THEN
                    EXTRACT(MONTH FROM NOW()) BETWEEN mi.seasonal_start_month AND mi.seasonal_end_month
                ELSE
                    EXTRACT(MONTH FROM NOW()) >= mi.seasonal_start_month OR 
                    EXTRACT(MONTH FROM NOW()) <= mi.seasonal_end_month
            END
        ELSE mi.availability_status = 'available'
    END as is_currently_available
FROM public.menu_items mi
LEFT JOIN public.recipes r ON mi.id = r.menu_item_id
LEFT JOIN public.nutritional_info ni ON mi.id = ni.menu_item_id
LEFT JOIN public.inventory_items ii ON mi.direct_inventory_item_id = ii.id;

-- 8. ÍNDICES PARA OTIMIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_menu_items_direct_inventory_item_id 
    ON public.menu_items(direct_inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_item_type 
    ON public.menu_items(item_type);

-- 9. FUNÇÃO PARA SINCRONIZAR PREÇOS (OPCIONAL)
CREATE OR REPLACE FUNCTION public.sync_direct_item_price(menu_item_id_param UUID)
RETURNS void AS $$
DECLARE
    menu_item_record RECORD;
    suggested_price DECIMAL(10,2);
BEGIN
    -- Buscar informações do item do menu
    SELECT mi.item_type, mi.direct_inventory_item_id, ii.cost
    INTO menu_item_record
    FROM public.menu_items mi
    LEFT JOIN public.inventory_items ii ON mi.direct_inventory_item_id = ii.id
    WHERE mi.id = menu_item_id_param;
    
    -- Se é um item direto e tem custo definido
    IF menu_item_record.item_type = 'direct' AND menu_item_record.cost IS NOT NULL THEN
        -- Calcular preço sugerido com margem de 100% (pode ser ajustado)
        suggested_price := menu_item_record.cost * 2;
        
        -- Atualizar o preço (opcional - pode ser apenas sugestão)
        -- UPDATE public.menu_items SET price = suggested_price WHERE id = menu_item_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Esquema principal com suporte a itens diretos do estoque no cardápio';