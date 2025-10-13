-- ============================================================================
-- VERIFICAÇÃO DE CONSTRAINTS MULTI-TENANT
-- ============================================================================
-- Este script verifica se outras tabelas têm constraints UNIQUE que deveriam
-- considerar empresa_id para isolamento multi-tenant
-- ============================================================================

-- 1. Listar todas as tabelas que têm empresa_id
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'empresa_id'
ORDER BY table_name;

-- 2. Verificar constraints UNIQUE em tabelas com empresa_id
WITH tables_with_empresa AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND column_name = 'empresa_id'
)
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
    pg_get_constraintdef(pgc.oid) AS definition
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN pg_constraint pgc 
    ON pgc.conname = tc.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
    AND tc.table_name IN (SELECT table_name FROM tables_with_empresa)
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, pgc.oid
ORDER BY tc.table_name, tc.constraint_name;

-- 3. Identificar constraints UNIQUE que NÃO incluem empresa_id
-- (Potenciais problemas de isolamento multi-tenant)
WITH tables_with_empresa AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND column_name = 'empresa_id'
),
unique_constraints AS (
    SELECT 
        tc.table_name,
        tc.constraint_name,
        STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name IN (SELECT table_name FROM tables_with_empresa)
    GROUP BY tc.table_name, tc.constraint_name
)
SELECT 
    table_name,
    constraint_name,
    columns,
    CASE 
        WHEN columns LIKE '%empresa_id%' THEN '✅ OK - Inclui empresa_id'
        ELSE '⚠️  ATENÇÃO - Não inclui empresa_id'
    END AS status
FROM unique_constraints
ORDER BY 
    CASE WHEN columns LIKE '%empresa_id%' THEN 1 ELSE 0 END,
    table_name;

-- 4. Verificar tabelas específicas importantes
SELECT 
    'inventory_items' AS table_name,
    COUNT(*) AS unique_constraints,
    STRING_AGG(constraint_name, ', ') AS constraint_names
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND table_name = 'inventory_items'
    AND constraint_type = 'UNIQUE'

UNION ALL

SELECT 
    'menu_items' AS table_name,
    COUNT(*) AS unique_constraints,
    STRING_AGG(constraint_name, ', ') AS constraint_names
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND table_name = 'menu_items'
    AND constraint_type = 'UNIQUE'

UNION ALL

SELECT 
    'inventory_categories' AS table_name,
    COUNT(*) AS unique_constraints,
    STRING_AGG(constraint_name, ', ') AS constraint_names
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND table_name = 'inventory_categories'
    AND constraint_type = 'UNIQUE';

-- 5. Recomendações
SELECT 
    '📋 RECOMENDAÇÕES' AS tipo,
    'Verifique as constraints marcadas com ⚠️  e considere adicionar empresa_id' AS acao;
