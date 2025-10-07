-- =====================================================
-- MIGRATION: Advanced Cash Management System
-- Description: Expande o sistema de caixa com funcionalidades avançadas
-- Includes: PDVs, Movimentações, Conciliação Bancária, Auditoria Avançada
-- =====================================================

-- =====================================================
-- 1. NOVAS TABELAS
-- =====================================================

-- Tabela de Pontos de Venda (PDVs)
CREATE TABLE IF NOT EXISTS pdv_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{
    "maxCashAmount": 5000,
    "requireSupervisorApproval": true,
    "autoSangriaThreshold": 1000,
    "allowedPaymentMethods": ["dinheiro", "cartao_debito", "cartao_credito", "pix"],
    "printerConfig": null
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pdv_points_empresa_name_unique UNIQUE (empresa_id, name)
);

-- Tabela de Movimentações de Caixa (Sangria/Suprimento)
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('supply', 'withdrawal', 'transfer')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES employees(id),
  recipient TEXT,
  purpose TEXT NOT NULL CHECK (purpose IN ('change_fund', 'security', 'expense', 'transfer', 'correction', 'other')),
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Conciliação Bancária
CREATE TABLE IF NOT EXISTS bank_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cartao_debito', 'cartao_credito', 'pix', 'transferencia')),
  bank_reference TEXT NOT NULL,
  bank_amount DECIMAL(10, 2) NOT NULL,
  system_amount DECIMAL(10, 2) NOT NULL,
  discrepancy DECIMAL(10, 2) GENERATED ALWAYS AS (bank_amount - system_amount) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'discrepant', 'manual_review', 'resolved')),
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Auditoria Avançada
CREATE TABLE IF NOT EXISTS cash_audit_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  pdv_id UUID REFERENCES pdv_points(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Cache de Relatórios
CREATE TABLE IF NOT EXISTS cash_reports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT cash_reports_cache_unique UNIQUE (empresa_id, report_type, period_key)
);

-- =====================================================
-- 2. EXPANDIR TABELAS EXISTENTES
-- =====================================================

-- Adicionar coluna pdv_id à tabela cash_sessions (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_sessions' AND column_name = 'pdv_id'
  ) THEN
    ALTER TABLE cash_sessions ADD COLUMN pdv_id UUID REFERENCES pdv_points(id);
  END IF;
END $$;

-- Adicionar coluna supervisor_approval_id à tabela cash_sessions (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_sessions' AND column_name = 'supervisor_approval_id'
  ) THEN
    ALTER TABLE cash_sessions ADD COLUMN supervisor_approval_id UUID REFERENCES employees(id);
  END IF;
END $$;

-- Adicionar colunas de referência à tabela cash_transactions (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_transactions' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE cash_transactions ADD COLUMN reference_number TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_transactions' AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE cash_transactions ADD COLUMN receipt_number TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_transactions' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE cash_transactions ADD COLUMN customer_name TEXT;
  END IF;
END $$;

-- =====================================================
-- 3. ÍNDICES OTIMIZADOS
-- =====================================================

-- Índices para PDV Points
CREATE INDEX IF NOT EXISTS idx_pdv_points_empresa_active 
  ON pdv_points(empresa_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_pdv_points_name 
  ON pdv_points(empresa_id, name);

-- Índices para Cash Sessions
CREATE INDEX IF NOT EXISTS idx_cash_sessions_pdv_date 
  ON cash_sessions(pdv_id, session_date) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_cash_sessions_employee_date 
  ON cash_sessions(employee_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_empresa_status 
  ON cash_sessions(empresa_id, status, session_date DESC);

-- Índices para Cash Transactions
CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_method 
  ON cash_transactions(cash_session_id, payment_method, processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_reference 
  ON cash_transactions(reference_number) WHERE reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_empresa_date 
  ON cash_transactions(empresa_id, processed_at DESC);

-- Índices para Cash Movements
CREATE INDEX IF NOT EXISTS idx_cash_movements_session 
  ON cash_movements(cash_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_movements_empresa_type 
  ON cash_movements(empresa_id, movement_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_movements_authorized_by 
  ON cash_movements(authorized_by, created_at DESC);

-- Índices para Bank Reconciliation
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_status 
  ON bank_reconciliation(empresa_id, status, created_at DESC) 
  WHERE status IN ('pending', 'discrepant');

CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_session 
  ON bank_reconciliation(cash_session_id) WHERE cash_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_reference 
  ON bank_reconciliation(bank_reference);

-- Índices para Cash Audit Enhanced
CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_session 
  ON cash_audit_enhanced(cash_session_id, performed_at DESC) 
  WHERE cash_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_pdv 
  ON cash_audit_enhanced(pdv_id, performed_at DESC) 
  WHERE pdv_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_risk 
  ON cash_audit_enhanced(empresa_id, risk_level, performed_at DESC) 
  WHERE risk_level IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_performed_by 
  ON cash_audit_enhanced(performed_by, performed_at DESC);

-- Índices para Cache de Relatórios
CREATE INDEX IF NOT EXISTS idx_cash_reports_cache_expires 
  ON cash_reports_cache(expires_at);

-- =====================================================
-- 4. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar updated_at em pdv_points
CREATE OR REPLACE FUNCTION update_pdv_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdv_points_updated_at
  BEFORE UPDATE ON pdv_points
  FOR EACH ROW
  EXECUTE FUNCTION update_pdv_points_updated_at();

-- Trigger para atualizar updated_at em bank_reconciliation
CREATE OR REPLACE FUNCTION update_bank_reconciliation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_reconciliation_updated_at
  BEFORE UPDATE ON bank_reconciliation
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_reconciliation_updated_at();

-- Função para calcular nível de risco
CREATE OR REPLACE FUNCTION calculate_risk_level(
  p_action_type TEXT,
  p_old_values JSONB,
  p_new_values JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_risk_level TEXT := 'low';
  v_amount_change DECIMAL;
BEGIN
  -- Ações críticas
  IF p_action_type IN ('DELETE', 'FORCE_CLOSE', 'OVERRIDE_DISCREPANCY') THEN
    RETURN 'critical';
  END IF;
  
  -- Mudanças em valores monetários
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    IF p_old_values ? 'amount' AND p_new_values ? 'amount' THEN
      v_amount_change := ABS((p_new_values->>'amount')::DECIMAL - (p_old_values->>'amount')::DECIMAL);
      
      IF v_amount_change > 1000 THEN
        RETURN 'high';
      ELSIF v_amount_change > 500 THEN
        RETURN 'medium';
      END IF;
    END IF;
  END IF;
  
  -- Ações de médio risco
  IF p_action_type IN ('UPDATE', 'MANUAL_ADJUSTMENT') THEN
    RETURN 'medium';
  END IF;
  
  RETURN v_risk_level;
END;
$$ LANGUAGE plpgsql;

-- Trigger de auditoria para cash_sessions
CREATE OR REPLACE FUNCTION audit_cash_sessions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cash_audit_enhanced (
    empresa_id,
    cash_session_id,
    pdv_id,
    action_type,
    performed_by,
    old_values,
    new_values,
    risk_level,
    performed_at
  ) VALUES (
    COALESCE(NEW.empresa_id, OLD.empresa_id),
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.pdv_id, OLD.pdv_id),
    TG_OP,
    COALESCE(NEW.employee_id, OLD.employee_id, auth.uid()),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    calculate_risk_level(
      TG_OP,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_cash_sessions
  AFTER INSERT OR UPDATE OR DELETE ON cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION audit_cash_sessions();

-- Trigger de auditoria para cash_transactions
CREATE OR REPLACE FUNCTION audit_cash_transactions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cash_audit_enhanced (
    empresa_id,
    cash_session_id,
    action_type,
    performed_by,
    old_values,
    new_values,
    risk_level,
    performed_at
  ) VALUES (
    COALESCE(NEW.empresa_id, OLD.empresa_id),
    COALESCE(NEW.cash_session_id, OLD.cash_session_id),
    TG_OP,
    COALESCE(NEW.processed_by, OLD.processed_by, auth.uid()),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    calculate_risk_level(
      TG_OP,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_cash_transactions
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION audit_cash_transactions();

-- Trigger de auditoria para cash_movements
CREATE OR REPLACE FUNCTION audit_cash_movements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cash_audit_enhanced (
    empresa_id,
    cash_session_id,
    action_type,
    performed_by,
    old_values,
    new_values,
    risk_level,
    performed_at
  ) VALUES (
    COALESCE(NEW.empresa_id, OLD.empresa_id),
    COALESCE(NEW.cash_session_id, OLD.cash_session_id),
    TG_OP || '_MOVEMENT',
    COALESCE(NEW.authorized_by, OLD.authorized_by, auth.uid()),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    CASE 
      WHEN COALESCE(NEW.amount, OLD.amount) > 1000 THEN 'high'
      WHEN COALESCE(NEW.amount, OLD.amount) > 500 THEN 'medium'
      ELSE 'low'
    END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_cash_movements
  AFTER INSERT OR UPDATE OR DELETE ON cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION audit_cash_movements();

-- Trigger para limpar cache de relatórios expirados
CREATE OR REPLACE FUNCTION cleanup_expired_reports_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cash_reports_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEWS MATERIALIZADAS PARA RELATÓRIOS
-- =====================================================

-- View: Resumo Diário por PDV
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_pdv_summary AS
SELECT 
  cs.empresa_id,
  cs.pdv_id,
  pp.name as pdv_name,
  cs.session_date,
  COUNT(DISTINCT cs.id) as session_count,
  COUNT(DISTINCT cs.employee_id) as employee_count,
  SUM(
    COALESCE((
      SELECT SUM(ct.amount)
      FROM cash_transactions ct
      WHERE ct.cash_session_id = cs.id
    ), 0)
  ) as total_sales,
  AVG(cs.cash_discrepancy) as avg_discrepancy,
  SUM(CASE WHEN ABS(cs.cash_discrepancy) > 0 THEN 1 ELSE 0 END) as sessions_with_discrepancy,
  MIN(cs.opened_at) as first_opening,
  MAX(cs.closed_at) as last_closing
FROM cash_sessions cs
LEFT JOIN pdv_points pp ON cs.pdv_id = pp.id
WHERE cs.status = 'closed'
GROUP BY cs.empresa_id, cs.pdv_id, pp.name, cs.session_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_pdv_summary_unique 
  ON mv_daily_pdv_summary(empresa_id, COALESCE(pdv_id, '00000000-0000-0000-0000-000000000000'::uuid), session_date);

-- View: Performance por Funcionário
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_performance AS
SELECT 
  cs.empresa_id,
  cs.employee_id,
  e.name as employee_name,
  DATE_TRUNC('month', cs.session_date) as month,
  COUNT(DISTINCT cs.id) as total_sessions,
  SUM(
    COALESCE((
      SELECT SUM(ct.amount)
      FROM cash_transactions ct
      WHERE ct.cash_session_id = cs.id
    ), 0)
  ) as total_sales,
  AVG(
    COALESCE((
      SELECT SUM(ct.amount)
      FROM cash_transactions ct
      WHERE ct.cash_session_id = cs.id
    ), 0)
  ) as avg_sales_per_session,
  COUNT(
    COALESCE((
      SELECT COUNT(*)
      FROM cash_transactions ct
      WHERE ct.cash_session_id = cs.id
    ), 0)
  ) as total_transactions,
  AVG(cs.cash_discrepancy) as avg_discrepancy,
  STDDEV(cs.cash_discrepancy) as stddev_discrepancy,
  SUM(CASE WHEN ABS(cs.cash_discrepancy) > 10 THEN 1 ELSE 0 END) as high_discrepancy_count
FROM cash_sessions cs
LEFT JOIN employees e ON cs.employee_id = e.id
WHERE cs.status = 'closed'
GROUP BY cs.empresa_id, cs.employee_id, e.name, DATE_TRUNC('month', cs.session_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_employee_performance_unique 
  ON mv_employee_performance(empresa_id, employee_id, month);

-- View: Análise de Métodos de Pagamento
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_payment_method_analysis AS
SELECT 
  ct.empresa_id,
  DATE_TRUNC('day', ct.processed_at) as transaction_date,
  ct.payment_method,
  COUNT(*) as transaction_count,
  SUM(ct.amount) as total_amount,
  AVG(ct.amount) as avg_amount,
  MIN(ct.amount) as min_amount,
  MAX(ct.amount) as max_amount,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ct.amount) as median_amount
FROM cash_transactions ct
GROUP BY ct.empresa_id, DATE_TRUNC('day', ct.processed_at), ct.payment_method;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payment_method_analysis_unique 
  ON mv_payment_method_analysis(empresa_id, transaction_date, payment_method);

-- View: Status de Conciliação Bancária
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_bank_reconciliation_status AS
SELECT 
  br.empresa_id,
  DATE_TRUNC('day', br.created_at) as reconciliation_date,
  br.payment_method,
  br.status,
  COUNT(*) as transaction_count,
  SUM(br.bank_amount) as total_bank_amount,
  SUM(br.system_amount) as total_system_amount,
  SUM(br.discrepancy) as total_discrepancy,
  AVG(ABS(br.discrepancy)) as avg_abs_discrepancy
FROM bank_reconciliation br
GROUP BY br.empresa_id, DATE_TRUNC('day', br.created_at), br.payment_method, br.status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_bank_reconciliation_status_unique 
  ON mv_bank_reconciliation_status(empresa_id, reconciliation_date, payment_method, status);

-- =====================================================
-- 6. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para refresh automático de views materializadas
CREATE OR REPLACE FUNCTION refresh_cash_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_pdv_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_method_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bank_reconciliation_status;
END;
$$ LANGUAGE plpgsql;

-- Função para obter limite de caixa do usuário
CREATE OR REPLACE FUNCTION get_user_cash_limit(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_limit DECIMAL := 500; -- Limite padrão
  v_role TEXT;
BEGIN
  SELECT p.role INTO v_role
  FROM employees e
  JOIN profiles p ON e.profile_id = p.id
  WHERE e.id = p_user_id;
  
  -- Ajustar limite baseado no role
  CASE v_role
    WHEN 'super_admin' THEN v_limit := 999999;
    WHEN 'admin' THEN v_limit := 10000;
    WHEN 'gerente' THEN v_limit := 5000;
    WHEN 'supervisor' THEN v_limit := 2000;
    ELSE v_limit := 500;
  END CASE;
  
  RETURN v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE pdv_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_audit_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_reports_cache ENABLE ROW LEVEL SECURITY;

-- Policies para pdv_points
CREATE POLICY "pdv_points_select_policy" ON pdv_points
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "pdv_points_insert_policy" ON pdv_points
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'gerente')
    )
  );

CREATE POLICY "pdv_points_update_policy" ON pdv_points
  FOR UPDATE USING (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'gerente')
    )
  );

CREATE POLICY "pdv_points_delete_policy" ON pdv_points
  FOR DELETE USING (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin')
    )
  );

-- Policies para cash_movements
CREATE POLICY "cash_movements_select_policy" ON cash_movements
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "cash_movements_insert_policy" ON cash_movements
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
    AND (
      amount <= get_user_cash_limit(auth.uid())
      OR authorized_by IN (
        SELECT e.id FROM employees e
        JOIN profiles p ON e.profile_id = p.id
        WHERE e.empresa_id = cash_movements.empresa_id 
        AND p.role IN ('super_admin', 'admin', 'gerente', 'supervisor')
      )
    )
  );

-- Policies para bank_reconciliation
CREATE POLICY "bank_reconciliation_select_policy" ON bank_reconciliation
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "bank_reconciliation_insert_policy" ON bank_reconciliation
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'gerente', 'financeiro')
    )
  );

CREATE POLICY "bank_reconciliation_update_policy" ON bank_reconciliation
  FOR UPDATE USING (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'gerente', 'financeiro')
    )
  );

-- Policies para cash_audit_enhanced
CREATE POLICY "cash_audit_enhanced_select_policy" ON cash_audit_enhanced
  FOR SELECT USING (
    empresa_id IN (
      SELECT e.empresa_id FROM employees e
      JOIN profiles p ON e.profile_id = p.id
      WHERE e.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'gerente', 'supervisor')
    )
  );

CREATE POLICY "cash_audit_enhanced_insert_policy" ON cash_audit_enhanced
  FOR INSERT WITH CHECK (true); -- Inserções são feitas por triggers

-- Policies para cash_reports_cache
CREATE POLICY "cash_reports_cache_select_policy" ON cash_reports_cache
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "cash_reports_cache_insert_policy" ON cash_reports_cache
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "cash_reports_cache_update_policy" ON cash_reports_cache
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "cash_reports_cache_delete_policy" ON cash_reports_cache
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM employees WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE pdv_points IS 'Pontos de Venda (PDVs) para gestão de múltiplos caixas';
COMMENT ON TABLE cash_movements IS 'Movimentações de caixa (sangria, suprimento, transferências)';
COMMENT ON TABLE bank_reconciliation IS 'Conciliação bancária de transações eletrônicas';
COMMENT ON TABLE cash_audit_enhanced IS 'Auditoria avançada de operações de caixa';
COMMENT ON TABLE cash_reports_cache IS 'Cache de relatórios para otimização de performance';

COMMENT ON COLUMN pdv_points.settings IS 'Configurações JSON do PDV (limites, métodos de pagamento, impressora)';
COMMENT ON COLUMN cash_movements.purpose IS 'Propósito da movimentação: change_fund, security, expense, transfer, correction, other';
COMMENT ON COLUMN bank_reconciliation.discrepancy IS 'Diferença calculada automaticamente entre banco e sistema';
COMMENT ON COLUMN cash_audit_enhanced.risk_level IS 'Nível de risco da operação: low, medium, high, critical';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
