/*
  Sistema de Movimentação de Estoque
  
  Implementa controle completo de movimentações de estoque com:
  - Registro de todas as entradas e saídas
  - Baixa automática ao criar pedidos (balcão e comandas)
  - Histórico completo de movimentações
  - Rastreabilidade de origem das movimentações
  
  Funcionalidades:
  - Tabela inventory_movements para registrar todas as movimentações
  - Triggers para baixa automática em pedidos de balcão
  - Triggers para baixa automática em pedidos de comandas
  - Funções para entrada manual de estoque
  - Relatórios de movimentação
*/

-- ============================================================================
-- 1. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  
  -- Tipo de movimentação
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN (
    'entrada_compra',      -- Entrada por compra
    'entrada_ajuste',      -- Entrada por ajuste de inventário
    'entrada_devolucao',   -- Entrada por devolução
    'saida_venda',         -- Saída por venda (pedido)
    'saida_perda',         -- Saída por perda/quebra
    'saida_ajuste',        -- Saída por ajuste de inventário
    'saida_transferencia'  -- Saída por transferência
  )),
  
  -- Quantidade e valores
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
  
  -- Estoque antes e depois
  stock_before DECIMAL(10,3) NOT NULL,
  stock_after DECIMAL(10,3) NOT NULL,
  
  -- Referências de origem
  balcao_order_id UUID REFERENCES balcao_orders(id) ON DELETE SET NULL,
  comanda_id UUID REFERENCES comandas(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  
  -- Informações adicionais
  notes TEXT,
  reference_document VARCHAR(100), -- Nota fiscal, documento de compra, etc.
  
  -- Controle
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: quantidade deve ser positiva
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_movements_empresa_id 
  ON inventory_movements(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_item_id 
  ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type 
  ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at 
  ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_balcao_order_id 
  ON inventory_movements(balcao_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_comanda_id 
  ON inventory_movements(comanda_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_date 
  ON inventory_movements(inventory_item_id, created_at DESC);

-- ============================================================================
-- 3. FUNÇÃO AUXILIAR PARA OBTER EMPRESA_ID DO ITEM
-- ============================================================================
CREATE OR REPLACE FUNCTION get_inventory_item_empresa_id(item_id UUID)
RETURNS UUID AS $$
DECLARE
  empresa_id_result UUID;
BEGIN
  SELECT empresa_id INTO empresa_id_result
  FROM inventory_items
  WHERE id = item_id;
  
  RETURN empresa_id_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. FUNÇÃO PARA REGISTRAR MOVIMENTAÇÃO DE ESTOQUE
-- ============================================================================
CREATE OR REPLACE FUNCTION register_inventory_movement(
  p_inventory_item_id UUID,
  p_movement_type VARCHAR,
  p_quantity DECIMAL,
  p_unit_cost DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_reference_document VARCHAR DEFAULT NULL,
  p_balcao_order_id UUID DEFAULT NULL,
  p_comanda_id UUID DEFAULT NULL,
  p_menu_item_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_empresa_id UUID;
  v_current_stock DECIMAL;
  v_new_stock DECIMAL;
  v_movement_id UUID;
  v_user_id UUID;
BEGIN
  -- Obter empresa_id do item
  SELECT empresa_id, current_stock 
  INTO v_empresa_id, v_current_stock
  FROM inventory_items
  WHERE id = p_inventory_item_id;
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Item de estoque não encontrado: %', p_inventory_item_id;
  END IF;
  
  -- Determinar usuário
  v_user_id := COALESCE(p_created_by, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não identificado para registrar movimentação';
  END IF;
  
  -- Calcular novo estoque
  IF p_movement_type LIKE 'entrada_%' THEN
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_movement_type LIKE 'saida_%' THEN
    v_new_stock := v_current_stock - p_quantity;
    
    -- Verificar se há estoque suficiente
    IF v_new_stock < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', 
        v_current_stock, p_quantity;
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', p_movement_type;
  END IF;
  
  -- Registrar movimentação
  INSERT INTO inventory_movements (
    empresa_id,
    inventory_item_id,
    movement_type,
    quantity,
    unit_cost,
    stock_before,
    stock_after,
    balcao_order_id,
    comanda_id,
    menu_item_id,
    notes,
    reference_document,
    created_by
  ) VALUES (
    v_empresa_id,
    p_inventory_item_id,
    p_movement_type,
    p_quantity,
    p_unit_cost,
    v_current_stock,
    v_new_stock,
    p_balcao_order_id,
    p_comanda_id,
    p_menu_item_id,
    p_notes,
    p_reference_document,
    v_user_id
  ) RETURNING id INTO v_movement_id;
  
  -- Atualizar estoque do item
  UPDATE inventory_items
  SET current_stock = v_new_stock,
      last_updated = NOW()
  WHERE id = p_inventory_item_id;
  
  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGER PARA BAIXA AUTOMÁTICA EM ITENS DE BALCÃO
-- ============================================================================
CREATE OR REPLACE FUNCTION process_balcao_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_item RECORD;
  v_order RECORD;
BEGIN
  -- Apenas processar quando o item for inserido
  IF TG_OP = 'INSERT' THEN
    
    -- Buscar informações do item do menu
    SELECT mi.item_type, mi.direct_inventory_item_id, mi.name
    INTO v_menu_item
    FROM menu_items mi
    WHERE mi.id = NEW.menu_item_id;
    
    -- Buscar informações do pedido
    SELECT bo.employee_id, bo.empresa_id
    INTO v_order
    FROM balcao_orders bo
    WHERE bo.id = NEW.balcao_order_id;
    
    -- Se é um item direto do estoque, dar baixa imediatamente
    IF v_menu_item.item_type = 'direct' AND v_menu_item.direct_inventory_item_id IS NOT NULL THEN
      
      -- Registrar movimentação de saída
      PERFORM register_inventory_movement(
        p_inventory_item_id := v_menu_item.direct_inventory_item_id,
        p_movement_type := 'saida_venda',
        p_quantity := NEW.quantity,
        p_unit_cost := NULL,
        p_notes := 'Venda balcão - ' || v_menu_item.name,
        p_reference_document := 'BALCAO-' || NEW.balcao_order_id::TEXT,
        p_balcao_order_id := NEW.balcao_order_id,
        p_comanda_id := NULL,
        p_menu_item_id := NEW.menu_item_id,
        p_created_by := v_order.employee_id
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_process_balcao_item_inventory ON balcao_order_items;

-- Criar novo trigger
CREATE TRIGGER trigger_process_balcao_item_inventory
  AFTER INSERT ON balcao_order_items
  FOR EACH ROW
  EXECUTE FUNCTION process_balcao_item_inventory();

-- ============================================================================
-- 6. TRIGGER PARA BAIXA AUTOMÁTICA EM ITENS DE COMANDA
-- ============================================================================
CREATE OR REPLACE FUNCTION process_comanda_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_item RECORD;
  v_comanda RECORD;
BEGIN
  -- Apenas processar quando o item for inserido
  IF TG_OP = 'INSERT' THEN
    
    -- Buscar informações do item do menu
    SELECT mi.item_type, mi.direct_inventory_item_id, mi.name
    INTO v_menu_item
    FROM menu_items mi
    WHERE mi.id = NEW.menu_item_id;
    
    -- Buscar informações da comanda
    SELECT c.employee_id, c.empresa_id
    INTO v_comanda
    FROM comandas c
    WHERE c.id = NEW.comanda_id;
    
    -- Se é um item direto do estoque, dar baixa imediatamente
    IF v_menu_item.item_type = 'direct' AND v_menu_item.direct_inventory_item_id IS NOT NULL THEN
      
      -- Registrar movimentação de saída
      PERFORM register_inventory_movement(
        p_inventory_item_id := v_menu_item.direct_inventory_item_id,
        p_movement_type := 'saida_venda',
        p_quantity := NEW.quantity,
        p_unit_cost := NULL,
        p_notes := 'Venda comanda - ' || v_menu_item.name,
        p_reference_document := 'COMANDA-' || NEW.comanda_id::TEXT,
        p_balcao_order_id := NULL,
        p_comanda_id := NEW.comanda_id,
        p_menu_item_id := NEW.menu_item_id,
        p_created_by := v_comanda.employee_id
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_process_comanda_item_inventory ON comanda_items;

-- Criar novo trigger
CREATE TRIGGER trigger_process_comanda_item_inventory
  AFTER INSERT ON comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION process_comanda_item_inventory();

-- ============================================================================
-- 7. REMOVER TRIGGERS ANTIGOS QUE CONFLITAM
-- ============================================================================
-- Remover trigger antigo de balcao_orders que processava no pagamento
DROP TRIGGER IF EXISTS trigger_process_balcao_order_inventory ON balcao_orders;
DROP FUNCTION IF EXISTS process_balcao_order_inventory();

-- Remover trigger antigo de order_items se existir
DROP TRIGGER IF EXISTS process_direct_inventory_sale_trigger ON order_items;
DROP FUNCTION IF EXISTS process_direct_inventory_sale();

-- ============================================================================
-- 8. VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View de movimentações com detalhes
CREATE OR REPLACE VIEW inventory_movements_detailed AS
SELECT 
  im.*,
  ii.name as item_name,
  ii.unit as item_unit,
  ic.name as category_name,
  p.name as created_by_name,
  mi.name as menu_item_name,
  bo.order_number as balcao_order_number,
  CASE 
    WHEN im.movement_type LIKE 'entrada_%' THEN 'Entrada'
    WHEN im.movement_type LIKE 'saida_%' THEN 'Saída'
  END as movement_direction,
  CASE im.movement_type
    WHEN 'entrada_compra' THEN 'Compra'
    WHEN 'entrada_ajuste' THEN 'Ajuste de Inventário'
    WHEN 'entrada_devolucao' THEN 'Devolução'
    WHEN 'saida_venda' THEN 'Venda'
    WHEN 'saida_perda' THEN 'Perda/Quebra'
    WHEN 'saida_ajuste' THEN 'Ajuste de Inventário'
    WHEN 'saida_transferencia' THEN 'Transferência'
  END as movement_type_label
FROM inventory_movements im
JOIN inventory_items ii ON im.inventory_item_id = ii.id
LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
LEFT JOIN profiles p ON im.created_by = p.id
LEFT JOIN menu_items mi ON im.menu_item_id = mi.id
LEFT JOIN balcao_orders bo ON im.balcao_order_id = bo.id
ORDER BY im.created_at DESC;

-- View de resumo de movimentações por item
CREATE OR REPLACE VIEW inventory_movements_summary AS
SELECT 
  ii.id as inventory_item_id,
  ii.name as item_name,
  ii.current_stock,
  ii.unit,
  COUNT(*) as total_movements,
  COUNT(*) FILTER (WHERE im.movement_type LIKE 'entrada_%') as total_entries,
  COUNT(*) FILTER (WHERE im.movement_type LIKE 'saida_%') as total_exits,
  SUM(im.quantity) FILTER (WHERE im.movement_type LIKE 'entrada_%') as total_quantity_in,
  SUM(im.quantity) FILTER (WHERE im.movement_type LIKE 'saida_%') as total_quantity_out,
  SUM(im.total_cost) FILTER (WHERE im.movement_type LIKE 'entrada_%') as total_cost_in,
  MAX(im.created_at) as last_movement_at
FROM inventory_items ii
LEFT JOIN inventory_movements im ON ii.id = im.inventory_item_id
GROUP BY ii.id, ii.name, ii.current_stock, ii.unit;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Política de SELECT - usuários podem ver movimentações da sua empresa
CREATE POLICY "inventory_movements_select_empresa" ON inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_empresa ue
      WHERE ue.empresa_id = inventory_movements.empresa_id
        AND ue.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = inventory_movements.empresa_id
        AND e.email_admin = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Política de INSERT - funcionários podem criar movimentações
CREATE POLICY "inventory_movements_insert_empresa" ON inventory_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_empresa ue
      WHERE ue.empresa_id = inventory_movements.empresa_id
        AND ue.user_id = auth.uid()
        AND ue.tipo_usuario IN ('admin', 'funcionario')
    ) OR
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = inventory_movements.empresa_id
        AND e.email_admin = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON TABLE inventory_movements IS 'Registro de todas as movimentações de estoque (entradas e saídas)';
COMMENT ON COLUMN inventory_movements.movement_type IS 'Tipo de movimentação: entrada_compra, entrada_ajuste, entrada_devolucao, saida_venda, saida_perda, saida_ajuste, saida_transferencia';
COMMENT ON COLUMN inventory_movements.stock_before IS 'Estoque antes da movimentação';
COMMENT ON COLUMN inventory_movements.stock_after IS 'Estoque após a movimentação';
COMMENT ON COLUMN inventory_movements.reference_document IS 'Documento de referência (nota fiscal, etc)';

COMMENT ON FUNCTION register_inventory_movement IS 'Função para registrar movimentação de estoque com validações e atualização automática';
COMMENT ON VIEW inventory_movements_detailed IS 'Visão detalhada das movimentações com informações relacionadas';
COMMENT ON VIEW inventory_movements_summary IS 'Resumo de movimentações por item de estoque';
