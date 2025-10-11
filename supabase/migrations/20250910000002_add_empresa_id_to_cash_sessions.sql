/*
  Adiciona coluna empresa_id à tabela cash_sessions
  
  Problema: A tabela cash_sessions não possui a coluna empresa_id,
  causando erro NOT NULL constraint ao tentar inserir sessões de caixa.
  
  Solução: Adicionar a coluna empresa_id com referência à tabela empresas
  e definir valor padrão para registros existentes.
*/

-- Adicionar coluna empresa_id à tabela cash_sessions
ALTER TABLE cash_sessions 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE RESTRICT;

-- Definir valor padrão para registros existentes (empresa padrão)
UPDATE cash_sessions 
SET empresa_id = '1'::uuid 
WHERE empresa_id IS NULL;

-- Tornar a coluna NOT NULL após definir valores padrão
ALTER TABLE cash_sessions 
ALTER COLUMN empresa_id SET NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN cash_sessions.empresa_id IS 'ID da empresa à qual a sessão de caixa pertence';

-- Criar índice para melhorar performance das consultas por empresa
CREATE INDEX IF NOT EXISTS idx_cash_sessions_empresa_id ON cash_sessions(empresa_id);