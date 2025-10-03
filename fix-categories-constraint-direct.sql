-- ============================================================================
-- FIX INVENTORY_CATEGORIES UNIQUE CONSTRAINT
-- ============================================================================
-- Este script corrige a constraint UNIQUE da tabela inventory_categories
-- para permitir que diferentes empresas tenham categorias com o mesmo nome
-- ============================================================================

-- 1. Remover constraint UNIQUE global no campo 'name'
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_categories_name_key'
    ) THEN
        ALTER TABLE public.inventory_categories DROP CONSTRAINT inventory_categories_name_key;
        RAISE NOTICE '✅ Constraint inventory_categories_name_key removida';
    ELSE
        RAISE NOTICE '⚠️  Constraint inventory_categories_name_key não existe';
    END IF;
END $$;

-- 2. Adicionar constraint UNIQUE composta (empresa_id + name)
DO $$
BEGIN
    -- Remove se já existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_categories_empresa_name_unique'
    ) THEN
        ALTER TABLE public.inventory_categories DROP CONSTRAINT inventory_categories_empresa_name_unique;
        RAISE NOTICE '⚠️  Constraint antiga removida';
    END IF;

    -- Adiciona a nova constraint
    ALTER TABLE public.inventory_categories 
        ADD CONSTRAINT inventory_categories_empresa_name_unique 
        UNIQUE (empresa_id, name);
    
    RAISE NOTICE '✅ Constraint inventory_categories_empresa_name_unique criada';
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can insert categories for their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can update categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can delete categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Service role has full access" ON public.inventory_categories;
DROP POLICY IF EXISTS "Admins have full access" ON public.inventory_categories;
DROP POLICY IF EXISTS "Authenticated users can view data" ON public.inventory_categories;

-- 5. Criar políticas RLS corretas
-- Policy for SELECT: Users can view categories from their company
CREATE POLICY "Users can view categories from their company"
    ON public.inventory_categories
    FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for INSERT: Users can create categories for their company
CREATE POLICY "Users can insert categories for their company"
    ON public.inventory_categories
    FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for UPDATE: Users can update categories from their company
CREATE POLICY "Users can update categories from their company"
    ON public.inventory_categories
    FOR UPDATE
    USING (
        empresa_id IN (
            SELECT empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for DELETE: Users can delete categories from their company
CREATE POLICY "Users can delete categories from their company"
    ON public.inventory_categories
    FOR DELETE
    USING (
        empresa_id IN (
            SELECT empresa_id 
            FROM public.usuarios_empresa 
            WHERE user_id = auth.uid()
        )
    );

-- Service role bypass (for admin operations)
CREATE POLICY "Service role has full access"
    ON public.inventory_categories
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 6. Adicionar comentário
COMMENT ON CONSTRAINT inventory_categories_empresa_name_unique ON public.inventory_categories 
    IS 'Ensures category names are unique within each company, but allows same names across different companies';

-- 7. Verificar resultado
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conname = 'inventory_categories_empresa_name_unique';
    
    IF constraint_count > 0 THEN
        RAISE NOTICE '✅ SUCESSO! Constraint criada corretamente';
    ELSE
        RAISE NOTICE '❌ ERRO! Constraint não foi criada';
    END IF;
END $$;

-- 8. Mostrar constraints atuais
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.inventory_categories'::regclass
    AND contype = 'u';
