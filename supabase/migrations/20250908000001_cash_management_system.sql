/*
  Cash Management System Migration
  
  Este módulo implementa o sistema de gestão de caixa com funcionalidades
  para abertura/fechamento de caixa diário, processamento de pagamentos das
  comandas e reconciliação financeira.
  
  Funcionalidades:
  - Sessões de caixa diárias com controle de abertura/fechamento
  - Registro de transações financeiras por método de pagamento
  - Reconciliação de valores esperados vs. reais
  - Integração com sistema de comandas existente
  - Relatórios financeiros por período
*/

-- 1. TABELA DE SESSÕES DE CAIXA
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  closing_amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2) DEFAULT 0.00,
  cash_discrepancy DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
  supervisor_approval_id UUID REFERENCES profiles(id),
  opening_notes TEXT,
  closing_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para garantir apenas uma sessão aberta por funcionário por dia
  UNIQUE(employee_id, session_date, status) DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE cash_sessions IS 'Sessões diárias de caixa por funcionário';
COMMENT ON COLUMN cash_sessions.session_date IS 'Data da sessão do caixa';
COMMENT ON COLUMN cash_sessions.opening_amount IS 'Valor inicial em dinheiro no caixa';
COMMENT ON COLUMN cash_sessions.closing_amount IS 'Valor final contado no fechamento';
COMMENT ON COLUMN cash_sessions.expected_amount IS 'Valor esperado baseado nas vendas';
COMMENT ON COLUMN cash_sessions.cash_discrepancy IS 'Diferença entre valor esperado e contado';
COMMENT ON COLUMN cash_sessions.supervisor_approval_id IS 'Supervisor que aprovou abertura/fechamento';

-- 2. TABELA DE TRANSAÇÕES DO CAIXA
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  comanda_id UUID REFERENCES comandas(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('sale', 'refund', 'adjustment', 'tip')),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia')),
  amount DECIMAL(10,2) NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID NOT NULL REFERENCES profiles(id),
  reference_number VARCHAR(100), -- Número de referência para cartões/PIX
  receipt_number VARCHAR(50),
  customer_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cash_transactions IS 'Todas as transações financeiras processadas no caixa';
COMMENT ON COLUMN cash_transactions.transaction_type IS 'Tipo: sale (venda), refund (estorno), adjustment (ajuste), tip (gorjeta)';
COMMENT ON COLUMN cash_transactions.payment_method IS 'Método: dinheiro, cartao_debito, cartao_credito, pix, transferencia';
COMMENT ON COLUMN cash_transactions.reference_number IS 'Número de referência da transação (cartão/PIX)';
COMMENT ON COLUMN cash_transactions.receipt_number IS 'Número do comprovante gerado';

-- 3. TABELA DE RECONCILIAÇÃO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  payment_method VARCHAR(30) NOT NULL,
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discrepancy DECIMAL(10,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  reconciled_at TIMESTAMPTZ DEFAULT NOW(),
  reconciled_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_reconciliation IS 'Reconciliação dos métodos de pagamento no fechamento';
COMMENT ON COLUMN payment_reconciliation.expected_amount IS 'Valor esperado baseado nas vendas registradas';
COMMENT ON COLUMN payment_reconciliation.actual_amount IS 'Valor real informado no fechamento';
COMMENT ON COLUMN payment_reconciliation.discrepancy IS 'Diferença calculada automaticamente';
COMMENT ON COLUMN payment_reconciliation.transaction_count IS 'Número total de transações do método';

-- 4. TABELA DE AUDITORIA DE CAIXA
CREATE TABLE IF NOT EXISTS cash_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('open_session', 'close_session', 'process_payment', 'adjustment', 'supervisor_override')),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cash_audit_log IS 'Log de auditoria para todas as ações do sistema de caixa';
COMMENT ON COLUMN cash_audit_log.action_type IS 'Tipo de ação realizada';
COMMENT ON COLUMN cash_audit_log.old_values IS 'Valores anteriores (para updates)';
COMMENT ON COLUMN cash_audit_log.new_values IS 'Novos valores';

-- 5. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cash_sessions_employee_date ON cash_sessions(employee_id, session_date);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_session_date ON cash_sessions(session_date);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_id ON cash_transactions(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_comanda_id ON cash_transactions(comanda_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_payment_method ON cash_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_processed_at ON cash_transactions(processed_at);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_processed_by ON cash_transactions(processed_by);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_session_id ON payment_reconciliation(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_payment_method ON payment_reconciliation(payment_method);

CREATE INDEX IF NOT EXISTS idx_cash_audit_log_session_id ON cash_audit_log(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_audit_log_performed_by ON cash_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_cash_audit_log_performed_at ON cash_audit_log(performed_at);

-- 6. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- Trigger para atualizar updated_at em cash_sessions
CREATE OR REPLACE FUNCTION update_cash_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cash_sessions_updated_at
  BEFORE UPDATE ON cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_sessions_updated_at();

-- Trigger para atualizar valor esperado na sessão quando transação é adicionada
CREATE OR REPLACE FUNCTION update_session_expected_amount()
RETURNS TRIGGER AS $$
DECLARE
  session_total DECIMAL(10,2);
  cash_total DECIMAL(10,2);
BEGIN
  -- Calcular total geral da sessão
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'sale' THEN amount
      WHEN transaction_type = 'refund' THEN -amount
      WHEN transaction_type = 'adjustment' THEN amount
      WHEN transaction_type = 'tip' THEN amount
      ELSE 0
    END
  ), 0)
  INTO session_total
  FROM cash_transactions
  WHERE cash_session_id = COALESCE(NEW.cash_session_id, OLD.cash_session_id);
  
  -- Calcular total apenas de dinheiro
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'sale' THEN amount
      WHEN transaction_type = 'refund' THEN -amount
      WHEN transaction_type = 'adjustment' THEN amount
      WHEN transaction_type = 'tip' THEN amount
      ELSE 0
    END
  ), 0)
  INTO cash_total
  FROM cash_transactions
  WHERE cash_session_id = COALESCE(NEW.cash_session_id, OLD.cash_session_id)
    AND payment_method = 'dinheiro';
  
  -- Atualizar valor esperado na sessão
  UPDATE cash_sessions 
  SET 
    expected_amount = (
      SELECT opening_amount FROM cash_sessions 
      WHERE id = COALESCE(NEW.cash_session_id, OLD.cash_session_id)
    ) + cash_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.cash_session_id, OLD.cash_session_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_expected_amount
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_expected_amount();

-- Trigger para log de auditoria
CREATE OR REPLACE FUNCTION cash_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para cash_sessions
  IF TG_TABLE_NAME = 'cash_sessions' THEN
    INSERT INTO cash_audit_log (
      cash_session_id,
      action_type,
      performed_by,
      old_values,
      new_values
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'open_session'
        WHEN TG_OP = 'UPDATE' AND OLD.status = 'open' AND NEW.status = 'closed' THEN 'close_session'
        ELSE 'adjustment'
      END,
      COALESCE(NEW.employee_id, OLD.employee_id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
  END IF;
  
  -- Log para cash_transactions
  IF TG_TABLE_NAME = 'cash_transactions' THEN
    INSERT INTO cash_audit_log (
      cash_session_id,
      action_type,
      performed_by,
      old_values,
      new_values
    ) VALUES (
      COALESCE(NEW.cash_session_id, OLD.cash_session_id),
      'process_payment',
      COALESCE(NEW.processed_by, OLD.processed_by),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_sessions_audit
  AFTER INSERT OR UPDATE OR DELETE ON cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION cash_audit_trigger();

CREATE TRIGGER trigger_cash_transactions_audit
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION cash_audit_trigger();

-- 7. ROW LEVEL SECURITY (RLS)
-- Habilitar RLS nas tabelas
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_audit_log ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter perfil do usuário
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
BEGIN
  -- Verifica se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Busca o role do usuário na tabela profiles
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro (ex: usuário não existe em profiles), retorna 'guest'
    RETURN 'guest';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para cash_sessions
CREATE POLICY "Funcionários podem ver suas próprias sessões" ON cash_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      employee_id = auth.uid() OR 
      COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Funcionários podem criar suas sessões" ON cash_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    employee_id = auth.uid() AND
    COALESCE(get_user_role(), 'employee') IN ('employee', 'admin', 'supervisor')
  );

CREATE POLICY "Funcionários podem atualizar suas sessões" ON cash_sessions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      employee_id = auth.uid() OR 
      COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
    )
  );

-- Políticas para cash_transactions
CREATE POLICY "Funcionários podem ver transações de suas sessões" ON cash_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      cash_session_id IN (
        SELECT id FROM cash_sessions 
        WHERE employee_id = auth.uid()
      ) OR COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Funcionários podem inserir transações" ON cash_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    processed_by = auth.uid() AND
    COALESCE(get_user_role(), 'employee') IN ('employee', 'admin', 'supervisor')
  );

-- Políticas para payment_reconciliation
CREATE POLICY "Funcionários podem ver reconciliações de suas sessões" ON payment_reconciliation
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      cash_session_id IN (
        SELECT id FROM cash_sessions 
        WHERE employee_id = auth.uid()
      ) OR COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Funcionários podem inserir reconciliações" ON payment_reconciliation
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    reconciled_by = auth.uid() AND
    COALESCE(get_user_role(), 'employee') IN ('employee', 'admin', 'supervisor')
  );

-- Políticas para cash_audit_log (apenas leitura para admins/supervisores)
CREATE POLICY "Apenas admins podem ver logs de auditoria" ON cash_audit_log
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
  );

-- 8. DADOS INICIAIS / CONFIGURAÇÕES
-- Nota: Registros em profiles devem ser criados via autenticação do Supabase
-- ou através de usuários reais do sistema

-- 9. VIEWS PARA RELATÓRIOS
CREATE OR REPLACE VIEW daily_cash_summary AS
SELECT 
  cs.session_date,
  cs.employee_id,
  p.name as employee_name,
  cs.opening_amount,
  cs.expected_amount,
  cs.closing_amount,
  cs.cash_discrepancy,
  cs.status,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.payment_method = 'dinheiro'), 0) as cash_sales,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.payment_method = 'cartao_debito'), 0) as debit_sales,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.payment_method = 'cartao_credito'), 0) as credit_sales,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.payment_method = 'pix'), 0) as pix_sales,
  COUNT(ct.id) as total_transactions,
  cs.opened_at,
  cs.closed_at
FROM cash_sessions cs
JOIN profiles p ON cs.employee_id = p.id
LEFT JOIN cash_transactions ct ON cs.id = ct.cash_session_id AND ct.transaction_type = 'sale'
GROUP BY cs.id, p.name
ORDER BY cs.session_date DESC, cs.opened_at DESC;

COMMENT ON VIEW daily_cash_summary IS 'Resumo diário das sessões de caixa com vendas por método de pagamento';

-- View para métricas de performance
CREATE OR REPLACE VIEW cash_performance_metrics AS
SELECT 
  DATE_TRUNC('month', cs.session_date) as month,
  COUNT(DISTINCT cs.id) as sessions_count,
  COUNT(DISTINCT cs.employee_id) as employees_count,
  AVG(cs.cash_discrepancy) as avg_discrepancy,
  SUM(ct.amount) FILTER (WHERE ct.transaction_type = 'sale') as total_sales,
  COUNT(ct.id) FILTER (WHERE ct.transaction_type = 'sale') as total_transactions,
  AVG(ct.amount) FILTER (WHERE ct.transaction_type = 'sale') as avg_ticket
FROM cash_sessions cs
LEFT JOIN cash_transactions ct ON cs.id = ct.cash_session_id
WHERE cs.status = 'closed'
GROUP BY DATE_TRUNC('month', cs.session_date)
ORDER BY month DESC;

COMMENT ON VIEW cash_performance_metrics IS 'Métricas mensais de performance do sistema de caixa';