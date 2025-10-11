/*
  Sistema de Controle de Movimentação Diária por Forma de Pagamento
  
  Este módulo implementa o controle consolidado de todas as movimentações
  financeiras diárias, registrando valores por forma de pagamento e
  transferências para tesouraria.
  
  Funcionalidades:
  - Registro diário de movimentação por forma de pagamento
  - Controle de transferências para cofre/banco/tesouraria
  - Histórico completo de fechamentos
  - Relatórios consolidados
*/

-- 1. TABELA DE MOVIMENTAÇÃO DIÁRIA POR FORMA DE PAGAMENTO
CREATE TABLE IF NOT EXISTS daily_payment_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia')),
  
  -- Valores do dia
  opening_balance DECIMAL(10,2) DEFAULT 0.00, -- Saldo inicial do dia
  total_sales DECIMAL(10,2) DEFAULT 0.00, -- Total de vendas
  total_refunds DECIMAL(10,2) DEFAULT 0.00, -- Total de estornos
  total_transfers_out DECIMAL(10,2) DEFAULT 0.00, -- Total transferido para tesouraria
  closing_balance DECIMAL(10,2) DEFAULT 0.00, -- Saldo final do dia
  
  -- Contadores
  sales_count INTEGER DEFAULT 0, -- Quantidade de vendas
  refunds_count INTEGER DEFAULT 0, -- Quantidade de estornos
  sessions_count INTEGER DEFAULT 0, -- Quantidade de sessões de caixa
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas por data/método
  UNIQUE(date, payment_method)
);

COMMENT ON TABLE daily_payment_movements IS 'Controle consolidado diário de movimentação por forma de pagamento';
COMMENT ON COLUMN daily_payment_movements.opening_balance IS 'Saldo inicial do dia (saldo final do dia anterior)';
COMMENT ON COLUMN daily_payment_movements.total_sales IS 'Total de vendas do dia nesta forma de pagamento';
COMMENT ON COLUMN daily_payment_movements.total_refunds IS 'Total de estornos do dia';
COMMENT ON COLUMN daily_payment_movements.total_transfers_out IS 'Total transferido para tesouraria no dia';
COMMENT ON COLUMN daily_payment_movements.closing_balance IS 'Saldo final: opening + sales - refunds - transfers';

-- 2. TABELA DE TRANSFERÊNCIAS PARA TESOURARIA
CREATE TABLE IF NOT EXISTS treasury_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  daily_movement_id UUID REFERENCES daily_payment_movements(id) ON DELETE SET NULL,
  
  -- Dados da transferência
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transfer_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'dinheiro',
  
  -- Destino
  destination VARCHAR(50) NOT NULL CHECK (destination IN ('cofre', 'banco', 'tesouraria_central')),
  destination_account VARCHAR(100), -- Conta bancária ou identificação do cofre
  
  -- Responsáveis
  transferred_by UUID NOT NULL REFERENCES profiles(id), -- Quem transferiu
  received_by_name VARCHAR(255), -- Nome de quem recebeu
  authorized_by UUID REFERENCES profiles(id), -- Quem autorizou (se necessário)
  
  -- Comprovantes
  receipt_number VARCHAR(50), -- Número do comprovante
  bank_receipt VARCHAR(255), -- Comprovante bancário (se aplicável)
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE treasury_transfers IS 'Registro de todas as transferências para tesouraria/cofre/banco';
COMMENT ON COLUMN treasury_transfers.destination IS 'Destino da transferência: cofre, banco ou tesouraria central';
COMMENT ON COLUMN treasury_transfers.transferred_by IS 'Funcionário que realizou a transferência';
COMMENT ON COLUMN treasury_transfers.received_by_name IS 'Nome da pessoa que recebeu o dinheiro';

-- 3. TABELA DE HISTÓRICO DE FECHAMENTOS (CONSOLIDADO)
CREATE TABLE IF NOT EXISTS cash_closing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  daily_movement_id UUID REFERENCES daily_payment_movements(id) ON DELETE SET NULL,
  
  -- Dados do fechamento
  closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closing_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Valores por forma de pagamento (JSON para flexibilidade)
  payment_breakdown JSONB NOT NULL, -- { "dinheiro": { "expected": 100, "actual": 100, "count": 5 }, ... }
  
  -- Totais
  total_expected DECIMAL(10,2) NOT NULL,
  total_actual DECIMAL(10,2) NOT NULL,
  discrepancy DECIMAL(10,2) DEFAULT 0.00,
  
  -- Transferências realizadas
  transfers JSONB, -- Array de transferências realizadas neste fechamento
  
  -- Status e observações
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cash_closing_history IS 'Histórico consolidado de todos os fechamentos de caixa';
COMMENT ON COLUMN cash_closing_history.payment_breakdown IS 'Detalhamento de valores por forma de pagamento';
COMMENT ON COLUMN cash_closing_history.transfers IS 'Array de transferências realizadas neste fechamento';

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_daily_payment_movements_date ON daily_payment_movements(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_payment_movements_method ON daily_payment_movements(payment_method);
CREATE INDEX IF NOT EXISTS idx_daily_payment_movements_date_method ON daily_payment_movements(date DESC, payment_method);

CREATE INDEX IF NOT EXISTS idx_treasury_transfers_date ON treasury_transfers(transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_destination ON treasury_transfers(destination);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_status ON treasury_transfers(status);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_session ON treasury_transfers(cash_session_id);

CREATE INDEX IF NOT EXISTS idx_cash_closing_history_date ON cash_closing_history(closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_closing_history_employee ON cash_closing_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_cash_closing_history_session ON cash_closing_history(cash_session_id);

-- 5. FUNÇÃO PARA ATUALIZAR MOVIMENTAÇÃO DIÁRIA
CREATE OR REPLACE FUNCTION update_daily_payment_movement(
  p_date DATE,
  p_payment_method VARCHAR(50),
  p_sales_amount DECIMAL(10,2),
  p_sales_count INTEGER,
  p_transfer_amount DECIMAL(10,2) DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_movement_id UUID;
  v_opening_balance DECIMAL(10,2);
BEGIN
  -- Buscar saldo inicial (saldo final do dia anterior)
  SELECT closing_balance INTO v_opening_balance
  FROM daily_payment_movements
  WHERE date = p_date - INTERVAL '1 day'
    AND payment_method = p_payment_method;
  
  v_opening_balance := COALESCE(v_opening_balance, 0);
  
  -- Inserir ou atualizar movimentação diária
  INSERT INTO daily_payment_movements (
    date,
    payment_method,
    opening_balance,
    total_sales,
    sales_count,
    total_transfers_out,
    closing_balance,
    sessions_count
  ) VALUES (
    p_date,
    p_payment_method,
    v_opening_balance,
    p_sales_amount,
    p_sales_count,
    p_transfer_amount,
    v_opening_balance + p_sales_amount - p_transfer_amount,
    1
  )
  ON CONFLICT (date, payment_method) DO UPDATE SET
    total_sales = daily_payment_movements.total_sales + p_sales_amount,
    sales_count = daily_payment_movements.sales_count + p_sales_count,
    total_transfers_out = daily_payment_movements.total_transfers_out + p_transfer_amount,
    closing_balance = daily_payment_movements.opening_balance + 
                     (daily_payment_movements.total_sales + p_sales_amount) - 
                     (daily_payment_movements.total_transfers_out + p_transfer_amount),
    sessions_count = daily_payment_movements.sessions_count + 1,
    updated_at = NOW()
  RETURNING id INTO v_movement_id;
  
  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_payment_movement IS 'Atualiza movimentação diária ao fechar caixa';

-- 6. FUNÇÃO PARA REGISTRAR FECHAMENTO NO HISTÓRICO
CREATE OR REPLACE FUNCTION register_cash_closing(
  p_session_id UUID,
  p_employee_id UUID,
  p_payment_breakdown JSONB,
  p_total_expected DECIMAL(10,2),
  p_total_actual DECIMAL(10,2),
  p_transfers JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_closing_id UUID;
  v_daily_movement_id UUID;
  v_payment_method VARCHAR(50);
  v_payment_data JSONB;
  v_transfer JSONB;
BEGIN
  -- Inserir no histórico de fechamentos
  INSERT INTO cash_closing_history (
    cash_session_id,
    employee_id,
    payment_breakdown,
    total_expected,
    total_actual,
    discrepancy,
    transfers,
    notes
  ) VALUES (
    p_session_id,
    p_employee_id,
    p_payment_breakdown,
    p_total_expected,
    p_total_actual,
    p_total_actual - p_total_expected,
    p_transfers,
    p_notes
  ) RETURNING id INTO v_closing_id;
  
  -- Atualizar movimentação diária para cada forma de pagamento
  FOR v_payment_method, v_payment_data IN 
    SELECT key, value FROM jsonb_each(p_payment_breakdown)
  LOOP
    v_daily_movement_id := update_daily_payment_movement(
      CURRENT_DATE,
      v_payment_method,
      (v_payment_data->>'actual')::DECIMAL(10,2),
      (v_payment_data->>'count')::INTEGER,
      0 -- Transferências serão registradas separadamente
    );
    
    -- Atualizar referência no histórico
    UPDATE cash_closing_history 
    SET daily_movement_id = v_daily_movement_id
    WHERE id = v_closing_id;
  END LOOP;
  
  -- Registrar transferências se houver
  IF p_transfers IS NOT NULL THEN
    FOR v_transfer IN SELECT * FROM jsonb_array_elements(p_transfers)
    LOOP
      INSERT INTO treasury_transfers (
        cash_session_id,
        daily_movement_id,
        amount,
        payment_method,
        destination,
        transferred_by,
        received_by_name,
        receipt_number,
        notes
      ) VALUES (
        p_session_id,
        v_daily_movement_id,
        (v_transfer->>'amount')::DECIMAL(10,2),
        v_transfer->>'payment_method',
        v_transfer->>'destination',
        p_employee_id,
        v_transfer->>'received_by_name',
        v_transfer->>'receipt_number',
        v_transfer->>'notes'
      );
      
      -- Atualizar total de transferências na movimentação diária
      UPDATE daily_payment_movements
      SET total_transfers_out = total_transfers_out + (v_transfer->>'amount')::DECIMAL(10,2),
          closing_balance = closing_balance - (v_transfer->>'amount')::DECIMAL(10,2),
          updated_at = NOW()
      WHERE id = v_daily_movement_id;
    END LOOP;
  END IF;
  
  RETURN v_closing_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_cash_closing IS 'Registra fechamento de caixa e atualiza movimentações diárias';

-- 7. VIEW PARA RELATÓRIO CONSOLIDADO DIÁRIO
CREATE OR REPLACE VIEW v_daily_financial_summary AS
SELECT 
  dpm.date,
  dpm.payment_method,
  dpm.opening_balance,
  dpm.total_sales,
  dpm.sales_count,
  dpm.total_refunds,
  dpm.refunds_count,
  dpm.total_transfers_out,
  dpm.closing_balance,
  dpm.sessions_count,
  COALESCE(tt.transfers_count, 0) as transfers_count,
  COALESCE(tt.total_to_cofre, 0) as total_to_cofre,
  COALESCE(tt.total_to_banco, 0) as total_to_banco,
  COALESCE(tt.total_to_tesouraria, 0) as total_to_tesouraria
FROM daily_payment_movements dpm
LEFT JOIN (
  SELECT 
    transfer_date,
    payment_method,
    COUNT(*) as transfers_count,
    SUM(CASE WHEN destination = 'cofre' THEN amount ELSE 0 END) as total_to_cofre,
    SUM(CASE WHEN destination = 'banco' THEN amount ELSE 0 END) as total_to_banco,
    SUM(CASE WHEN destination = 'tesouraria_central' THEN amount ELSE 0 END) as total_to_tesouraria
  FROM treasury_transfers
  WHERE status = 'completed'
  GROUP BY transfer_date, payment_method
) tt ON dpm.date = tt.transfer_date AND dpm.payment_method = tt.payment_method
ORDER BY dpm.date DESC, dpm.payment_method;

COMMENT ON VIEW v_daily_financial_summary IS 'Resumo consolidado diário de movimentações financeiras';

-- 8. VIEW PARA HISTÓRICO DE TRANSFERÊNCIAS
CREATE OR REPLACE VIEW v_treasury_transfers_history AS
SELECT 
  tt.id,
  tt.transfer_date,
  tt.transfer_time,
  tt.amount,
  tt.payment_method,
  tt.destination,
  tt.destination_account,
  tt.receipt_number,
  tt.status,
  tt.notes,
  p_from.name as transferred_by_name,
  tt.received_by_name,
  p_auth.name as authorized_by_name,
  cs.id as session_id,
  cs.opened_at as session_opened_at,
  cs.closed_at as session_closed_at
FROM treasury_transfers tt
LEFT JOIN profiles p_from ON tt.transferred_by = p_from.id
LEFT JOIN profiles p_auth ON tt.authorized_by = p_auth.id
LEFT JOIN cash_sessions cs ON tt.cash_session_id = cs.id
ORDER BY tt.transfer_time DESC;

COMMENT ON VIEW v_treasury_transfers_history IS 'Histórico detalhado de transferências para tesouraria';

-- 9. TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_payment_movements_updated_at
  BEFORE UPDATE ON daily_payment_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treasury_transfers_updated_at
  BEFORE UPDATE ON treasury_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. POLÍTICAS RLS (Row Level Security)
ALTER TABLE daily_payment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closing_history ENABLE ROW LEVEL SECURITY;

-- Política para visualização (todos os autenticados)
CREATE POLICY "Usuários autenticados podem visualizar movimentações diárias"
  ON daily_payment_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem visualizar transferências"
  ON treasury_transfers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem visualizar histórico"
  ON cash_closing_history FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (apenas sistema via função)
CREATE POLICY "Sistema pode inserir movimentações diárias"
  ON daily_payment_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sistema pode inserir transferências"
  ON treasury_transfers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sistema pode inserir no histórico"
  ON cash_closing_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para atualização (apenas sistema)
CREATE POLICY "Sistema pode atualizar movimentações diárias"
  ON daily_payment_movements FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Sistema pode atualizar transferências"
  ON treasury_transfers FOR UPDATE
  TO authenticated
  USING (true);
