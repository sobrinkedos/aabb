-- ============================================
-- BACKUP COMPLETO - aabb-producao
-- Data: 30/01/2025
-- Projeto: jtfdzjmravketpkwjkvp
-- ============================================

-- Este arquivo será preenchido com os dados exportados
-- Execute os comandos abaixo para gerar o backup completo

-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Execute cada seção abaixo separadamente

-- ============================================
-- SEÇÃO 1: BACKUP DE SCHEMA
-- ============================================

-- Para exportar o schema completo, use pg_dump:
-- pg_dump -h db.jtfdzjmravketpkwjkvp.supabase.co -U postgres -d postgres --schema-only > schema_backup.sql

-- ============================================
-- SEÇÃO 2: BACKUP DE DADOS
-- ============================================

-- Empresas
COPY (SELECT * FROM empresas) TO STDOUT WITH CSV HEADER;

-- Profiles
COPY (SELECT * FROM profiles) TO STDOUT WITH CSV HEADER;

-- Employees
COPY (SELECT * FROM employees) TO STDOUT WITH CSV HEADER;

-- Bar Employees
COPY (SELECT * FROM bar_employees) TO STDOUT WITH CSV HEADER;

-- Usuarios Empresa
COPY (SELECT * FROM usuarios_empresa) TO STDOUT WITH CSV HEADER;

-- Permissoes Usuario
COPY (SELECT * FROM permissoes_usuario) TO STDOUT WITH CSV HEADER;

-- Inventory Categories
COPY (SELECT * FROM inventory_categories) TO STDOUT WITH CSV HEADER;

-- Inventory Items
COPY (SELECT * FROM inventory_items) TO STDOUT WITH CSV HEADER;

-- Menu Items
COPY (SELECT * FROM menu_items) TO STDOUT WITH CSV HEADER;

-- Bar Tables
COPY (SELECT * FROM bar_tables) TO STDOUT WITH CSV HEADER;

-- Comandas
COPY (SELECT * FROM comandas) TO STDOUT WITH CSV HEADER;

-- Comanda Items
COPY (SELECT * FROM comanda_items) TO STDOUT WITH CSV HEADER;

-- Balcao Orders
COPY (SELECT * FROM balcao_orders) TO STDOUT WITH CSV HEADER;

-- Balcao Order Items
COPY (SELECT * FROM balcao_order_items) TO STDOUT WITH CSV HEADER;

-- Cash Sessions
COPY (SELECT * FROM cash_sessions) TO STDOUT WITH CSV HEADER;

-- Cash Transactions
COPY (SELECT * FROM cash_transactions) TO STDOUT WITH CSV HEADER;

-- Payment Reconciliation
COPY (SELECT * FROM payment_reconciliation) TO STDOUT WITH CSV HEADER;

-- Inventory Movements
COPY (SELECT * FROM inventory_movements) TO STDOUT WITH CSV HEADER;

-- Logs Auditoria
COPY (SELECT * FROM logs_auditoria) TO STDOUT WITH CSV HEADER;

-- Configuracoes Empresa
COPY (SELECT * FROM configuracoes_empresa) TO STDOUT WITH CSV HEADER;
