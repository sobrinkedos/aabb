-- Correção simples para inventory_categories
-- Desabilitar RLS temporariamente para permitir operações

-- Desabilitar RLS na tabela inventory_categories
ALTER TABLE inventory_categories DISABLE ROW LEVEL SECURITY;

-- Verificar se a coluna empresa_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_categories' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE inventory_categories ADD COLUMN empresa_id UUID;
        
        -- Atualizar registros existentes com a empresa padrão
        UPDATE inventory_categories 
        SET empresa_id = 'c53c4376-155a-46a2-bcc1-407eb6ed190a'
        WHERE empresa_id IS NULL;
    END IF;
END $$;

-- Reabilitar RLS com políticas mais permissivas
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

-- Política permissiva para SELECT
DROP POLICY IF EXISTS "Permitir leitura de categorias" ON inventory_categories;
CREATE POLICY "Permitir leitura de categorias" ON inventory_categories
  FOR SELECT USING (true);

-- Política permissiva para INSERT
DROP POLICY IF EXISTS "Permitir criação de categorias" ON inventory_categories;
CREATE POLICY "Permitir criação de categorias" ON inventory_categories
  FOR INSERT WITH CHECK (true);

-- Política permissiva para UPDATE
DROP POLICY IF EXISTS "Permitir atualização de categorias" ON inventory_categories;
CREATE POLICY "Permitir atualização de categorias" ON inventory_categories
  FOR UPDATE USING (true);

-- Política permissiva para DELETE
DROP POLICY IF EXISTS "Permitir exclusão de categorias" ON inventory_categories;
CREATE POLICY "Permitir exclusão de categorias" ON inventory_categories
  FOR DELETE USING (true);