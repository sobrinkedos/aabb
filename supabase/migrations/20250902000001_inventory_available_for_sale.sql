/*
  # Adicionar campo 'available_for_sale' aos itens de inventário
  
  Esta migração adiciona a funcionalidade para marcar itens do estoque como 
  disponíveis para venda direta no balcão e comandas.
  
  ## Modificações:
  - Adiciona campo available_for_sale na tabela inventory_items
  - Atualiza a view menu_items_complete para incluir produtos do estoque
  - Cria função para sincronizar produtos disponíveis automaticamente
*/

-- 1. ADICIONAR CAMPO À TABELA INVENTORY_ITEMS
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS available_for_sale BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.inventory_items.available_for_sale IS 'Indica se o item está disponível para venda direta no balcão/comandas';

-- 2. FUNÇÃO PARA CRIAR AUTOMATICAMENTE ITENS DO MENU PARA PRODUTOS PRONTOS
CREATE OR REPLACE FUNCTION public.sync_inventory_to_menu()
RETURNS void AS $$
DECLARE
    inventory_record RECORD;
    existing_menu_item_id UUID;
    category_name TEXT;
BEGIN
    -- Iterar sobre itens do estoque marcados como disponíveis para venda
    FOR inventory_record IN 
        SELECT 
            i.*,
            COALESCE(c.name, 'Produtos Prontos') as category_name
        FROM public.inventory_items i
        LEFT JOIN public.inventory_categories c ON i.category_id = c.id
        WHERE i.available_for_sale = TRUE AND i.current_stock > 0
    LOOP
        -- Verificar se já existe um item do menu para este produto
        SELECT id INTO existing_menu_item_id
        FROM public.menu_items
        WHERE direct_inventory_item_id = inventory_record.id
        AND item_type = 'direct';
        
        -- Se não existe, criar novo item do menu
        IF existing_menu_item_id IS NULL THEN
            INSERT INTO public.menu_items (
                name,
                description,
                price,
                category,
                available,
                item_type,
                direct_inventory_item_id,
                created_at
            ) VALUES (
                inventory_record.name,
                CASE 
                    WHEN inventory_record.category_name != 'Produtos Prontos' 
                    THEN 'Produto pronto da categoria ' || inventory_record.category_name
                    ELSE 'Produto pronto disponível no estoque'
                END,
                CASE 
                    WHEN inventory_record.cost IS NOT NULL AND inventory_record.cost > 0 
                    THEN inventory_record.cost * 2.0  -- Margem de 100%
                    ELSE 10.00  -- Preço padrão se não houver custo
                END,
                inventory_record.category_name,
                TRUE,
                'direct',
                inventory_record.id,
                NOW()
            );
        ELSE
            -- Atualizar disponibilidade e categoria do item existente
            UPDATE public.menu_items
            SET available = TRUE,
                category = inventory_record.category_name,
                description = CASE 
                    WHEN inventory_record.category_name != 'Produtos Prontos' 
                    THEN 'Produto pronto da categoria ' || inventory_record.category_name
                    ELSE 'Produto pronto disponível no estoque'
                END,
                updated_at = NOW()
            WHERE id = existing_menu_item_id;
        END IF;
    END LOOP;
    
    -- Desabilitar itens do menu cujos produtos não estão mais disponíveis para venda
    UPDATE public.menu_items
    SET available = FALSE,
        updated_at = NOW()
    WHERE item_type = 'direct'
    AND direct_inventory_item_id IN (
        SELECT id FROM public.inventory_items 
        WHERE available_for_sale = FALSE OR current_stock = 0
    );
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.trigger_sync_inventory_to_menu()
RETURNS TRIGGER AS $$
BEGIN
    -- Executar sincronização quando houver mudanças relevantes
    PERFORM public.sync_inventory_to_menu();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para sincronização automática
DROP TRIGGER IF EXISTS sync_inventory_to_menu_trigger ON public.inventory_items;
CREATE TRIGGER sync_inventory_to_menu_trigger
    AFTER INSERT OR UPDATE OF available_for_sale, current_stock
    ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_sync_inventory_to_menu();

-- 4. EXECUTAR SINCRONIZAÇÃO INICIAL
SELECT public.sync_inventory_to_menu();

-- 5. ATUALIZAR POLÍTICAS RLS SE NECESSÁRIO
-- (As políticas existentes já cobrem as necessidades)

-- 6. CRIAR ÍNDICES PARA OTIMIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_inventory_items_available_for_sale 
    ON public.inventory_items(available_for_sale);
CREATE INDEX IF NOT EXISTS idx_inventory_items_available_stock 
    ON public.inventory_items(available_for_sale, current_stock);