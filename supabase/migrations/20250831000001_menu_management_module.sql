/*
  # Módulo de Gestão de Cardápio - Estrutura de Banco de Dados
  
  Esta migração cria a estrutura completa para o módulo de gestão de cardápio,
  incluindo receitas, informações nutricionais, combos e histórico de preços.
  
  ## Tabelas Criadas:
  - recipes: Receitas detalhadas para cada item do cardápio
  - recipe_ingredients: Ingredientes de cada receita com quantidades
  - nutritional_info: Informações nutricionais dos itens
  - menu_combos: Combos e promoções
  - price_history: Histórico de mudanças de preços
  
  ## Requisitos Atendidos: 1.1, 1.2, 1.3, 3.1, 3.2
*/

-- 1. TABELA DE RECEITAS
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  instructions TEXT,
  prep_time INTEGER, -- tempo de preparo em minutos
  cook_time INTEGER, -- tempo de cozimento em minutos
  servings INTEGER DEFAULT 1,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  cost_per_serving DECIMAL(10,2),
  margin_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recipes IS 'Receitas detalhadas para itens do cardápio';
COMMENT ON COLUMN public.recipes.difficulty_level IS 'Nível de dificuldade de 1 (fácil) a 5 (muito difícil)';
COMMENT ON COLUMN public.recipes.prep_time IS 'Tempo de preparo em minutos';
COMMENT ON COLUMN public.recipes.cook_time IS 'Tempo de cozimento em minutos';

-- 2. TABELA DE INGREDIENTES DAS RECEITAS
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  alternative_ingredients JSONB, -- Array de ingredientes alternativos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recipe_ingredients IS 'Ingredientes necessários para cada receita';
COMMENT ON COLUMN public.recipe_ingredients.alternative_ingredients IS 'JSON com ingredientes alternativos: [{"inventory_item_id": "uuid", "quantity": 100, "cost_adjustment": 0.5}]';

-- 3. TABELA DE INFORMAÇÕES NUTRICIONAIS
CREATE TABLE public.nutritional_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  calories_per_serving DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sodium_mg DECIMAL(8,2),
  allergens TEXT[], -- Array de alérgenos
  dietary_restrictions TEXT[], -- vegetarian, vegan, gluten-free, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.nutritional_info IS 'Informações nutricionais dos itens do cardápio';
COMMENT ON COLUMN public.nutritional_info.allergens IS 'Array de alérgenos: glúten, lactose, amendoim, etc.';
COMMENT ON COLUMN public.nutritional_info.dietary_restrictions IS 'Array de restrições: vegetarian, vegan, gluten-free, etc.';

-- 4. TABELA DE COMBOS DO CARDÁPIO
CREATE TABLE public.menu_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  combo_items JSONB NOT NULL, -- Array de {menu_item_id, quantity}
  original_price DECIMAL(10,2) NOT NULL,
  combo_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  conditions JSONB, -- Condições especiais (horário, dia da semana, etc.)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.menu_combos IS 'Combos e promoções do cardápio';
COMMENT ON COLUMN public.menu_combos.combo_items IS 'JSON com itens do combo: [{"menu_item_id": "uuid", "quantity": 1}]';
COMMENT ON COLUMN public.menu_combos.conditions IS 'JSON com condições: {"valid_hours": ["12:00", "14:00"], "valid_days": [1,2,3,4,5]}';

-- 5. TABELA DE HISTÓRICO DE PREÇOS
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  reason TEXT,
  cost_change_percentage DECIMAL(5,2), -- Percentual de mudança no custo
  margin_impact DECIMAL(5,2), -- Impacto na margem
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.price_history IS 'Histórico de mudanças de preços dos itens';
COMMENT ON COLUMN public.price_history.reason IS 'Motivo da mudança: aumento de custo, promoção, ajuste de margem, etc.';

-- 6. EXTENSÃO DA TABELA MENU_ITEMS (adicionar colunas para gestão avançada)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'paused', 'seasonal')),
ADD COLUMN IF NOT EXISTS seasonal_start_month INTEGER CHECK (seasonal_start_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS seasonal_end_month INTEGER CHECK (seasonal_end_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Tags para busca: picante, light, especial, etc.
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.menu_items.availability_status IS 'Status de disponibilidade: available, out_of_stock, paused, seasonal';
COMMENT ON COLUMN public.menu_items.seasonal_start_month IS 'Mês de início da sazonalidade (1-12)';
COMMENT ON COLUMN public.menu_items.seasonal_end_month IS 'Mês de fim da sazonalidade (1-12)';
COMMENT ON COLUMN public.menu_items.tags IS 'Tags para facilitar busca e categorização';

-- 7. ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
CREATE INDEX idx_recipes_menu_item_id ON public.recipes(menu_item_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_inventory_item_id ON public.recipe_ingredients(inventory_item_id);
CREATE INDEX idx_nutritional_info_menu_item_id ON public.nutritional_info(menu_item_id);
CREATE INDEX idx_price_history_menu_item_id ON public.price_history(menu_item_id);
CREATE INDEX idx_price_history_changed_at ON public.price_history(changed_at DESC);
CREATE INDEX idx_menu_items_availability_status ON public.menu_items(availability_status);
CREATE INDEX idx_menu_items_category ON public.menu_items(category);
CREATE INDEX idx_menu_items_tags ON public.menu_items USING GIN(tags);
CREATE INDEX idx_menu_combos_active ON public.menu_combos(active);
CREATE INDEX idx_menu_combos_valid_period ON public.menu_combos(valid_from, valid_until);

-- 8. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON public.recipes 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutritional_info_updated_at 
    BEFORE UPDATE ON public.nutritional_info 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_combos_updated_at 
    BEFORE UPDATE ON public.menu_combos 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON public.menu_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. FUNÇÃO PARA CALCULAR CUSTO DA RECEITA
CREATE OR REPLACE FUNCTION public.calculate_recipe_cost(recipe_id_param UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_cost DECIMAL(10,2) := 0;
    ingredient_record RECORD;
BEGIN
    FOR ingredient_record IN 
        SELECT ri.quantity, ri.unit, ii.cost, ii.unit as inventory_unit
        FROM public.recipe_ingredients ri
        JOIN public.inventory_items ii ON ri.inventory_item_id = ii.id
        WHERE ri.recipe_id = recipe_id_param
    LOOP
        -- Cálculo simples assumindo mesma unidade (pode ser expandido)
        total_cost := total_cost + (ingredient_record.quantity * COALESCE(ingredient_record.cost, 0));
    END LOOP;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA VERIFICAR DISPONIBILIDADE BASEADA NO ESTOQUE
CREATE OR REPLACE FUNCTION public.check_recipe_availability(recipe_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    ingredient_record RECORD;
    available BOOLEAN := TRUE;
BEGIN
    FOR ingredient_record IN 
        SELECT ri.quantity, ii.current_stock, ri.is_optional
        FROM public.recipe_ingredients ri
        JOIN public.inventory_items ii ON ri.inventory_item_id = ii.id
        WHERE ri.recipe_id = recipe_id_param
    LOOP
        -- Se ingrediente obrigatório não tem estoque suficiente
        IF NOT ingredient_record.is_optional AND 
           ingredient_record.current_stock < ingredient_record.quantity THEN
            available := FALSE;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN available;
END;
$$ LANGUAGE plpgsql;
-- 11. 
POLÍTICAS RLS (ROW LEVEL SECURITY)

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritional_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA RECEITAS
CREATE POLICY "Admins têm acesso completo às receitas" 
    ON public.recipes FOR ALL 
    USING (public.get_my_role() = 'admin') 
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Usuários autenticados podem visualizar receitas" 
    ON public.recipes FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Funcionários podem criar e editar receitas" 
    ON public.recipes FOR INSERT 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

CREATE POLICY "Funcionários podem atualizar receitas" 
    ON public.recipes FOR UPDATE 
    USING (public.get_my_role() IN ('admin', 'employee')) 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- POLÍTICAS PARA INGREDIENTES DAS RECEITAS
CREATE POLICY "Admins têm acesso completo aos ingredientes das receitas" 
    ON public.recipe_ingredients FOR ALL 
    USING (public.get_my_role() = 'admin') 
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Usuários autenticados podem visualizar ingredientes das receitas" 
    ON public.recipe_ingredients FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Funcionários podem gerenciar ingredientes das receitas" 
    ON public.recipe_ingredients FOR ALL 
    USING (public.get_my_role() IN ('admin', 'employee')) 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- POLÍTICAS PARA INFORMAÇÕES NUTRICIONAIS
CREATE POLICY "Admins têm acesso completo às informações nutricionais" 
    ON public.nutritional_info FOR ALL 
    USING (public.get_my_role() = 'admin') 
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Usuários autenticados podem visualizar informações nutricionais" 
    ON public.nutritional_info FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Funcionários podem gerenciar informações nutricionais" 
    ON public.nutritional_info FOR ALL 
    USING (public.get_my_role() IN ('admin', 'employee')) 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- POLÍTICAS PARA COMBOS
CREATE POLICY "Admins têm acesso completo aos combos" 
    ON public.menu_combos FOR ALL 
    USING (public.get_my_role() = 'admin') 
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Usuários autenticados podem visualizar combos ativos" 
    ON public.menu_combos FOR SELECT 
    USING (auth.role() = 'authenticated' AND active = true);

CREATE POLICY "Funcionários podem gerenciar combos" 
    ON public.menu_combos FOR ALL 
    USING (public.get_my_role() IN ('admin', 'employee')) 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- POLÍTICAS PARA HISTÓRICO DE PREÇOS
CREATE POLICY "Admins têm acesso completo ao histórico de preços" 
    ON public.price_history FOR ALL 
    USING (public.get_my_role() = 'admin') 
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Usuários autenticados podem visualizar histórico de preços" 
    ON public.price_history FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Funcionários podem adicionar entradas no histórico de preços" 
    ON public.price_history FOR INSERT 
    WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- 12. TRIGGER PARA HISTÓRICO DE PREÇOS AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o preço realmente mudou
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO public.price_history (
            menu_item_id,
            old_price,
            new_price,
            reason,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.price,
            NEW.price,
            'Atualização automática',
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER track_menu_item_price_changes
    AFTER UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.track_price_changes();

-- 13. TRIGGER PARA ATUALIZAR CUSTO DA RECEITA AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.update_recipe_cost_on_ingredient_change()
RETURNS TRIGGER AS $$
DECLARE
    recipe_record RECORD;
    new_cost DECIMAL(10,2);
BEGIN
    -- Atualiza o custo de todas as receitas que usam este ingrediente
    FOR recipe_record IN 
        SELECT DISTINCT r.id, r.servings
        FROM public.recipes r
        JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
        WHERE ri.inventory_item_id = NEW.id
    LOOP
        new_cost := public.calculate_recipe_cost(recipe_record.id);
        
        UPDATE public.recipes 
        SET cost_per_serving = new_cost / recipe_record.servings,
            updated_at = NOW()
        WHERE id = recipe_record.id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_costs_on_inventory_change
    AFTER UPDATE OF cost ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_recipe_cost_on_ingredient_change();

-- 14. VIEWS PARA CONSULTAS OTIMIZADAS

-- View para itens do cardápio com informações completas
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
    CASE 
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
LEFT JOIN public.nutritional_info ni ON mi.id = ni.menu_item_id;

-- View para combos ativos com detalhes
CREATE OR REPLACE VIEW public.active_combos AS
SELECT 
    mc.*,
    CASE 
        WHEN mc.valid_from IS NULL AND mc.valid_until IS NULL THEN true
        WHEN mc.valid_from IS NULL THEN NOW() <= mc.valid_until
        WHEN mc.valid_until IS NULL THEN NOW() >= mc.valid_from
        ELSE NOW() BETWEEN mc.valid_from AND mc.valid_until
    END as is_valid_now
FROM public.menu_combos mc
WHERE mc.active = true;

-- 15. DADOS DE EXEMPLO PARA TESTES (OPCIONAL)
-- Inserir alguns dados de exemplo para facilitar testes

-- Exemplo de receita para um item existente (se houver)
-- INSERT INTO public.recipes (menu_item_id, instructions, prep_time, cook_time, servings, difficulty_level)
-- SELECT id, 'Instruções de preparo exemplo', 15, 10, 1, 2
-- FROM public.menu_items 
-- WHERE name ILIKE '%exemplo%' 
-- LIMIT 1;

COMMENT ON SCHEMA public IS 'Esquema principal com módulo de gestão de cardápio implementado';