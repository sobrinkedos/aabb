-- ============================================
-- Migração 003: Criar Tabelas do Sistema de PDV
-- Database: aabb-producao (jtfdzjmravketpkwjkvp)
-- ============================================

-- IMPORTANTE: Execute esta migração em PRODUÇÃO
-- Esta migração cria as tabelas ausentes do sistema de PDV avançado

BEGIN;

-- ============================================
-- 1. Tabela: pdv_points (Pontos de Venda)
-- ============================================
CREATE TABLE IF NOT EXISTS pdv_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{
        "maxCashAmount": 5000,
        "printerConfig": null,
        "autoSangriaThreshold": 1000,
        "allowedPaymentMethods": ["dinheiro", "cartao_debito", "cartao_credito", "pix"],
        "requireSupervisorApproval": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pdv_points IS 'Pontos de Venda (PDVs) para gestão de múltiplos caixas';

-- Índices
CREATE INDEX IF NOT EXISTS idx_pdv_points_empresa_id ON pdv_points(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pdv_points_is_active ON pdv_points(is_active);

-- RLS
ALTER TABLE pdv_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas PDVs da própria empresa" ON pdv_points;
CREATE POLICY "Usuários veem apenas PDVs da própria empresa"
ON pdv_points FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 2. Tabela: cash_movements (Movimentações de Caixa)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('supply', 'withdrawal', 'transfer')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    authorized_by UUID NOT NULL REFERENCES employees(id),
    recipient TEXT,
    purpose TEXT NOT NULL CHECK (purpose IN ('change_fund', 'security', 'expense', 'transfer', 'correction', 'other')),
    reference_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cash_movements IS 'Movimentações de caixa (sangria, suprimento, transferências)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_cash_movements_empresa_id ON cash_movements(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_cash_session_id ON cash_movements(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_movement_type ON cash_movements(movement_type);

-- RLS
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas movimentações da própria empresa" ON cash_movements;
CREATE POLICY "Usuários veem apenas movimentações da própria empresa"
ON cash_movements FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 3. Tabela: bank_reconciliation (Conciliação Bancária)
-- ============================================
CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cartao_debito', 'cartao_credito', 'pix', 'transferencia')),
    bank_reference TEXT NOT NULL,
    bank_amount NUMERIC NOT NULL,
    system_amount NUMERIC NOT NULL,
    discrepancy NUMERIC GENERATED ALWAYS AS (bank_amount - system_amount) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'discrepant', 'manual_review', 'resolved')),
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE bank_reconciliation IS 'Conciliação bancária de transações eletrônicas';

-- Índices
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_empresa_id ON bank_reconciliation(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_status ON bank_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_payment_method ON bank_reconciliation(payment_method);

-- RLS
ALTER TABLE bank_reconciliation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas conciliações da própria empresa" ON bank_reconciliation;
CREATE POLICY "Usuários veem apenas conciliações da própria empresa"
ON bank_reconciliation FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 4. Tabela: cash_audit_enhanced (Auditoria Avançada)
-- ============================================
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
    performed_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cash_audit_enhanced IS 'Auditoria avançada de operações de caixa';

-- Índices
CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_empresa_id ON cash_audit_enhanced(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_cash_session_id ON cash_audit_enhanced(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_risk_level ON cash_audit_enhanced(risk_level);
CREATE INDEX IF NOT EXISTS idx_cash_audit_enhanced_performed_at ON cash_audit_enhanced(performed_at DESC);

-- RLS
ALTER TABLE cash_audit_enhanced ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas auditorias da própria empresa" ON cash_audit_enhanced;
CREATE POLICY "Usuários veem apenas auditorias da própria empresa"
ON cash_audit_enhanced FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 5. Tabela: cash_reports_cache (Cache de Relatórios)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    period_key TEXT NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE cash_reports_cache IS 'Cache de relatórios para otimização de performance';

-- Índices
CREATE INDEX IF NOT EXISTS idx_cash_reports_cache_empresa_id ON cash_reports_cache(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cash_reports_cache_report_type ON cash_reports_cache(report_type);
CREATE INDEX IF NOT EXISTS idx_cash_reports_cache_expires_at ON cash_reports_cache(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_reports_cache_unique 
ON cash_reports_cache(empresa_id, report_type, period_key);

-- RLS
ALTER TABLE cash_reports_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas cache da própria empresa" ON cash_reports_cache;
CREATE POLICY "Usuários veem apenas cache da própria empresa"
ON cash_reports_cache FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 6. Tabela: treasury_transfers (Transferências para Tesouraria)
-- ============================================
CREATE TABLE IF NOT EXISTS treasury_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    authorized_by UUID NOT NULL REFERENCES profiles(id),
    recipient_name TEXT,
    destination TEXT NOT NULL,
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE treasury_transfers IS 'Transferências de valores do caixa para a tesouraria';

-- Índices
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_empresa_id ON treasury_transfers(empresa_id);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_cash_session_id ON treasury_transfers(cash_session_id);

-- RLS
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas transferências da própria empresa" ON treasury_transfers;
CREATE POLICY "Usuários veem apenas transferências da própria empresa"
ON treasury_transfers FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 7. Tabela: discrepancy_handling (Tratamento de Divergências)
-- ============================================
CREATE TABLE IF NOT EXISTS discrepancy_handling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    discrepancy_amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    action_taken TEXT NOT NULL CHECK (action_taken IN ('accepted', 'investigation', 'adjustment', 'pending')),
    approved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE discrepancy_handling IS 'Tratamento e resolução de divergências de caixa';

-- Índices
CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_empresa_id ON discrepancy_handling(empresa_id);
CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_cash_session_id ON discrepancy_handling(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_action_taken ON discrepancy_handling(action_taken);

-- RLS
ALTER TABLE discrepancy_handling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas divergências da própria empresa" ON discrepancy_handling;
CREATE POLICY "Usuários veem apenas divergências da própria empresa"
ON discrepancy_handling FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 8. Tabela: cash_closing_receipts (Recibos de Fechamento)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_closing_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    receipt_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now(),
    generated_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cash_closing_receipts IS 'Recibos gerados no fechamento de caixa';

-- Índices
CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_empresa_id ON cash_closing_receipts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_cash_session_id ON cash_closing_receipts(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_receipt_number ON cash_closing_receipts(receipt_number);

-- RLS
ALTER TABLE cash_closing_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem apenas recibos da própria empresa" ON cash_closing_receipts;
CREATE POLICY "Usuários veem apenas recibos da própria empresa"
ON cash_closing_receipts FOR ALL
USING (
    empresa_id IN (
        SELECT empresa_id FROM usuarios_empresa WHERE user_id = auth.uid()
    )
);

COMMIT;

-- Verificação
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'pdv_points',
    'cash_movements',
    'bank_reconciliation',
    'cash_audit_enhanced',
    'cash_reports_cache',
    'treasury_transfers',
    'discrepancy_handling',
    'cash_closing_receipts'
)
ORDER BY table_name;
