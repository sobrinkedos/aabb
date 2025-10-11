-- Fix inventory_categories unique constraint to allow same names across different companies
-- This migration removes the global unique constraint on name and adds a composite unique constraint

-- Remove any existing unique constraint on name only
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_categories_name_key'
    ) THEN
        ALTER TABLE public.inventory_categories DROP CONSTRAINT inventory_categories_name_key;
    END IF;
END $$;

-- Add composite unique constraint for empresa_id + name
-- This allows different companies to have categories with the same name
ALTER TABLE public.inventory_categories 
    DROP CONSTRAINT IF EXISTS inventory_categories_empresa_name_unique;

ALTER TABLE public.inventory_categories 
    ADD CONSTRAINT inventory_categories_empresa_name_unique 
    UNIQUE (empresa_id, name);

-- Enable RLS on inventory_categories
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can insert categories for their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can update categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can delete categories from their company" ON public.inventory_categories;
DROP POLICY IF EXISTS "Service role has full access" ON public.inventory_categories;

-- Create RLS policies for inventory_categories
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

-- Add comment
COMMENT ON CONSTRAINT inventory_categories_empresa_name_unique ON public.inventory_categories 
    IS 'Ensures category names are unique within each company, but allows same names across different companies';
