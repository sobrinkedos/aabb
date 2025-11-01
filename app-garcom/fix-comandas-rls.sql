-- ===============================================================================
-- CORREÇÃO: Políticas RLS para tabela comandas
-- Data: 2025-11-01
-- Objetivo: Permitir que usuários criem e gerenciem comandas da sua empresa
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
        AND table_name = 'comandas' 
        AND column_name = 'empresa_id'
    ) THEN
        RAISE NOTICE 'Coluna empresa_id não existe em comandas. Adicionando...';
        
        -- Adicionar coluna empresa_id
        ALTER TABLE public.comandas 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
        
        -- Atualizar comandas existentes com empresa_id baseado na mesa
        UPDATE public.comandas c
        SET empresa_id = bt.empresa_id
        FROM public.bar_tables bt
        WHERE c.table_id = bt.id
        AND c.empresa_id IS NULL;
        
        RAISE NOTICE 'Coluna empresa_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe em comandas.';
    END IF;
END $$;

-- 2. CRIAR ÍNDICE PARA PERFORMANCE
-- ===============================================================================
CREATE INDEX IF NOT EXISTS idx_comandas_empresa_id 
ON public.comandas(empresa_id);

CREATE INDEX IF NOT EXISTS idx_comandas_status 
ON public.comandas(status);

CREATE INDEX IF NOT EXISTS idx_comandas_employee_id 
ON public.comandas(employee_id);

-- 3. HABILITAR RLS
-- ===============================================================================
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS
-- ===============================================================================
DROP POLICY IF EXISTS "comandas_select_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_empresa" ON public.comandas;
DROP POLICY IF EXISTS "comandas_delete_empresa" ON public.comandas;

-- 5. CRIAR NOVAS POLÍTICAS RLS
-- ===============================================================================

-- Política de SELECT: Usuários podem ver comandas da sua empresa
CREATE POLICY "comandas_select_empresa" ON public.comandas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comandas.empresa_id
    )
);

-- Política de INSERT: Usuários podem criar comandas para sua empresa
CREATE POLICY "comandas_insert_empresa" ON public.comandas
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comandas.empresa_id
    )
);

-- Política de UPDATE: Usuários podem atualizar comandas da sua empresa
CREATE POLICY "comandas_update_empresa" ON public.comandas
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comandas.empresa_id
    )
);

-- Política de DELETE: Usuários podem deletar comandas da sua empresa
CREATE POLICY "comandas_delete_empresa" ON public.comandas
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = comandas.empresa_id
    )
);

-- 6. CRIAR FUNÇÃO PARA PREENCHER empresa_id AUTOMATICAMENTE
-- ===============================================================================
CREATE OR REPLACE FUNCTION public.set_comanda_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se empresa_id não foi fornecido, buscar da mesa
    IF NEW.empresa_id IS NULL AND NEW.table_id IS NOT NULL THEN
        SELECT empresa_id INTO NEW.empresa_id
        FROM public.bar_tables
        WHERE id = NEW.table_id;
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
DROP TRIGGER IF EXISTS trigger_set_comanda_empresa_id ON public.comandas;
CREATE TRIGGER trigger_set_comanda_empresa_id
    BEFORE INSERT ON public.comandas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_comanda_empresa_id();

-- 8. ATUALIZAR COMANDAS EXISTENTES SEM empresa_id
-- ===============================================================================
UPDATE public.comandas c
SET empresa_id = bt.empresa_id
FROM public.bar_tables bt
WHERE c.table_id = bt.id
AND c.empresa_id IS NULL;

-- Para comandas sem table_id (balcão), usar empresa do employee
UPDATE public.comandas c
SET empresa_id = ue.empresa_id
FROM public.usuarios_empresa ue
WHERE c.employee_id = ue.user_id
AND c.empresa_id IS NULL;

-- ===============================================================================
-- VERIFICAÇÃO FINAL
-- ===============================================================================
DO $$
DECLARE
    v_total_comandas INTEGER;
    v_comandas_sem_empresa INTEGER;
BEGIN
    -- Contar total de comandas
    SELECT COUNT(*) INTO v_total_comandas FROM public.comandas;
    
    -- Contar comandas sem empresa
    SELECT COUNT(*) INTO v_comandas_sem_empresa 
    FROM public.comandas 
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CORREÇÃO DE COMANDAS RLS - CONCLUÍDA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Coluna empresa_id verificada/criada';
    RAISE NOTICE '✅ Índices criados para performance';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Trigger para auto-preencher empresa_id criado';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de comandas: %', v_total_comandas;
    RAISE NOTICE 'Comandas sem empresa: %', v_comandas_sem_empresa;
    RAISE NOTICE '';
    
    IF v_comandas_sem_empresa > 0 THEN
        RAISE WARNING 'Ainda existem % comandas sem empresa_id!', v_comandas_sem_empresa;
    END IF;
END $$;
