-- ===============================================================================
-- CORREÇÃO: Políticas RLS para tabela comanda_items
-- Data: 2025-11-01
-- Objetivo: Permitir que usuários adicionem itens às comandas da sua empresa
-- ===============================================================================

-- 1. VERIFICAR E ADICIONAR COLUNA empresa_id SE NÃO EXISTIR
-- ===============================================================================
DO $$
BEGIN
    -- Verificar se a coluna empresa_id existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comanda_items' 
        AND column_name = 'empresa_id'
    ) THEN
        RAISE NOTICE 'Coluna empresa_id não existe em comanda_items. Adicionando...';
        
        -- Adicionar coluna empresa_id
        ALTER TABLE public.comanda_items 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
        
        -- Atualizar itens existentes com empresa_id baseado na comanda
        UPDATE public.comanda_items ci
        SET empresa_id = c.empresa_id
        FROM public.comandas c
        WHERE ci.comanda_id = c.id
        AND ci.empresa_id IS NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe em comanda_items.';
    END IF;
END $$;

-- 2. CRIAR ÍNDICE PARA PERFORMANCE
-- ===============================================================================
CREATE INDEX IF NOT EXISTS idx_comanda_items_empresa_id 
ON public.comanda_items(empresa_id);

CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda_id 
ON public.comanda_items(comanda_id);

CREATE INDEX IF NOT EXISTS idx_comanda_items_status 
ON public.comanda_items(status);

-- 3. HABILITAR RLS
-- ===============================================================================
ALTER TABLE public.comanda_items ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS
-- ===============================================================================
DROP POLICY IF EXISTS "comanda_items_select_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_insert_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_update_empresa" ON public.comanda_items;
DROP POLICY IF EXISTS "comanda_items_delete_empresa" ON public.comanda_items;

-- 5. CRIAR NOVAS POLÍTICAS RLS
-- ===============================================================================

-- Política de SELECT: Usuários podem ver itens de comandas da sua empresa
CREATE POLICY "comanda_items_select_empresa" ON public.comanda_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comanda_items.empresa_id
    )
);

-- Política de INSERT: Usuários podem adicionar itens a comandas da sua empresa
CREATE POLICY "comanda_items_insert_empresa" ON public.comanda_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comanda_items.empresa_id
    )
);

-- Política de UPDATE: Usuários podem atualizar itens de comandas da sua empresa
CREATE POLICY "comanda_items_update_empresa" ON public.comanda_items
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comanda_items.empresa_id
    )
);

-- Política de DELETE: Usuários podem deletar itens de comandas da sua empresa
CREATE POLICY "comanda_items_delete_empresa" ON public.comanda_items
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comanda_items.empresa_id
    )
);

-- 6. CRIAR FUNÇÃO PARA PREENCHER empresa_id AUTOMATICAMENTE
-- ===============================================================================
CREATE OR REPLACE FUNCTION public.set_comanda_item_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se empresa_id não foi fornecido, buscar da comanda
    IF NEW.empresa_id IS NULL AND NEW.comanda_id IS NOT NULL THEN
        SELECT empresa_id INTO NEW.empresa_id
        FROM public.comandas
        WHERE id = NEW.comanda_id;
    END IF;
    
    -- Se ainda não tem empresa_id, buscar do usuário logado
    IF NEW.empresa_id IS NULL THEN
        SELECT empresa_id INTO NEW.empresa_id
        FROM public.usuarios_empresa
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CRIAR TRIGGER PARA PREENCHER empresa_id
-- ===============================================================================
DROP TRIGGER IF EXISTS trigger_set_comanda_item_empresa_id ON public.comanda_items;
CREATE TRIGGER trigger_set_comanda_item_empresa_id
    BEFORE INSERT ON public.comanda_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_comanda_item_empresa_id();

-- 8. ATUALIZAR ITENS EXISTENTES SEM empresa_id
-- ===============================================================================
UPDATE public.comanda_items ci
SET empresa_id = c.empresa_id
FROM public.comandas c
WHERE ci.comanda_id = c.id
AND ci.empresa_id IS NULL;

-- 9. CRIAR TRIGGER PARA ATUALIZAR TOTAL DA COMANDA
-- ===============================================================================
CREATE OR REPLACE FUNCTION public.update_comanda_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total da comanda
    UPDATE public.comandas
    SET total = (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM public.comanda_items
        WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
        AND status != 'cancelled'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_comanda_total ON public.comanda_items;
CREATE TRIGGER trigger_update_comanda_total
    AFTER INSERT OR UPDATE OR DELETE ON public.comanda_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comanda_total();

-- ===============================================================================
-- VERIFICAÇÃO FINAL
-- ===============================================================================
DO $$
DECLARE
    v_total_items INTEGER;
    v_items_sem_empresa INTEGER;
BEGIN
    -- Contar total de itens
    SELECT COUNT(*) INTO v_total_items FROM public.comanda_items;
    
    -- Contar itens sem empresa
    SELECT COUNT(*) INTO v_items_sem_empresa 
    FROM public.comanda_items 
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CORREÇÃO DE COMANDA_ITEMS RLS - CONCLUÍDA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Coluna empresa_id verificada/criada';
    RAISE NOTICE '✅ Índices criados para performance';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Trigger para auto-preencher empresa_id criado';
    RAISE NOTICE '✅ Trigger para atualizar total da comanda criado';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de itens: %', v_total_items;
    RAISE NOTICE 'Itens sem empresa: %', v_items_sem_empresa;
    RAISE NOTICE '';
    
    IF v_items_sem_empresa > 0 THEN
        RAISE WARNING 'Ainda existem % itens sem empresa_id!', v_items_sem_empresa;
    END IF;
END $$;
