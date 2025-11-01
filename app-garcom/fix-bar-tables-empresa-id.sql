-- ===============================================================================
-- CORREÇÃO: Adicionar empresa_id à tabela bar_tables
-- Data: 2025-11-01
-- Objetivo: Garantir que bar_tables tenha empresa_id para filtrar por empresa
-- ===============================================================================

-- 1. VERIFICAR E ADICIONAR COLUNA empresa_id
-- ===============================================================================
DO $$
BEGIN
    -- Verificar se a coluna empresa_id existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bar_tables' 
        AND column_name = 'empresa_id'
    ) THEN
        RAISE NOTICE 'Coluna empresa_id não existe em bar_tables. Adicionando...';
        
        -- Adicionar coluna empresa_id
        ALTER TABLE public.bar_tables 
        ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Coluna empresa_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe em bar_tables.';
    END IF;
END $$;

-- 2. ATUALIZAR MESAS EXISTENTES SEM empresa_id
-- ===============================================================================
-- Se houver mesas sem empresa_id, vincular à primeira empresa disponível
UPDATE public.bar_tables
SET empresa_id = (SELECT id FROM public.empresas LIMIT 1)
WHERE empresa_id IS NULL;

-- 3. TORNAR empresa_id OBRIGATÓRIO
-- ===============================================================================
ALTER TABLE public.bar_tables 
ALTER COLUMN empresa_id SET NOT NULL;

-- 4. CRIAR ÍNDICE PARA PERFORMANCE
-- ===============================================================================
CREATE INDEX IF NOT EXISTS idx_bar_tables_empresa_id 
ON public.bar_tables(empresa_id);

-- 5. VERIFICAR POLÍTICAS RLS
-- ===============================================================================
-- Garantir que RLS está habilitado
ALTER TABLE public.bar_tables ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "bar_tables_select_empresa" ON public.bar_tables;
DROP POLICY IF EXISTS "bar_tables_modify_empresa" ON public.bar_tables;

-- Criar política de SELECT (usuários podem ver mesas da sua empresa)
CREATE POLICY "bar_tables_select_empresa" ON public.bar_tables
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = bar_tables.empresa_id
    )
);

-- Criar política de INSERT/UPDATE/DELETE (usuários podem modificar mesas da sua empresa)
CREATE POLICY "bar_tables_modify_empresa" ON public.bar_tables
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = bar_tables.empresa_id
    )
);

-- ===============================================================================
-- VERIFICAÇÃO FINAL
-- ===============================================================================
DO $$
DECLARE
    v_total_mesas INTEGER;
    v_mesas_sem_empresa INTEGER;
BEGIN
    -- Contar total de mesas
    SELECT COUNT(*) INTO v_total_mesas FROM public.bar_tables;
    
    -- Contar mesas sem empresa
    SELECT COUNT(*) INTO v_mesas_sem_empresa 
    FROM public.bar_tables 
    WHERE empresa_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CORREÇÃO DE bar_tables - CONCLUÍDA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Coluna empresa_id verificada/criada';
    RAISE NOTICE '✅ Índice criado para performance';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de mesas: %', v_total_mesas;
    RAISE NOTICE 'Mesas sem empresa: %', v_mesas_sem_empresa;
    RAISE NOTICE '';
    
    IF v_mesas_sem_empresa > 0 THEN
        RAISE WARNING 'Ainda existem % mesas sem empresa_id!', v_mesas_sem_empresa;
    END IF;
END $$;

-- ===============================================================================
-- QUERY DE TESTE
-- ===============================================================================
-- Para verificar mesas por empresa:
-- SELECT bt.*, e.nome_fantasia as empresa_nome
-- FROM public.bar_tables bt
-- LEFT JOIN public.empresas e ON e.id = bt.empresa_id
-- ORDER BY e.nome_fantasia, bt.number;
