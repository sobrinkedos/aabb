-- ===============================================================================
-- CORREÇÃO: Políticas RLS para tabela menu_items
-- Data: 2025-11-01
-- Objetivo: Permitir que usuários vejam itens do menu da sua empresa
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
        AND table_name = 'menu_items' 
        AND column_name = 'empresa_id'
    ) THEN
        RAISE NOTICE 'Coluna empresa_id não existe em menu_items. Adicionando...';
        
        -- Adicionar coluna empresa_id
        ALTER TABLE public.menu_items 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
        
        -- Atualizar itens existentes com empresa_id da primeira empresa
        UPDATE public.menu_items
        SET empresa_id = (SELECT id FROM public.empresas LIMIT 1)
        WHERE empresa_id IS NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe em menu_items.';
    END IF;
END $$;

-- 2. CRIAR ÍNDICE PARA PERFORMANCE
-- ===============================================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_empresa_id 
ON public.menu_items(empresa_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_available 
ON public.menu_items(available);

CREATE INDEX IF NOT EXISTS idx_menu_items_category 
ON public.menu_items(category);

-- 3. HABILITAR RLS
-- ===============================================================================
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS
-- ===============================================================================
DROP POLICY IF EXISTS "menu_items_select_all" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_select_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_empresa" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_empresa" ON public.menu_items;

-- 5. CRIAR NOVAS POLÍTICAS RLS
-- ===============================================================================

-- Política de SELECT: Usuários podem ver itens do menu da sua empresa
CREATE POLICY "menu_items_select_empresa" ON public.menu_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = menu_items.empresa_id
    )
);

-- Política de INSERT: Usuários podem criar itens do menu para sua empresa
CREATE POLICY "menu_items_insert_empresa" ON public.menu_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = menu_items.empresa_id
    )
);

-- Política de UPDATE: Usuários podem atualizar itens do menu da sua empresa
CREATE POLICY "menu_items_update_empresa" ON public.menu_items
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = menu_items.empresa_id
    )
);

-- Política de DELETE: Usuários podem deletar itens do menu da sua empresa
CREATE POLICY "menu_items_delete_empresa" ON public.menu_items
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = menu_items.empresa_id
    )
);

-- ===============================================================================
-- VERIFICAÇÃO FINAL
-- ===============================================================================
DO $$
DECLARE
    v_total_items INTEGER;
    v_items_sem_empresa INTEGER;
BEGIN
    -- Contar total de itens
    SELECT COUNT(*) INTO v_total_items FROM public.menu_items;
    
    -- Contar itens sem empresa
    SELECT COUNT(*) INTO v_items_sem_empresa 
    FROM public.menu_items 
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CORREÇÃO DE MENU_ITEMS RLS - CONCLUÍDA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Coluna empresa_id verificada/criada';
    RAISE NOTICE '✅ Índices criados para performance';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de itens do menu: %', v_total_items;
    RAISE NOTICE 'Itens sem empresa: %', v_items_sem_empresa;
    RAISE NOTICE '';
    
    IF v_items_sem_empresa > 0 THEN
        RAISE WARNING 'Ainda existem % itens sem empresa_id!', v_items_sem_empresa;
    END IF;
END $$;
