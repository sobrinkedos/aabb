-- ===============================================================================
-- CORREÇÃO COMPLETA: RLS para todas as tabelas do app
-- Data: 2025-11-01
-- Objetivo: Configurar empresa_id e RLS em todas as tabelas necessárias
-- ===============================================================================

-- IMPORTANTE: Execute este script e depois RECARREGUE o schema no Supabase
-- Settings > API > Reload schema

-- 1. BAR_TABLES
-- ===============================================================================
ALTER TABLE public.bar_tables ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.bar_tables SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_bar_tables_empresa_id ON public.bar_tables(empresa_id);

-- 2. COMANDAS
-- ===============================================================================
ALTER TABLE public.comandas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.comandas c SET empresa_id = bt.empresa_id FROM public.bar_tables bt WHERE c.table_id = bt.id AND c.empresa_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_comandas_empresa_id ON public.comandas(empresa_id);

-- 3. COMANDA_ITEMS
-- ===============================================================================
ALTER TABLE public.comanda_items ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.comanda_items ci SET empresa_id = c.empresa_id FROM public.comandas c WHERE ci.comanda_id = c.id AND ci.empresa_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_comanda_items_empresa_id ON public.comanda_items(empresa_id);

-- 4. MENU_ITEMS
-- ===============================================================================
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
UPDATE public.menu_items SET empresa_id = (SELECT id FROM public.empresas LIMIT 1) WHERE empresa_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_empresa_id ON public.menu_items(empresa_id);

-- 5. HABILITAR RLS
-- ===============================================================================
ALTER TABLE public.bar_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 6. REMOVER POLÍTICAS ANTIGAS
-- ===============================================================================
DROP POLICY IF EXISTS "bar_tables_select_empresa" ON public.bar_tables;
DROP POLICY IF EXISTS "bar_tables_modify_empresa" ON public.bar_tables;
DROP POLICY IF EXISTS "comandas_select_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_delete_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comanda_items_select_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_insert_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_update_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_delete_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "menu_items_select_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_empresa" ON public.menu_items;

-- 7. CRIAR POLÍTICAS RLS
-- ===============================================================================

-- BAR_TABLES
CREATE POLICY "bar_tables_select_empresa" ON public.bar_tables FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = bar_tables.empresa_id)
);
CREATE POLICY "bar_tables_modify_empresa" ON public.bar_tables FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = bar_tables.empresa_id)
);

-- COMANDAS
CREATE POLICY "comandas_select_empresa" ON public.comandas FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comandas.empresa_id)
);
CREATE POLICY "comandas_insert_empresa" ON public.comandas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comandas.empresa_id)
);
CREATE POLICY "comandas_update_empresa" ON public.comandas FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comandas.empresa_id)
);
CREATE POLICY "comandas_delete_empresa" ON public.comandas FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comandas.empresa_id)
);

-- COMANDA_ITEMS
CREATE POLICY "comanda_items_select_empresa" ON public.comanda_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comanda_items.empresa_id)
);
CREATE POLICY "comanda_items_insert_empresa" ON public.comanda_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comanda_items.empresa_id)
);
CREATE POLICY "comanda_items_update_empresa" ON public.comanda_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comanda_items.empresa_id)
);
CREATE POLICY "comanda_items_delete_empresa" ON public.comanda_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = comanda_items.empresa_id)
);

-- MENU_ITEMS
CREATE POLICY "menu_items_select_empresa" ON public.menu_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = menu_items.empresa_id)
);
CREATE POLICY "menu_items_insert_empresa" ON public.menu_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = menu_items.empresa_id)
);
CREATE POLICY "menu_items_update_empresa" ON public.menu_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = menu_items.empresa_id)
);
CREATE POLICY "menu_items_delete_empresa" ON public.menu_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios_empresa ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = menu_items.empresa_id)
);

-- 8. TRIGGERS PARA AUTO-PREENCHER empresa_id
-- ===============================================================================

-- Trigger para comandas
CREATE OR REPLACE FUNCTION public.set_comanda_empresa_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.empresa_id IS NULL AND NEW.table_id IS NOT NULL THEN
        SELECT empresa_id INTO NEW.empresa_id FROM public.bar_tables WHERE id = NEW.table_id;
    END IF;
    IF NEW.empresa_id IS NULL THEN
        SELECT empresa_id INTO NEW.empresa_id FROM public.usuarios_empresa WHERE user_id = auth.uid() LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_comanda_empresa_id ON public.comandas;
CREATE TRIGGER trigger_set_comanda_empresa_id BEFORE INSERT ON public.comandas FOR EACH ROW EXECUTE FUNCTION public.set_comanda_empresa_id();

-- Trigger para comanda_items
CREATE OR REPLACE FUNCTION public.set_comanda_item_empresa_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.empresa_id IS NULL AND NEW.comanda_id IS NOT NULL THEN
        SELECT empresa_id INTO NEW.empresa_id FROM public.comandas WHERE id = NEW.comanda_id;
    END IF;
    IF NEW.empresa_id IS NULL THEN
        SELECT empresa_id INTO NEW.empresa_id FROM public.usuarios_empresa WHERE user_id = auth.uid() LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_comanda_item_empresa_id ON public.comanda_items;
CREATE TRIGGER trigger_set_comanda_item_empresa_id BEFORE INSERT ON public.comanda_items FOR EACH ROW EXECUTE FUNCTION public.set_comanda_item_empresa_id();

-- Trigger para atualizar total da comanda
CREATE OR REPLACE FUNCTION public.update_comanda_total() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comandas SET total = (
        SELECT COALESCE(SUM(price * quantity), 0) FROM public.comanda_items 
        WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id) AND status != 'cancelled'
    ), updated_at = NOW() WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_comanda_total ON public.comanda_items;
CREATE TRIGGER trigger_update_comanda_total AFTER INSERT OR UPDATE OR DELETE ON public.comanda_items FOR EACH ROW EXECUTE FUNCTION public.update_comanda_total();

-- ===============================================================================
-- FINALIZAÇÃO
-- ===============================================================================
SELECT 'Script executado com sucesso! IMPORTANTE: Vá em Settings > API > Reload schema' as message;
