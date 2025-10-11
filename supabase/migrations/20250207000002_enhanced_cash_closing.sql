-- =====================================================
-- MIGRATION: Enhanced Cash Closing System
-- Descrição: Adiciona controle de transferência para tesouraria,
--            tratamento de discrepâncias e comprovantes de fechamento
-- Data: 2025-02-07
-- =====================================================

-- 1. Tabela de Transferências para Tesouraria
CREATE TABLE IF NOT EXISTS treasury_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authorized_by UUID NOT NULL REFERENCES profiles(id),
  recipient_name TEXT,
  destination TEXT NOT NULL,
  receipt_number TEXT,
  notes TEXT,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Tratamento de Discrepâncias
CREATE TABLE IF NOT EXISTS discrepancy_handling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  discrepancy_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('accepted', 'investigation', 'adjustment', 'pending')),
  approved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Comprovantes de Fechamento
CREATE TABLE IF NOT EXISTS cash_closing_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  receipt_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES profiles(id),
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_session ON treasury_transfers(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_date ON treasury_transfers(transferred_at);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_empresa ON treasury_transfers(empresa_id);

CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_session ON discrepancy_handling(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_action ON discrepancy_handling(action_taken);
CREATE INDEX IF NOT EXISTS idx_discrepancy_handling_empresa ON discrepancy_handling(empresa_id);

CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_session ON cash_closing_receipts(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_number ON cash_closing_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_cash_closing_receipts_empresa ON cash_closing_receipts(empresa_id);

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_treasury_transfers_updated_at
    BEFORE UPDATE ON treasury_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discrepancy_handling_updated_at
    BEFORE UPDATE ON discrepancy_handling
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Função para gerar número de comprovante
CREATE OR REPLACE FUNCTION generate_closing_receipt_number()
RETURNS TEXT AS $$
DECLARE
    receipt_num TEXT;
    date_part TEXT;
    sequence_num INTEGER;
BEGIN
    -- Formato: FECH-YYYYMMDD-NNNN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Buscar próximo número da sequência do dia
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 15) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM cash_closing_receipts
    WHERE receipt_number LIKE 'FECH-' || date_part || '-%';
    
    receipt_num := 'FECH-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para calcular breakdown de pagamentos
CREATE OR REPLACE FUNCTION calculate_payment_breakdown(p_session_id UUID)
RETURNS TABLE (
    payment_method TEXT,
    expected_amount DECIMAL(10,2),
    transaction_count INTEGER,
    transactions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.payment_method::TEXT,
        SUM(ct.amount)::DECIMAL(10,2) as expected_amount,
        COUNT(*)::INTEGER as transaction_count,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', ct.id,
                'amount', ct.amount,
                'processed_at', ct.processed_at,
                'reference_number', ct.reference_number,
                'customer_name', ct.customer_name
            )
        ) as transactions
    FROM cash_transactions ct
    WHERE ct.cash_session_id = p_session_id
        AND ct.transaction_type IN ('sale', 'refund', 'adjustment')
    GROUP BY ct.payment_method;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para validar fechamento de caixa
CREATE OR REPLACE FUNCTION validate_cash_closing(
    p_session_id UUID,
    p_closing_amount DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_discrepancy DECIMAL(10,2);
    v_requires_approval BOOLEAN;
    v_result JSONB;
BEGIN
    -- Buscar sessão
    SELECT * INTO v_session
    FROM cash_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'valid', false,
            'error', 'Sessão não encontrada'
        );
    END IF;
    
    IF v_session.status != 'open' THEN
        RETURN JSONB_BUILD_OBJECT(
            'valid', false,
            'error', 'Sessão já está fechada'
        );
    END IF;
    
    -- Calcular discrepância
    v_discrepancy := p_closing_amount - v_session.expected_amount;
    
    -- Verificar se requer aprovação (discrepância > R$ 50)
    v_requires_approval := ABS(v_discrepancy) > 50.00;
    
    v_result := JSONB_BUILD_OBJECT(
        'valid', true,
        'discrepancy', v_discrepancy,
        'requires_approval', v_requires_approval,
        'expected_amount', v_session.expected_amount,
        'closing_amount', p_closing_amount
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancy_handling ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closing_receipts ENABLE ROW LEVEL SECURITY;

-- Policy para treasury_transfers
CREATE POLICY "Usuários podem ver transferências da sua empresa"
    ON treasury_transfers FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar transferências"
    ON treasury_transfers FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy para discrepancy_handling
CREATE POLICY "Usuários podem ver discrepâncias da sua empresa"
    ON discrepancy_handling FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar registros de discrepância"
    ON discrepancy_handling FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar discrepâncias"
    ON discrepancy_handling FOR UPDATE
    USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy para cash_closing_receipts
CREATE POLICY "Usuários podem ver comprovantes da sua empresa"
    ON cash_closing_receipts FOR SELECT
    USING (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem criar comprovantes"
    ON cash_closing_receipts FOR INSERT
    WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 10. Comentários nas tabelas
COMMENT ON TABLE treasury_transfers IS 'Registra transferências de valores do caixa para tesouraria';
COMMENT ON TABLE discrepancy_handling IS 'Registra tratamento de discrepâncias no fechamento de caixa';
COMMENT ON TABLE cash_closing_receipts IS 'Armazena comprovantes de fechamento de caixa';

COMMENT ON COLUMN treasury_transfers.destination IS 'Destino da transferência (Cofre, Banco, Tesouraria Central, etc)';
COMMENT ON COLUMN discrepancy_handling.action_taken IS 'Ação tomada: accepted (aceito), investigation (em investigação), adjustment (ajuste), pending (pendente)';
COMMENT ON COLUMN cash_closing_receipts.receipt_data IS 'Dados completos do comprovante em formato JSON';

-- 11. Grants
GRANT SELECT, INSERT ON treasury_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON discrepancy_handling TO authenticated;
GRANT SELECT, INSERT ON cash_closing_receipts TO authenticated;

-- Fim da migration
