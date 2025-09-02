/*
  Bar Attendance System Migration
  
  Este módulo implementa o sistema de atendimento no bar com gestão de mesas,
  comandas, métricas de atendimento e divisão de contas.
  
  Requisitos atendidos:
  - 2.2: Gestão de mesas com status e posicionamento
  - 3.1: Sistema de comandas com relacionamento com mesas
  - 4.1: Sistema de divisão de contas
*/

-- 1. TABELA DE MESAS DO BAR
CREATE TABLE IF NOT EXISTS bar_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  position_x FLOAT DEFAULT 0, -- Posição X no layout do salão
  position_y FLOAT DEFAULT 0, -- Posição Y no layout do salão
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bar_tables IS 'Mesas do bar com posicionamento e status para gestão do salão';
COMMENT ON COLUMN bar_tables.number IS 'Número identificador da mesa (ex: M01, M02)';
COMMENT ON COLUMN bar_tables.capacity IS 'Capacidade máxima de pessoas na mesa';
COMMENT ON COLUMN bar_tables.position_x IS 'Posição horizontal no layout do salão (0-100)';
COMMENT ON COLUMN bar_tables.position_y IS 'Posição vertical no layout do salão (0-100)';
COMMENT ON COLUMN bar_tables.status IS 'Status atual da mesa';

-- 2. TABELA DE COMANDAS
CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES bar_tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES bar_customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255), -- Nome do cliente se não cadastrado
  employee_id UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending_payment', 'closed', 'cancelled')),
  total DECIMAL(10,2) DEFAULT 0.00,
  people_count INTEGER DEFAULT 1 CHECK (people_count > 0),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE comandas IS 'Comandas abertas no bar com relacionamento com mesas e funcionários';
COMMENT ON COLUMN comandas.table_id IS 'Mesa associada à comanda (opcional para pedidos no balcão)';
COMMENT ON COLUMN comandas.customer_id IS 'Cliente cadastrado (opcional)';
COMMENT ON COLUMN comandas.customer_name IS 'Nome do cliente se não cadastrado no sistema';
COMMENT ON COLUMN comandas.employee_id IS 'Funcionário responsável pela comanda';
COMMENT ON COLUMN comandas.people_count IS 'Número de pessoas na mesa/comanda';

-- 3. TABELA DE ITENS DA COMANDA
CREATE TABLE IF NOT EXISTS comanda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL, -- Preço no momento do pedido
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  prepared_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE comanda_items IS 'Itens individuais das comandas com status de preparo';
COMMENT ON COLUMN comanda_items.status IS 'Status do item: pending, preparing, ready, delivered, cancelled';
COMMENT ON COLUMN comanda_items.price IS 'Preço do item no momento do pedido';

-- 4. TABELA DE MÉTRICAS DE ATENDIMENTO
CREATE TABLE IF NOT EXISTS attendance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  date DATE DEFAULT CURRENT_DATE,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  orders_count INTEGER DEFAULT 0,
  comandas_count INTEGER DEFAULT 0,
  avg_service_time INTERVAL,
  total_sales DECIMAL(10,2) DEFAULT 0.00,
  customer_satisfaction DECIMAL(3,2) CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 5),
  tips_received DECIMAL(10,2) DEFAULT 0.00,
  tables_served INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas por funcionário/data
  UNIQUE(employee_id, date)
);

COMMENT ON TABLE attendance_metrics IS 'Métricas de performance dos funcionários no atendimento';
COMMENT ON COLUMN attendance_metrics.avg_service_time IS 'Tempo médio de atendimento por pedido';
COMMENT ON COLUMN attendance_metrics.customer_satisfaction IS 'Avaliação média de satisfação (0-5)';
COMMENT ON COLUMN attendance_metrics.tables_served IS 'Número de mesas atendidas no turno';

-- 5. TABELA DE DIVISÃO DE CONTAS
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  split_type VARCHAR(20) NOT NULL CHECK (split_type IN ('equal', 'by_item', 'by_person', 'custom')),
  person_count INTEGER NOT NULL CHECK (person_count > 0),
  splits JSONB NOT NULL, -- Detalhes da divisão por pessoa
  total_amount DECIMAL(10,2) NOT NULL,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bill_splits IS 'Divisões de conta das comandas com detalhes por pessoa';
COMMENT ON COLUMN bill_splits.split_type IS 'Tipo de divisão: equal, by_item, by_person, custom';
COMMENT ON COLUMN bill_splits.splits IS 'JSON com detalhes da divisão por pessoa';
COMMENT ON COLUMN bill_splits.service_charge IS 'Taxa de serviço aplicada';

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bar_tables_status ON bar_tables(status);
CREATE INDEX IF NOT EXISTS idx_bar_tables_number ON bar_tables(number);

CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_table_id ON comandas(table_id);
CREATE INDEX IF NOT EXISTS idx_comandas_employee_id ON comandas(employee_id);
CREATE INDEX IF NOT EXISTS idx_comandas_opened_at ON comandas(opened_at);
CREATE INDEX IF NOT EXISTS idx_comandas_customer_id ON comandas(customer_id);

CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda_id ON comanda_items(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_status ON comanda_items(status);
CREATE INDEX IF NOT EXISTS idx_comanda_items_menu_item_id ON comanda_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_added_at ON comanda_items(added_at);

CREATE INDEX IF NOT EXISTS idx_attendance_metrics_employee_date ON attendance_metrics(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_metrics_date ON attendance_metrics(date);

CREATE INDEX IF NOT EXISTS idx_bill_splits_comanda_id ON bill_splits(comanda_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_created_at ON bill_splits(created_at);

-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- Trigger para atualizar updated_at nas tabelas
CREATE OR REPLACE FUNCTION update_bar_tables_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bar_tables_updated_at
  BEFORE UPDATE ON bar_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_bar_tables_updated_at();

CREATE OR REPLACE FUNCTION update_comandas_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comandas_updated_at
  BEFORE UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_comandas_updated_at();

CREATE OR REPLACE FUNCTION update_attendance_metrics_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_metrics_updated_at
  BEFORE UPDATE ON attendance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_metrics_updated_at();

-- 8. TRIGGER PARA ATUALIZAR TOTAL DA COMANDA
CREATE OR REPLACE FUNCTION update_comanda_total()
RETURNS TRIGGER AS $
DECLARE
  comanda_total DECIMAL(10,2);
BEGIN
  -- Calcular o total da comanda baseado nos itens
  SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
  INTO comanda_total
  FROM comanda_items ci
  WHERE ci.comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    AND ci.status != 'cancelled';
  
  -- Atualizar o total na comanda
  UPDATE comandas 
  SET total = comanda_total, updated_at = NOW()
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comanda_total_on_insert
  AFTER INSERT ON comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();

CREATE TRIGGER trigger_update_comanda_total_on_update
  AFTER UPDATE ON comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();

CREATE TRIGGER trigger_update_comanda_total_on_delete
  AFTER DELETE ON comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();

-- 9. TRIGGER PARA ATUALIZAR STATUS DA MESA
CREATE OR REPLACE FUNCTION update_table_status_on_comanda_change()
RETURNS TRIGGER AS $
BEGIN
  -- Se uma comanda foi aberta, marcar mesa como ocupada
  IF TG_OP = 'INSERT' AND NEW.table_id IS NOT NULL AND NEW.status = 'open' THEN
    UPDATE bar_tables 
    SET status = 'occupied', updated_at = NOW()
    WHERE id = NEW.table_id AND status = 'available';
  END IF;
  
  -- Se uma comanda foi fechada, verificar se deve liberar a mesa
  IF TG_OP = 'UPDATE' AND OLD.status = 'open' AND NEW.status IN ('closed', 'cancelled') AND NEW.table_id IS NOT NULL THEN
    -- Verificar se não há outras comandas abertas na mesa
    IF NOT EXISTS (
      SELECT 1 FROM comandas 
      WHERE table_id = NEW.table_id 
        AND status = 'open' 
        AND id != NEW.id
    ) THEN
      UPDATE bar_tables 
      SET status = 'available', updated_at = NOW()
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_table_status_on_comanda_change
  AFTER INSERT OR UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status_on_comanda_change();

-- 10. FUNÇÕES AUXILIARES

-- Função para obter comandas abertas com detalhes
CREATE OR REPLACE FUNCTION get_open_comandas()
RETURNS TABLE (
  id UUID,
  table_number VARCHAR,
  customer_name VARCHAR,
  employee_name TEXT,
  total DECIMAL,
  people_count INTEGER,
  opened_at TIMESTAMPTZ,
  items_count BIGINT,
  pending_items BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    bt.number as table_number,
    COALESCE(bc.name, c.customer_name) as customer_name,
    p.name as employee_name,
    c.total,
    c.people_count,
    c.opened_at,
    COUNT(ci.id) as items_count,
    COUNT(ci.id) FILTER (WHERE ci.status IN ('pending', 'preparing')) as pending_items
  FROM comandas c
  LEFT JOIN bar_tables bt ON c.table_id = bt.id
  LEFT JOIN bar_customers bc ON c.customer_id = bc.id
  LEFT JOIN profiles p ON c.employee_id = p.id
  LEFT JOIN comanda_items ci ON c.id = ci.comanda_id
  WHERE c.status = 'open'
  GROUP BY c.id, bt.number, bc.name, c.customer_name, p.name, c.total, c.people_count, c.opened_at
  ORDER BY c.opened_at;
END;
$ LANGUAGE plpgsql;

-- Função para obter status das mesas
CREATE OR REPLACE FUNCTION get_tables_status()
RETURNS TABLE (
  id UUID,
  number VARCHAR,
  capacity INTEGER,
  status VARCHAR,
  position_x FLOAT,
  position_y FLOAT,
  current_comanda_id UUID,
  occupied_since TIMESTAMPTZ,
  current_total DECIMAL,
  people_count INTEGER
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    bt.id,
    bt.number,
    bt.capacity,
    bt.status,
    bt.position_x,
    bt.position_y,
    c.id as current_comanda_id,
    c.opened_at as occupied_since,
    c.total as current_total,
    c.people_count
  FROM bar_tables bt
  LEFT JOIN comandas c ON bt.id = c.table_id AND c.status = 'open'
  ORDER BY bt.number;
END;
$ LANGUAGE plpgsql;

-- Função para calcular métricas diárias do funcionário
CREATE OR REPLACE FUNCTION calculate_daily_metrics(emp_id UUID, metric_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $
DECLARE
  orders_total INTEGER;
  comandas_total INTEGER;
  sales_total DECIMAL(10,2);
  avg_time INTERVAL;
  tables_total INTEGER;
BEGIN
  -- Contar pedidos do dia
  SELECT COUNT(*) INTO orders_total
  FROM orders o
  WHERE o.employee_id = emp_id 
    AND DATE(o.created_at) = metric_date;
  
  -- Contar comandas do dia
  SELECT COUNT(*) INTO comandas_total
  FROM comandas c
  WHERE c.employee_id = emp_id 
    AND DATE(c.opened_at) = metric_date;
  
  -- Calcular vendas totais
  SELECT COALESCE(SUM(c.total), 0) INTO sales_total
  FROM comandas c
  WHERE c.employee_id = emp_id 
    AND DATE(c.opened_at) = metric_date
    AND c.status = 'closed';
  
  -- Calcular tempo médio de atendimento (aproximado)
  SELECT AVG(c.closed_at - c.opened_at) INTO avg_time
  FROM comandas c
  WHERE c.employee_id = emp_id 
    AND DATE(c.opened_at) = metric_date
    AND c.status = 'closed'
    AND c.closed_at IS NOT NULL;
  
  -- Contar mesas atendidas
  SELECT COUNT(DISTINCT c.table_id) INTO tables_total
  FROM comandas c
  WHERE c.employee_id = emp_id 
    AND DATE(c.opened_at) = metric_date
    AND c.table_id IS NOT NULL;
  
  -- Inserir ou atualizar métricas
  INSERT INTO attendance_metrics (
    employee_id, date, orders_count, comandas_count, 
    total_sales, avg_service_time, tables_served
  ) VALUES (
    emp_id, metric_date, orders_total, comandas_total,
    sales_total, avg_time, tables_total
  )
  ON CONFLICT (employee_id, date) 
  DO UPDATE SET
    orders_count = EXCLUDED.orders_count,
    comandas_count = EXCLUDED.comandas_count,
    total_sales = EXCLUDED.total_sales,
    avg_service_time = EXCLUDED.avg_service_time,
    tables_served = EXCLUDED.tables_served,
    updated_at = NOW();
END;
$ LANGUAGE plpgsql;

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE bar_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- Políticas para bar_tables
CREATE POLICY "Authenticated users can view bar tables" ON bar_tables
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage bar tables" ON bar_tables
  FOR ALL USING (public.get_my_role() IN ('admin', 'employee'))
  WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- Políticas para comandas
CREATE POLICY "Authenticated users can view comandas" ON comandas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage comandas" ON comandas
  FOR ALL USING (public.get_my_role() IN ('admin', 'employee'))
  WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- Políticas para comanda_items
CREATE POLICY "Authenticated users can view comanda items" ON comanda_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage comanda items" ON comanda_items
  FOR ALL USING (public.get_my_role() IN ('admin', 'employee'))
  WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- Políticas para attendance_metrics
CREATE POLICY "Users can view their own metrics" ON attendance_metrics
  FOR SELECT USING (employee_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage all metrics" ON attendance_metrics
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Employees can update their own metrics" ON attendance_metrics
  FOR UPDATE USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Políticas para bill_splits
CREATE POLICY "Authenticated users can view bill splits" ON bill_splits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage bill splits" ON bill_splits
  FOR ALL USING (public.get_my_role() IN ('admin', 'employee'))
  WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

-- 12. DADOS INICIAIS - MESAS DE EXEMPLO
INSERT INTO bar_tables (number, capacity, position_x, position_y, status) VALUES
  ('M01', 2, 10, 20, 'available'),
  ('M02', 2, 30, 20, 'available'),
  ('M03', 4, 50, 20, 'available'),
  ('M04', 4, 70, 20, 'available'),
  ('M05', 6, 90, 20, 'available'),
  ('M06', 2, 10, 50, 'available'),
  ('M07', 2, 30, 50, 'available'),
  ('M08', 4, 50, 50, 'available'),
  ('M09', 4, 70, 50, 'available'),
  ('M10', 8, 90, 50, 'available'),
  ('M11', 2, 10, 80, 'available'),
  ('M12', 2, 30, 80, 'available'),
  ('M13', 4, 50, 80, 'available'),
  ('M14', 4, 70, 80, 'available'),
  ('M15', 6, 90, 80, 'available'),
  ('BAR01', 1, 20, 10, 'available'), -- Banquetas do bar
  ('BAR02', 1, 25, 10, 'available'),
  ('BAR03', 1, 30, 10, 'available'),
  ('BAR04', 1, 35, 10, 'available'),
  ('BAR05', 1, 40, 10, 'available')
ON CONFLICT (number) DO NOTHING;