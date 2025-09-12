/*
  Correção da Constraint de Cash Sessions
  
  Problema identificado: A constraint original UNIQUE(employee_id, session_date, status)
  estava impedindo que funcionários tivessem múltiplas sessões fechadas no mesmo dia.
  
  Solução: Substituir por uma constraint que permite apenas uma sessão 'open' por
  funcionário por dia, mas permite múltiplas sessões 'closed' ou 'reconciled'.
*/

-- Remover a constraint problemática que impedia múltiplas sessões fechadas
ALTER TABLE cash_sessions DROP CONSTRAINT IF EXISTS cash_sessions_employee_id_session_date_status_key;

-- Criar índice único parcial que permite apenas uma sessão 'open' por funcionário por dia
-- mas permite múltiplas sessões 'closed' ou 'reconciled'
CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_unique_open_session 
ON cash_sessions (employee_id, session_date) 
WHERE status = 'open';

-- Adicionar comentário explicativo
COMMENT ON INDEX cash_sessions_unique_open_session IS 'Garante apenas uma sessão aberta por funcionário por dia, mas permite múltiplas sessões fechadas';

-- Adicionar comentário na tabela sobre a nova lógica
COMMENT ON TABLE cash_sessions IS 'Sessões diárias de caixa por funcionário. Permite múltiplas sessões fechadas no mesmo dia, mas apenas uma aberta.';