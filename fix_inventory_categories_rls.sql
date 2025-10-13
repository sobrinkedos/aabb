-- Corrigir políticas RLS para inventory_categories
-- Esta migração adiciona políticas RLS adequadas para a tabela inventory_categories

-- Primeiro, verificar se a tabela existe e tem RLS habilitado
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários autenticados podem ver categorias ativas da sua empresa
DROP POLICY IF EXISTS "Usuários podem ver categorias da empresa" ON inventory_categories;
CREATE POLICY "Usuários podem ver categorias da empresa" ON inventory_categories
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id() OR
    empresa_id IS NULL -- Permitir categorias globais se existirem
  );

-- Política para INSERT - usuários com privilégios podem criar categorias
DROP POLICY IF EXISTS "Usuários podem criar categorias" ON inventory_categories;
CREATE POLICY "Usuários podem criar categorias" ON inventory_categories
  FOR INSERT WITH CHECK (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = inventory_categories.empresa_id
      AND ue.papel IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND ue.ativo = true
      AND ue.tem_acesso_sistema = true
    )
  );

-- Política para UPDATE - usuários com privilégios podem atualizar categorias
DROP POLICY IF EXISTS "Usuários podem atualizar categorias" ON inventory_categories;
CREATE POLICY "Usuários podem atualizar categorias" ON inventory_categories
  FOR UPDATE USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = inventory_categories.empresa_id
      AND ue.papel IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND ue.ativo = true
      AND ue.tem_acesso_sistema = true
    )
  );

-- Política para DELETE - apenas administradores podem excluir categorias
DROP POLICY IF EXISTS "Administradores podem excluir categorias" ON inventory_categories;
CREATE POLICY "Administradores podem excluir categorias" ON inventory_categories
  FOR DELETE USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = inventory_categories.empresa_id
      AND ue.papel IN ('SUPER_ADMIN', 'ADMIN')
      AND ue.ativo = true
      AND ue.tem_acesso_sistema = true
    )
  );

-- Verificar se a coluna empresa_id existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventory_categories' 
                   AND column_name = 'empresa_id') THEN
        ALTER TABLE inventory_categories ADD COLUMN empresa_id UUID REFERENCES empresas(id);
        
        -- Atualizar registros existentes com a empresa padrão (se houver)
        UPDATE inventory_categories 
        SET empresa_id = (SELECT id FROM empresas LIMIT 1)
        WHERE empresa_id IS NULL;
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE inventory_categories IS 'Categorias de inventário com controle de acesso por empresa';
COMMENT ON COLUMN inventory_categories.empresa_id IS 'ID da empresa proprietária da categoria';