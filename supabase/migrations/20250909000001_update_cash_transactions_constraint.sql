-- Migration para adicionar novos tipos de transação no caixa
-- Criado em: 2025-01-09
-- Objetivo: Permitir saída de dinheiro e transferência para tesouraria

-- 1. Atualizar constraint da tabela cash_transactions para incluir novos tipos
ALTER TABLE cash_transactions 
DROP CONSTRAINT IF EXISTS cash_transactions_transaction_type_check;

ALTER TABLE cash_transactions 
ADD CONSTRAINT cash_transactions_transaction_type_check 
CHECK (transaction_type IN ('sale', 'refund', 'adjustment', 'tip', 'cash_withdrawal', 'treasury_transfer'));

-- 2. Atualizar comentário da tabela para documentar os novos tipos
COMMENT ON COLUMN cash_transactions.transaction_type IS 'Tipo: sale (venda), refund (estorno), adjustment (ajuste), tip (gorjeta), cash_withdrawal (saída de dinheiro), treasury_transfer (transferência para tesouraria)';

-- 3. Atualizar função do trigger para incluir novos tipos no cálculo
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
      WHEN transaction_type = 'refund' THEN -ABS(amount)
      WHEN transaction_type = 'adjustment' THEN amount
      WHEN transaction_type = 'tip' THEN amount
      WHEN transaction_type = 'cash_withdrawal' THEN amount -- Já vem negativo
      WHEN transaction_type = 'treasury_transfer' THEN amount -- Já vem negativo
      ELSE 0
    END
  ), 0)
  INTO session_total
  FROM cash_transactions
  WHERE cash_session_id = COALESCE(NEW.cash_session_id, OLD.cash_session_id);
  
  -- Calcular total apenas de dinheiro (incluindo saídas)
  SELECT COALESCE(SUM(
    CASE 
      WHEN transaction_type = 'sale' THEN amount
      WHEN transaction_type = 'refund' THEN -ABS(amount)
      WHEN transaction_type = 'adjustment' THEN amount
      WHEN transaction_type = 'tip' THEN amount
      WHEN transaction_type = 'cash_withdrawal' THEN amount -- Já vem negativo
      WHEN transaction_type = 'treasury_transfer' THEN amount -- Já vem negativo
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

-- 4. Atualizar função de auditoria para incluir novos tipos
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
      CASE 
        WHEN NEW.transaction_type = 'cash_withdrawal' THEN 'cash_withdrawal'
        WHEN NEW.transaction_type = 'treasury_transfer' THEN 'treasury_transfer'
        ELSE 'process_payment'
      END,
      COALESCE(NEW.processed_by, OLD.processed_by),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar constraint da tabela cash_audit_log para incluir novos action_types
ALTER TABLE cash_audit_log 
DROP CONSTRAINT IF EXISTS cash_audit_log_action_type_check;

ALTER TABLE cash_audit_log 
ADD CONSTRAINT cash_audit_log_action_type_check 
CHECK (action_type IN ('open_session', 'close_session', 'process_payment', 'adjustment', 'supervisor_override', 'cash_withdrawal', 'treasury_transfer'));

-- 6. Comentário final
COMMENT ON TABLE cash_transactions IS 'Todas as transações financeiras processadas no caixa - Atualizado com suporte a saída de dinheiro e transferência para tesouraria';