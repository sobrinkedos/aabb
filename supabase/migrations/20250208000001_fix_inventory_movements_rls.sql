-- Fix RLS policies for inventory_movements table
-- Problema: Políticas antigas tentavam acessar auth.users causando erro de permissão
-- Solução: Simplificar políticas para usar apenas usuarios_empresa

-- Remover políticas antigas
DROP POLICY IF EXISTS inventory_movements_select_empresa ON inventory_movements;
DROP POLICY IF EXISTS inventory_movements_insert_empresa ON inventory_movements;

-- Criar política de SELECT simplificada
-- Permite que usuários vejam apenas movimentações da sua empresa
CREATE POLICY inventory_movements_select_empresa ON inventory_movements
FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios_empresa 
    WHERE user_id = auth.uid()
  )
);

-- Criar política de INSERT simplificada
-- Permite que usuários criem movimentações apenas para sua empresa
CREATE POLICY inventory_movements_insert_empresa ON inventory_movements
FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM usuarios_empresa 
    WHERE user_id = auth.uid()
  )
);

-- Comentários
COMMENT ON POLICY inventory_movements_select_empresa ON inventory_movements IS 
'Permite que usuários vejam apenas movimentações da sua empresa';

COMMENT ON POLICY inventory_movements_insert_empresa ON inventory_movements IS 
'Permite que usuários criem movimentações apenas para sua empresa';
