/*
  Sistema de Pedidos de Balcão Independente
  
  Implementa um fluxo completo para pedidos feitos no balcão sem vinculação a comandas,
  com controle de status de pagamento, entrega e baixa automática no estoque.
  
  Funcionalidades:
  - Pedidos independentes de comandas
  - Status: pending_payment -> paid -> delivered
  - Integração com sistema de caixa
  - Baixa automática no estoque
  - Painel de controle para bar e cozinha
*/

-- 1. TABELA DE PEDIDOS DE BALCÃO
CREATE TABLE IF NOT EXISTS balcao_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE, -- Número sequencial para identificação
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  final_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - COALESCE(discount_amount, 0)) STORED,
  
  -- Status do pedido
  status VARCHAR(20) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled')),
  
  -- Controle de pagamento
  payment_method VARCHAR(30) CHECK (payment_method IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia')),
  paid_at TIMESTAMPTZ,
  cash_session_id UUID REFERENCES cash_sessions(id),
  
  -- Controle de preparo
  preparation_started_at TIMESTAMPTZ,
  preparation_completed_at TIMESTAMPTZ,
  
  -- Controle de entrega
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES profiles(id),
  
  -- Observações
  notes TEXT,
  customer_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ITENS DOS PEDIDOS DE BALCÃO
CREATE TABLE IF NOT EXISTS balcao_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balcao_order_id UUID NOT NULL REFERENCES balcao_orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Status individual do item
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  
  -- Controle de preparo
  preparation_started_at TIMESTAMPTZ,
  preparation_completed_at TIMESTAMPTZ,
  preparation_time_minutes INTEGER,
  
  -- Observações específicas do item
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_balcao_orders_employee_id ON balcao_orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_balcao_orders_status ON balcao_orders(status);
CREATE INDEX IF NOT EXISTS idx_balcao_orders_created_at ON balcao_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_balcao_orders_order_number ON balcao_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_balcao_orders_cash_session ON balcao_orders(cash_session_id);

CREATE INDEX IF NOT EXISTS idx_balcao_order_items_order_id ON balcao_order_items(balcao_order_id);
CREATE INDEX IF NOT EXISTS idx_balcao_order_items_menu_item_id ON balcao_order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_balcao_order_items_status ON balcao_order_items(status);

-- 4. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_balcao_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balcao_orders_updated_at
  BEFORE UPDATE ON balcao_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_balcao_orders_updated_at();

CREATE TRIGGER trigger_update_balcao_order_items_updated_at
  BEFORE UPDATE ON balcao_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_balcao_orders_updated_at();

-- 5. TRIGGER PARA ATUALIZAR TOTAL DO PEDIDO
CREATE OR REPLACE FUNCTION update_balcao_order_total()
RETURNS TRIGGER AS $$
DECLARE
  order_total DECIMAL(10,2);
BEGIN
  -- Calcular total dos itens
  SELECT COALESCE(SUM(total_price), 0)
  INTO order_total
  FROM balcao_order_items
  WHERE balcao_order_id = COALESCE(NEW.balcao_order_id, OLD.balcao_order_id)
    AND status != 'cancelled';
  
  -- Atualizar total do pedido
  UPDATE balcao_orders 
  SET total_amount = order_total,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.balcao_order_id, OLD.balcao_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balcao_order_total
  AFTER INSERT OR UPDATE OR DELETE ON balcao_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_balcao_order_total();

-- 6. TRIGGER PARA BAIXA AUTOMÁTICA NO ESTOQUE
CREATE OR REPLACE FUNCTION process_balcao_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  menu_item_record RECORD;
  inventory_item_record RECORD;
BEGIN
  -- Apenas processar quando o status mudar para 'paid' (pago)
  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    
    -- Processar cada item do pedido
    FOR menu_item_record IN 
      SELECT boi.*, mi.item_type, mi.direct_inventory_item_id
      FROM balcao_order_items boi
      JOIN menu_items mi ON boi.menu_item_id = mi.id
      WHERE boi.balcao_order_id = NEW.id
        AND boi.status != 'cancelled'
    LOOP
      -- Se é um item direto do estoque
      IF menu_item_record.item_type = 'direct' AND menu_item_record.direct_inventory_item_id IS NOT NULL THEN
        -- Verificar estoque disponível
        SELECT current_stock
        INTO inventory_item_record
        FROM inventory_items
        WHERE id = menu_item_record.direct_inventory_item_id;
        
        -- Verificar se há estoque suficiente
        IF inventory_item_record.current_stock < menu_item_record.quantity THEN
          RAISE EXCEPTION 'Estoque insuficiente para %. Disponível: %, Solicitado: %', 
            (SELECT name FROM menu_items WHERE id = menu_item_record.menu_item_id),
            inventory_item_record.current_stock, 
            menu_item_record.quantity;
        END IF;
        
        -- Dar baixa no estoque
        UPDATE inventory_items
        SET current_stock = current_stock - menu_item_record.quantity,
            last_updated = NOW()
        WHERE id = menu_item_record.direct_inventory_item_id;
        
        -- Log da movimentação (pode ser implementado depois)
        -- INSERT INTO inventory_movements ...
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_balcao_order_inventory
  AFTER UPDATE ON balcao_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_balcao_order_inventory();

-- 7. TRIGGER PARA ATUALIZAR STATUS DOS ITENS AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_balcao_order_items_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando pedido é pago, marcar itens como 'preparing' se necessário preparo
  IF NEW.status = 'paid' AND OLD.status = 'pending_payment' THEN
    UPDATE balcao_order_items
    SET status = 'preparing',
        preparation_started_at = NOW()
    WHERE balcao_order_id = NEW.id
      AND status = 'pending';
  END IF;
  
  -- Quando pedido é marcado como pronto, verificar se todos os itens estão prontos
  IF NEW.status = 'ready' THEN
    UPDATE balcao_order_items
    SET status = 'ready',
        preparation_completed_at = NOW()
    WHERE balcao_order_id = NEW.id
      AND status = 'preparing';
  END IF;
  
  -- Quando pedido é entregue, marcar todos os itens como entregues
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE balcao_order_items
    SET status = 'delivered'
    WHERE balcao_order_id = NEW.id
      AND status IN ('ready', 'preparing');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balcao_order_items_status
  AFTER UPDATE ON balcao_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_balcao_order_items_status();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE balcao_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE balcao_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para balcao_orders
CREATE POLICY "Funcionários podem ver pedidos de balcão" ON balcao_orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'guest') IN ('employee', 'admin', 'supervisor')
  );

CREATE POLICY "Funcionários podem criar pedidos de balcão" ON balcao_orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    employee_id = auth.uid() AND
    COALESCE(get_user_role(), 'employee') IN ('employee', 'admin', 'supervisor')
  );

CREATE POLICY "Funcionários podem atualizar pedidos de balcão" ON balcao_orders
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'guest') IN ('employee', 'admin', 'supervisor')
  );

-- Políticas para balcao_order_items
CREATE POLICY "Funcionários podem ver itens de pedidos de balcão" ON balcao_order_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'guest') IN ('employee', 'admin', 'supervisor')
  );

CREATE POLICY "Funcionários podem inserir itens de pedidos de balcão" ON balcao_order_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'employee') IN ('employee', 'admin', 'supervisor')
  );

CREATE POLICY "Funcionários podem atualizar itens de pedidos de balcão" ON balcao_order_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'guest') IN ('employee', 'admin', 'supervisor')
  );

-- 9. VIEWS PARA RELATÓRIOS E DASHBOARDS
CREATE OR REPLACE VIEW balcao_orders_with_details AS
SELECT 
  bo.*,
  p.name as employee_name,
  cs.session_date as cash_session_date,
  COUNT(boi.id) as items_count,
  COUNT(boi.id) FILTER (WHERE boi.status = 'preparing') as items_preparing,
  COUNT(boi.id) FILTER (WHERE boi.status = 'ready') as items_ready,
  COUNT(boi.id) FILTER (WHERE boi.status = 'delivered') as items_delivered
FROM balcao_orders bo
LEFT JOIN profiles p ON bo.employee_id = p.id
LEFT JOIN cash_sessions cs ON bo.cash_session_id = cs.id
LEFT JOIN balcao_order_items boi ON bo.id = boi.balcao_order_id
GROUP BY bo.id, p.name, cs.session_date
ORDER BY bo.created_at DESC;

CREATE OR REPLACE VIEW balcao_pending_orders AS
SELECT 
  bo.*,
  p.name as employee_name,
  ARRAY_AGG(
    json_build_object(
      'id', boi.id,
      'menu_item_name', mi.name,
      'quantity', boi.quantity,
      'status', boi.status,
      'notes', boi.notes
    )
  ) as items
FROM balcao_orders bo
LEFT JOIN profiles p ON bo.employee_id = p.id
LEFT JOIN balcao_order_items boi ON bo.id = boi.balcao_order_id
LEFT JOIN menu_items mi ON boi.menu_item_id = mi.id
WHERE bo.status IN ('pending_payment', 'paid', 'preparing', 'ready')
GROUP BY bo.id, p.name
ORDER BY 
  CASE bo.status
    WHEN 'pending_payment' THEN 1
    WHEN 'paid' THEN 2
    WHEN 'preparing' THEN 3
    WHEN 'ready' THEN 4
  END,
  bo.created_at;

-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE balcao_orders IS 'Pedidos feitos no balcão sem vinculação a comandas';
COMMENT ON TABLE balcao_order_items IS 'Itens dos pedidos de balcão';

COMMENT ON COLUMN balcao_orders.order_number IS 'Número sequencial único para identificação do pedido';
COMMENT ON COLUMN balcao_orders.status IS 'Status: pending_payment, paid, preparing, ready, delivered, cancelled';
COMMENT ON COLUMN balcao_orders.cash_session_id IS 'Sessão de caixa onde o pagamento foi processado';

COMMENT ON VIEW balcao_orders_with_details IS 'Visão completa dos pedidos de balcão com detalhes do funcionário e contadores';
COMMENT ON VIEW balcao_pending_orders IS 'Pedidos pendentes para exibição no painel do bar e cozinha';